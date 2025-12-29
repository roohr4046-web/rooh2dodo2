import React from 'react';
import { IconCode } from './Icons';

export const BackendGuide: React.FC = () => {
  const pythonCode = `
import os
import time
import shutil
import boto3
import ffmpeg
import firebase_admin
from firebase_admin import credentials, firestore

# =========================================================
#  CONFIGURATION: CLOUDSTREAM ENGINE (R2 + HLS)
# =========================================================

# 1. Cloudflare R2 Credentials (S3 Compatible)
# بيانات حسابك الخاصة - تم دمجها
R2_ACCOUNT_ID = "6ec2273e65fd69c15933ae976f28e832"
R2_ACCESS_KEY = "f6c09d86df5b3b4aad043a4d627ccdb7"
R2_SECRET_KEY = "398acd5ca50bde7c32d4c000b41b56c73a07417d13e85a7f9f405e93d83f45fc"

BUCKET_NAME = "rooh2dodo"
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
PUBLIC_DOMAIN = "https://pub-6ec2273e65fd69c15933ae976f28e832.r2.dev" 

# 2. Firebase Setup
cred = credentials.Certificate('firebase_key.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# 3. R2 Client Setup (Boto3)
s3 = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY
)

# قائمة الأقسام (للتأكد من مطابقة الأسماء إذا لزم الأمر)
CATEGORIES_MAP = {
    'horror_attacks': 'هجمات_مرعبة',
    'true_horror': 'رعب_حقيقي',
    'animal_horror': 'رعب_الحيوانات',
    'dangerous_scenes': 'أخطر_المشاهد',
    'terrifying_horrors': 'أهوال_مرعبة',
    'horror_comedy': 'رعب_كوميدي',
    'scary_moments': 'لحظات_مرعبة',
    'shock': 'صدمة'
}

def get_dir_size(path):
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)
    return total_size

# =========================================================
#  STORAGE MONITORING (إحصائيات التخزين)
# =========================================================
def get_storage_stats():
    """
    تقوم هذه الدالة بحساب عدد الفيديوهات والمساحة المستهلكة في R2
    """
    total_size = 0
    video_count = 0
    
    print("📊 جاري حساب استهلاك التخزين...")
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=BUCKET_NAME):
        if 'Contents' in page:
            for obj in page['Contents']:
                total_size += obj['Size']
                # نعد ملفات الفهرس فقط لمعرفة عدد الفيديوهات
                if obj['Key'].endswith('index.m3u8'):
                    video_count += 1
                    
    total_gb = total_size / (1024 ** 3)
    print(f"   -> عدد الفيديوهات: {video_count}")
    print(f"   -> المساحة الكلية: {total_gb:.2f} GB")
    return video_count, total_gb

# =========================================================
#  DELETION LOGIC (حذف الفيديو)
# =========================================================
def delete_video_from_r2(video_id, category_label):
    """
    حذف مجلد الفيديو بالكامل من السحابة لتوفير المساحة
    """
    safe_category = category_label.replace(" ", "_")
    prefix = f"videos/{safe_category}/{video_id}/"
    
    print(f"🗑️ جاري حذف الفيديو {video_id} من {prefix}...")
    
    # حذف جميع الملفات داخل المجلد
    objects_to_delete = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)
    if 'Contents' in objects_to_delete:
        for obj in objects_to_delete['Contents']:
            s3.delete_object(Bucket=BUCKET_NAME, Key=obj['Key'])
            
    print("✅ تم الحذف بنجاح.")

def transcode_hls_3sec(input_path, output_dir, crop_bottom=0):
    """
    يقوم بتحويل الفيديو إلى HLS مع تقطيع صارم (3 ثوانٍ) للحصول على سرعة تشغيل قصوى.
    تم إضافة أوامر ضغط عالية لتقليل الحجم.
    """
    try:
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # بداية إعداد FFmpeg
        stream = ffmpeg.input(input_path)

        # 1. فلتر القص (إزالة العلامة المائية السفلية)
        if crop_bottom > 0:
            # in_w: العرض الأصلي
            # in_h-crop_bottom: الارتفاع الجديد (من الأعلى)
            print(f"✂️  جاري قص {crop_bottom}px من الأسفل...")
            stream = stream.filter('crop', 'in_w', f'in_h-{crop_bottom}', 0, 0)

        # 2. إعدادات التقطيع والضغط (HLS 3 Seconds + High Compression)
        stream = stream.output(
            f"{output_dir}/index.m3u8",
            format='hls',
            start_number=0,
            hls_time=3,             # مدة القطعة 3 ثوانٍ
            hls_list_size=0,        # إدراج جميع القطع في الملف النهائي
            hls_segment_filename=f"{output_dir}/seg_%03d.ts",
            **{
                'c:v': 'libx264',   # كوديك الفيديو
                'preset': 'fast',   # سرعة المعالجة
                'b:v': '800k',      # <--- تقليل معدل البت لتوفير المساحة
                'maxrate': '1M',    # <--- أقصى معدل بت لحظي
                'bufsize': '1.5M',  # <--- حجم البفر
                'c:a': 'aac',       # كوديك الصوت
                'b:a': '128k'       # جودة الصوت
            }
        )

        # تنفيذ الأمر
        # الأمر النهائي سيبدو كالتالي:
        # ffmpeg -i input.mp4 -vf "crop..." -c:v libx264 -b:v 800k -maxrate 1M -bufsize 1.5M -hls_time 3 -hls_list_size 0 ...
        ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)
        print("✅  تم التقطيع والضغط بنجاح (Segments: 3s, Bitrate: 800k).")
        return True

    except ffmpeg.Error as e:
        print(f"❌  خطأ في FFmpeg: {e.stderr.decode('utf8')}")
        return False

def upload_folder_to_r2(local_folder, video_id, category_label="عام"):
    """
    يرفع المجلد بالكامل إلى المسار: videos/Category_Name/Video_ID/files...
    ⛔ هام: لا يتم رفع ملف MP4 الأصلي أبداً. يتم فقط رفع مجلد HLS الناتج.
    """
    # استبدال المسافات بشرطات سفلية في اسم القسم لسلامة الرابط
    safe_category = category_label.replace(" ", "_")
    
    print(f"☁️  جاري الرفع إلى R2 (Bucket: {BUCKET_NAME}, Category: {safe_category})...")
    
    uploaded_files = 0
    for root, dirs, files in os.walk(local_folder):
        for file in files:
            local_path = os.path.join(root, file)
            
            # بناء المسار السحابي الجديد: videos/[Category]/[VideoID]/filename
            cloud_key = f"videos/{safe_category}/{video_id}/{file}"
            
            # تحديد نوع الملف بدقة
            content_type = 'application/x-mpegURL' if file.endswith('.m3u8') else 'video/MP2T'
            
            s3.upload_file(
                local_path, 
                BUCKET_NAME, 
                cloud_key,
                ExtraArgs={'ContentType': content_type}
            )
            uploaded_files += 1
            print(f"   -> تم رفع: {file} إلى {cloud_key}")
            
    print(f"📦  تم رفع {uploaded_files} ملفات.")
    
    # إرجاع الرابط النهائي
    return f"{PUBLIC_DOMAIN}/videos/{safe_category}/{video_id}/index.m3u8"

def process_queue():
    """
    مراقب النظام: يبحث عن الفيديوهات الجديدة ويعالجها واحداً تلو الآخر
    """
    print("👀  بانتظار مهام جديدة...")
    
    # الاستماع للفيديوهات بحالة PENDING أو PROCESSING_FFMPEG
    docs = db.collection('videos').where('status', '==', 'PROCESSING_FFMPEG').stream()
    
    for doc in docs:
        data = doc.to_dict()
        video_id = doc.id
        filename = data.get('filename')
        
        # استخراج الميتاداتا والقسم
        metadata = data.get('metadata', {})
        crop_val = metadata.get('cropBottom', 0)
        category_id = metadata.get('category', 'general')
        
        # الحصول على الاسم العربي للقسم أو استخدام المعرف إذا لم يوجد
        category_label = CATEGORIES_MAP.get(category_id, category_id)

        # مسار الملف الخام (يفترض أنه تم رفعه مسبقاً للسيرفر المؤقت)
        raw_path = f"./uploads/{filename}"
        output_dir = f"./processed/{video_id}"

        if os.path.exists(raw_path):
            print(f"🚀  بدء معالجة: {filename} (القسم: {category_label})")
            
            # 1. التحويل والتقطيع
            success = transcode_hls_3sec(raw_path, output_dir, crop_bottom=crop_val)
            
            if success:
                # حساب الحجم بعد الضغط
                compressed_bytes = get_dir_size(output_dir)
                compressed_mb = f"{compressed_bytes / (1024*1024):.2f} MB"

                # تحديث الحالة: جاري الرفع
                doc.reference.update({'status': 'UPLOADING_R2', 'progress': 50})
                
                # 2. الرفع مع تمرير اسم القسم
                # يتم رفع مجلد الـ output_dir فقط، وليس الـ raw_path
                final_url = upload_folder_to_r2(output_dir, video_id, category_label=category_label)
                
                # 3. إنهاء وحفظ البيانات النهائية في قاعدة البيانات
                doc.reference.update({
                    'status': 'PUBLISHED',
                    'progress': 100,
                    'hls_url': final_url, 
                    'compressedSize': compressed_mb, 
                    'processed_at': firestore.SERVER_TIMESTAMP,
                })
                
                # تحديث إحصائيات التخزين بعد الرفع
                get_storage_stats()

                # تنظيف الملفات المؤقتة + حذف ملف MP4 الأصلي
                shutil.rmtree(output_dir)
                os.remove(raw_path) # <--- حذف الأصل لتوفير مساحة السيرفر ومنع رفعه
                print(f"🎉  الفيديو جاهز! الرابط: {final_url}\n")
            else:
                doc.reference.update({'status': 'ERROR'})

# تشغيل المراقب في حلقة لا نهائية
if __name__ == "__main__":
    while True:
        process_queue()
        time.sleep(5) # فحص كل 5 ثواني
`;

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans text-right" dir="rtl">
      <div className="mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-white mb-2">محرك المعالجة الخلفي (Streaming Engine)</h1>
        <p className="text-slate-400">
          هذا الكود هو القلب النابض للنظام. تم تحديثه ليقوم <span className="text-yellow-400 font-bold">بفرز الفيديوهات في مجلدات حسب القسم</span> (مثل: هجمات_مرعبة) داخل حاوية R2.
        </p>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden" dir="ltr">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-700">
          <span className="text-sm font-mono text-green-400">backend_worker.py</span>
          <div className="flex space-x-2">
             <span className="w-3 h-3 rounded-full bg-red-500/20"></span>
             <span className="w-3 h-3 rounded-full bg-yellow-500/20"></span>
             <span className="w-3 h-3 rounded-full bg-green-500/20"></span>
          </div>
        </div>
        <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
          <code>{pythonCode}</code>
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-blue-900/10 p-6 rounded-lg border border-blue-500/20">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
             ⚡ Folder Structure
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed font-mono text-left" dir="ltr">
            Bucket/videos/[Category]/[VideoID]/index.m3u8
          </p>
        </div>
        <div className="bg-purple-900/10 p-6 rounded-lg border border-purple-500/20">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
             ☁️ FFmpeg Settings
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono text-left break-all" dir="ltr">
            -b:v 800k -maxrate 1M -bufsize 1.5M -hls_time 3
          </p>
        </div>
      </div>
    </div>
  );
};