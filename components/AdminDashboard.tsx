import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { VideoAsset, VideoStatus } from '../types';
import { IconUpload, IconSparkles, IconCheck, IconEye, IconSend, IconX, IconScissors, IconServer, IconPlay, IconDownload, IconEdit, IconLink, IconExternalLink, IconCopy, IconTrash } from './Icons';
import { generateVideoMetadata } from '../services/geminiService';

interface AdminDashboardProps {
  videos: VideoAsset[];
  setVideos: React.Dispatch<React.SetStateAction<VideoAsset[]>>;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

// الأقسام الجديدة (تصنيف الرعب)
const CATEGORIES = [
    { id: 'horror_attacks', label: 'هجمات مرعبة' },
    { id: 'true_horror', label: 'رعب حقيقي' },
    { id: 'animal_horror', label: 'رعب الحيوانات' },
    { id: 'dangerous_scenes', label: 'أخطر المشاهد' },
    { id: 'terrifying_horrors', label: 'أهوال مرعبة' },
    { id: 'horror_comedy', label: 'رعب كوميدي' },
    { id: 'scary_moments', label: 'لحظات مرعبة' },
    { id: 'shock', label: 'صدمة' }
];

// نطاق المستخدم العام (R2 Public Domain)
const USER_PUBLIC_DOMAIN = "https://pub-6ec2273e65fd69c15933ae976f28e832.r2.dev";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ videos, setVideos }) => {
  // الحالة الخاصة بالفيديو الذي يتم العمل عليه حالياً في المربع العلوي
  const [activeDraft, setActiveDraft] = useState<VideoAsset | null>(null);
  
  // حالة الفيديو المراد معاينته من الأرشيف
  const [previewArchivedVideo, setPreviewArchivedVideo] = useState<VideoAsset | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload/Crop, 2: AI Generation, 3: Review/Send
  const [isGenerating, setIsGenerating] = useState(false);
  
  // حالة زر النشر (idle = أحمر، success = أخضر)
  const [publishStatus, setPublishStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // نظام الإشعارات (Toasts)
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // إخفاء الإشعار تلقائياً بعد 3 ثواني
    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const newDraft: VideoAsset = {
            id: Math.random().toString(36).substring(7),
            filename: file.name,
            file: file,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            status: VideoStatus.PENDING,
            progress: 0,
            uploadDate: new Date(),
            metadata: {
                title: '',
                description: '',
                tags: [],
                category: CATEGORIES[0].id,
                aiGenerated: false,
                cropBottom: 0,
                isShorts: false // الافتراضي 16:9
            }
        };
        setActiveDraft(newDraft);
        setStep(1); // البدء بمرحلة القص
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'video/*': []}, multiple: false });

  // 1. حفظ إعدادات القص والانتقال للذكاء الاصطناعي
  const saveCropSettings = () => {
      setStep(2);
  };

  // 2. توليد البيانات بالذكاء الاصطناعي
  const triggerAI = async () => {
      if (!activeDraft) return;
      setIsGenerating(true);
      
      // محاكاة وقت المعالجة
      await new Promise(r => setTimeout(r, 1000));
      const metadata = await generateVideoMetadata(activeDraft.filename);
      
      setActiveDraft(prev => prev ? ({
          ...prev,
          metadata: {
              ...prev.metadata!,
              title: metadata.title,
              description: metadata.description,
              tags: metadata.tags,
              aiGenerated: true
          }
      }) : null);

      setIsGenerating(false);
      setStep(3); // الانتقال للمراجعة النهائية
  };

  // 3. الإرسال النهائي: نقل للمستودع وتشغيل المحاكاة في الخلفية
  const publishVideo = async () => {
      if (!activeDraft) return;

      // تغيير الحالة إلى "جاري الإرسال"
      setPublishStatus('sending');

      // محاكاة وقت الاتصال بالمستودع (مثلاً 1 ثانية)
      await new Promise(r => setTimeout(r, 1000));

      // تغيير الحالة إلى "تم بنجاح" (أخضر)
      setPublishStatus('success');
      addToast('تم إرسال الفيديو للمعالجة بنجاح!', 'success');

      // الانتظار قليلاً ليرى المستخدم اللون الأخضر قبل إخفاء الواجهة
      await new Promise(r => setTimeout(r, 1500));

      // إنشاء كائن الفيديو النهائي بحالة "جاري الرفع"
      const finalVideo: VideoAsset = { 
          ...activeDraft, 
          status: VideoStatus.PROCESSING_FFMPEG, // يبدأ بالمعالجة
          progress: 0 
      };
      
      // إذا كان الفيديو موجوداً مسبقاً (تعديل)، نحدثه بدلاً من إضافته كجديد
      const exists = videos.find(v => v.id === finalVideo.id);
      if (exists) {
          setVideos(prev => prev.map(v => v.id === finalVideo.id ? finalVideo : v));
      } else {
          setVideos(prev => [finalVideo, ...prev]);
      }
      
      // تفريغ الاستوديو لاستقبال فيديو جديد وإعادة تعيين الزر
      setActiveDraft(null); 
      setStep(1);
      setPublishStatus('idle');

      // بدء محاكاة الرفع والقص في الخلفية (Concurrent Simulation)
      startBackgroundProcessing(finalVideo.id, finalVideo.size);
  };

  // استرجاع فيديو للتعديل
  const handleEditVideo = (video: VideoAsset) => {
      // نسخ الفيديو إلى المسودة
      setActiveDraft({
          ...video,
          // إعادة تعيين الحالة للسماح بالتعديل
          status: VideoStatus.PENDING 
      });
      // الذهاب مباشرة للخطوة الثالثة لتعديل البيانات، ويمكنه العودة للقص إذا أراد
      setStep(3);
      // سكرول للأعلى
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // حذف الفيديو من المستودع
  const handleDeleteVideo = (videoId: string, filename: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الفيديو "${filename}"؟\nسيتم حذفه من المستودع وتوفير المساحة.`)) {
        setVideos(prev => prev.filter(v => v.id !== videoId));
        addToast("تم حذف الفيديو من المستودع بنجاح", "success");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('تم نسخ الرابط للحافظة', 'success');
  };

  // وظيفة محاكاة العمليات الخلفية (FFmpeg + Upload)
  const startBackgroundProcessing = (videoId: string, originalSizeStr: string) => {
      let currentProgress = 0;
      const speed = Math.random() * 2 + 1; 

      const interval = setInterval(() => {
          currentProgress += speed;

          setVideos(currentVideos => {
              // إذا تم حذف الفيديو أثناء المعالجة، نوقف العملية
              if (!currentVideos.find(v => v.id === videoId)) {
                  clearInterval(interval);
                  return currentVideos;
              }

              return currentVideos.map(v => {
                  if (v.id !== videoId) return v;

                  // تحديث الحالة بناءً على التقدم
                  let newStatus = v.status;
                  let compressedSize = v.compressedSize;
                  let hlsUrl = v.hlsUrl;

                  if (currentProgress < 50) newStatus = VideoStatus.PROCESSING_FFMPEG; // قص وتقطيع وضغط
                  else if (currentProgress < 90) newStatus = VideoStatus.UPLOADING_R2; // رفع
                  else if (currentProgress >= 100) newStatus = VideoStatus.PUBLISHED; // تم

                  // محاكاة حساب الحجم وتوليد الرابط عند الانتهاء
                  if (currentProgress >= 100 && !compressedSize) {
                      const originalSize = parseFloat(originalSizeStr.replace(/[^0-9.]/g, ''));
                      const unit = originalSizeStr.replace(/[0-9.]/g, '').trim();
                      
                      // تحديث المحاكاة لتعكس الضغط العالي (800k bitrate)
                      // نتوقع انخفاض الحجم لحوالي 15-20% من الأصل للفيديوهات عالية الجودة
                      const compressed = (originalSize * 0.20).toFixed(2); 
                      compressedSize = `${compressed} ${unit}`;
                      
                      // 1. استخراج اسم القسم المختار
                      const categoryObj = CATEGORIES.find(c => c.id === v.metadata?.category);
                      // استبدال المسافات بشرطة سفلية لضمان سلامة الرابط
                      const categoryFolder = categoryObj ? categoryObj.label.replace(/\s+/g, '_') : 'عام';

                      // 2. توليد رابط البث النهائي (HLS .m3u8) بناءً على القسم
                      // Structure: DOMAIN / videos / CATEGORY / VIDEO_ID / index.m3u8
                      hlsUrl = `${USER_PUBLIC_DOMAIN}/videos/${categoryFolder}/${videoId}/index.m3u8`;

                      clearInterval(interval);
                      // إشعار اكتمال المعالجة
                      if (v.status !== VideoStatus.PUBLISHED) {
                          // نستخدم setTimeout لتجنب مشاكل التحديث داخل الـ render cycle
                          setTimeout(() => addToast(`تم نشر الفيديو "${v.filename}" بنجاح!`, 'success'), 0);
                      }
                      return { ...v, progress: 100, status: VideoStatus.PUBLISHED, compressedSize, hlsUrl };
                  }

                  return { ...v, progress: Math.min(Math.round(currentProgress), 99), status: newStatus, compressedSize, hlsUrl };
              });
          });
      }, 200);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto font-sans pb-24 md:pb-8 relative">
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`
              pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-2xl shadow-black/50 border animate-slide-in-left
              ${toast.type === 'success' ? 'bg-slate-900 border-green-500/50 text-green-400' : 'bg-slate-900 border-red-500/50 text-red-400'}
            `}
          >
            {toast.type === 'success' ? <IconCheck /> : <IconX />}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        ))}
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">استوديو التحكم المركزي</h1>
        <p className="text-slate-400 text-sm">قم بسحب الفيديو، تعديله، توليد وصفه، ثم إرساله للخادم للضغط (High Compression)، التقطيع، والبث (HLS Streaming).</p>
      </header>

      {/* =====================================================================================
          الجزء العلوي: مربع العمليات (الاستوديو)
         ===================================================================================== */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl mb-10 transition-all">
        
        {/* حالة 1: لا يوجد فيديو (مربع الرفع) */}
        {!activeDraft && (
            <div 
                {...getRootProps()} 
                className={`
                h-[400px] flex flex-col items-center justify-center cursor-pointer transition-all
                ${isDragActive ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900 hover:bg-slate-800'}
                border-2 border-dashed border-slate-700 m-2 rounded-xl group
                `}
            >
                <input {...getInputProps()} />
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <IconUpload />
                </div>
                <h2 className="text-xl font-bold text-slate-200">اضغط هنا لإضافة فيديو</h2>
                <p className="text-slate-500 mt-2">أو اسحب الملف إلى داخل المربع</p>
            </div>
        )}

        {/* حالة 2: يوجد فيديو (واجهة التعديل) */}
        {activeDraft && (
            <div className="flex flex-col md:flex-row h-auto md:h-[500px]">
                
                {/* يمين: معاينة الفيديو والقص */}
                <div className="w-full md:w-1/2 bg-black relative flex flex-col border-b md:border-b-0 md:border-l border-slate-800">
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-950">
                        {activeDraft.file && (
                             /* تثبيت المقاسات بصرامة: إما 16:9 (فيديو) أو 9:16 (شورتس) */
                             <div 
                                className={`relative transition-all duration-300 shadow-2xl overflow-hidden bg-black group
                                ${activeDraft.metadata?.isShorts 
                                    ? 'aspect-[9/16] h-[90%]' // شورتس: الارتفاع يحكم
                                    : 'aspect-video w-[95%]' // عادي: العرض يحكم
                                }`}
                             >
                                <video 
                                    src={URL.createObjectURL(activeDraft.file)} 
                                    controls={false}
                                    autoPlay loop muted
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* طبقة توضيح القص (Overlay) */}
                                {(activeDraft.metadata?.cropBottom || 0) > 0 && (
                                     <div 
                                        className="absolute bottom-0 left-0 right-0 bg-red-600/80 border-t border-red-500 flex items-center justify-center backdrop-blur-[1px] z-10"
                                        style={{ height: activeDraft.metadata?.isShorts 
                                            ? `${((activeDraft.metadata?.cropBottom || 0) / 600) * 100}%` // نسبة تقريبية للطول
                                            : `${((activeDraft.metadata?.cropBottom || 0) / 400) * 100}%` 
                                        }} 
                                     >
                                        <span className="text-[10px] text-white font-bold bg-black/50 px-2 rounded whitespace-nowrap">
                                            قص {activeDraft.metadata?.cropBottom}px
                                        </span>
                                     </div>
                                )}
                             </div>
                        )}
                        <button 
                            onClick={() => setActiveDraft(null)} 
                            className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-30"
                            title="إلغاء وحذف"
                        >
                            <IconX />
                        </button>
                    </div>

                    {/* أدوات التحكم في القص (تظهر دائماً) */}
                    <div className="p-4 bg-slate-950 border-t border-slate-800 relative z-30">
                        
                        {/* أزرار التبديل الصارمة للمقاس */}
                        <div className="flex gap-2 mb-4">
                            <button 
                                onClick={() => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, isShorts: false}})}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${!activeDraft.metadata?.isShorts ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                            >
                                فيديو (16:9)
                            </button>
                            <button 
                                onClick={() => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, isShorts: true}})}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${activeDraft.metadata?.isShorts ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                            >
                                شورتس (9:16)
                            </button>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><IconScissors /> قص من الأسفل (Watermark)</span>
                             <span className="text-xs font-mono text-blue-400">{activeDraft.metadata?.cropBottom}px</span>
                        </div>
                        <input 
                            type="range" min="0" max="200" step="10"
                            value={activeDraft.metadata?.cropBottom || 0}
                            onChange={(e) => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, cropBottom: parseInt(e.target.value)}})}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-1"
                        />
                    </div>
                </div>

                {/* يسار: الخطوات والبيانات */}
                <div className="w-full md:w-1/2 flex flex-col">
                    
                    {/* شريط المراحل */}
                    <div className="flex border-b border-slate-800">
                        <button onClick={() => setStep(1)} className={`flex-1 py-3 text-center text-xs font-bold transition-colors ${step >= 1 ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>1. المقاسات</button>
                        <button onClick={() => setStep(2)} disabled={step < 2} className={`flex-1 py-3 text-center text-xs font-bold transition-colors ${step >= 2 ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>2. الذكاء الاصطناعي</button>
                        <button onClick={() => setStep(3)} disabled={step < 3} className={`flex-1 py-3 text-center text-xs font-bold transition-colors ${step >= 3 ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>3. التصنيف والنشر</button>
                    </div>

                    <div className="flex-1 p-6 relative overflow-y-auto">
                        
                        {/* مرحلة 1: تأكيد القص */}
                        {step === 1 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                                    <IconScissors />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">ضبط الفيديو</h3>
                                    <p className="text-slate-400 text-sm mt-1 px-8">تم ضبط المقاس على <span className="text-white font-bold">{activeDraft.metadata?.isShorts ? 'Shorts 9:16' : 'Video 16:9'}</span>. تأكد من إزالة أي علامات مائية.</p>
                                </div>
                                <button 
                                    onClick={saveCropSettings}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 w-full max-w-xs"
                                >
                                    حفظ الإعدادات والتالي
                                </button>
                            </div>
                        )}

                        {/* مرحلة 2: زر الذكاء الاصطناعي */}
                        {step === 2 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-purple-300 ${isGenerating ? 'bg-purple-900/50 animate-pulse' : 'bg-purple-900/20'}`}>
                                    <IconSparkles />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">المساعد الذكي</h3>
                                    <p className="text-slate-400 text-sm mt-1 px-8">دع Gemini يقوم بتحليل الفيديو وكتابة العنوان والوصف المناسبين.</p>
                                </div>
                                <button 
                                    onClick={triggerAI}
                                    disabled={isGenerating}
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-900/20 w-full max-w-xs flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? 'جاري التحليل...' : 'توليد البيانات (AI)'}
                                </button>
                            </div>
                        )}

                        {/* مرحلة 3: النموذج النهائي */}
                        {step === 3 && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <IconServer />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-1">تجهيز البيانات للمستودع</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                سيتم إرسال العنوان والوصف والتصنيف أدناه كـ 
                                                <span className="text-blue-400 font-mono mx-1">Metadata</span> 
                                                إلى قاعدة البيانات فقط. لن تظهر هذه النصوص فوق الفيديو نفسه.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 font-bold mb-1 block">العنوان (Database Title)</label>
                                    <input 
                                        type="text" 
                                        value={activeDraft.metadata?.title}
                                        onChange={(e) => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, title: e.target.value}})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        placeholder="اكتب العنوان هنا..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold mb-1 block">الوصف (Database Description)</label>
                                    <textarea 
                                        rows={4}
                                        value={activeDraft.metadata?.description}
                                        onChange={(e) => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, description: e.target.value}})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none"
                                        placeholder="اكتب وصف الفيديو للمستودع..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold mb-1 block">القسم (Category Tag)</label>
                                    <div className="relative">
                                        <select 
                                            value={activeDraft.metadata?.category}
                                            onChange={(e) => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, category: e.target.value}})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white appearance-none focus:border-blue-500 outline-none"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* زر الإجراء النهائي */}
                    {step === 3 && (
                        <div className="p-4 border-t border-slate-800 bg-slate-900">
                             <button 
                                onClick={publishVideo}
                                disabled={publishStatus !== 'idle'}
                                className={`
                                    w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all duration-300
                                    ${publishStatus === 'idle' 
                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
                                        : publishStatus === 'sending'
                                            ? 'bg-red-700 text-slate-200 cursor-not-allowed opacity-80'
                                            : 'bg-green-600 text-white scale-105 shadow-green-900/30'
                                    }
                                `}
                            >
                                {publishStatus === 'idle' && (
                                    <><IconSend /> إرسال إلى المستودع السحابي</>
                                )}
                                {publishStatus === 'sending' && (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> جاري الاتصال بالمستودع...</>
                                )}
                                {publishStatus === 'success' && (
                                    <><IconCheck /> تم الإرسال بنجاح ✅</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* =====================================================================================
          الجزء السفلي: أرشيف الفيديوهات
         ===================================================================================== */}
      <div className="mt-8">
        <h3 className="text-slate-400 font-bold text-sm mb-4 flex items-center gap-2">
            <IconServer /> الأرشيف والمرسلات الحديثة
            <span className="bg-slate-800 px-2 rounded-full text-xs text-slate-500">{videos.length}</span>
        </h3>
        
        {videos.length === 0 ? (
             <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-600 text-sm">
                 لم يتم إرسال أي فيديوهات بعد.
             </div>
        ) : (
            <div className="grid gap-3">
                {videos.map((video) => (
                    <div 
                        key={video.id} 
                        className={`
                            border rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-4 transition-all relative overflow-hidden
                            ${video.status === VideoStatus.PUBLISHED ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-slate-900 border-blue-900/30'}
                        `}
                    >
                        {/* خلفية شريط التقدم للفيديوهات قيد المعالجة */}
                        {video.status !== VideoStatus.PUBLISHED && (
                            <div className="absolute inset-0 bg-blue-900/10 z-0 pointer-events-none">
                                <div 
                                    className="h-full bg-blue-900/20 transition-all duration-300 ease-linear" 
                                    style={{ width: `${video.progress}%` }}
                                ></div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 relative z-10 flex-1">
                            <div 
                                className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center text-slate-500 cursor-pointer hover:bg-blue-600 hover:text-white transition-colors group"
                                onClick={() => setPreviewArchivedVideo(video)}
                            >
                                <div className="hidden group-hover:block"><IconPlay /></div>
                                <div className="block group-hover:hidden text-[10px] font-bold">{video.metadata?.isShorts ? '9:16' : '16:9'}</div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="text-slate-200 font-bold truncate text-sm">{video.metadata?.title || video.filename}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                                        {CATEGORIES.find(c => c.id === video.metadata?.category)?.label || 'عام'}
                                    </span>
                                    
                                    {/* عرض الحجم قبل وبعد الضغط بتصميم محسّن */}
                                    <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded border border-slate-800 text-[10px] font-mono">
                                        <span className="text-slate-500 line-through" title="الحجم الأصلي">{video.size}</span>
                                        {video.compressedSize && (
                                            <>
                                                <span className="text-slate-600">➜</span>
                                                <span className="text-green-400 font-bold" title="بعد الضغط">{video.compressedSize}</span>
                                            </>
                                        )}
                                    </div>

                                    {/* عرض الرابط النهائي بعد النشر */}
                                    {video.status === VideoStatus.PUBLISHED && video.hlsUrl && (
                                        <div className="flex items-center gap-1 bg-green-900/20 border border-green-500/30 pl-1 pr-1 rounded overflow-hidden max-w-[250px] md:max-w-[400px]">
                                             <div className="bg-green-900/40 p-1 text-green-400" title="HLS .m3u8">
                                                <IconLink />
                                             </div>
                                             
                                             <a 
                                                href={video.hlsUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-green-400 font-mono truncate hover:underline flex-1 px-1"
                                                title="اضغط لفتح رابط البث"
                                             >
                                                {video.hlsUrl}
                                             </a>

                                             {/* Copy Button */}
                                             <button 
                                                onClick={(e) => { e.preventDefault(); copyToClipboard(video.hlsUrl!); }}
                                                className="p-1 text-green-400 hover:text-white hover:bg-green-600/50 rounded transition-colors"
                                                title="نسخ الرابط"
                                             >
                                                <IconCopy />
                                             </button>

                                             {/* Open Button */}
                                             <a href={video.hlsUrl} target="_blank" className="p-1 text-green-300 hover:text-white hover:bg-green-600/50 rounded transition-colors" title="فتح في نافذة جديدة">
                                                <IconExternalLink />
                                             </a>
                                        </div>
                                    )}
                                    
                                    {/* حالة الرفع */}
                                    {video.status === VideoStatus.PROCESSING_FFMPEG && (
                                        <span className="text-[10px] text-yellow-400 animate-pulse flex items-center gap-1">
                                            • جاري القص والضغط ({video.progress}%)
                                        </span>
                                    )}
                                    {video.status === VideoStatus.UPLOADING_R2 && (
                                        <span className="text-[10px] text-blue-400 animate-pulse flex items-center gap-1">
                                            • جاري الرفع للسحابة ({video.progress}%)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* أيقونات الحالة والتحميل والتعديل والحذف */}
                        <div className="flex items-center gap-2 relative z-10 md:justify-end">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleEditVideo(video); }}
                                className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors"
                                title="تعديل الفيديو"
                            >
                                <IconEdit />
                            </button>

                            {/* زر الحذف الجديد */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteVideo(video.id, video.filename); }}
                                className="w-8 h-8 flex items-center justify-center bg-slate-800 text-red-500 rounded-full hover:bg-red-900/50 hover:text-red-300 transition-colors border border-transparent hover:border-red-800"
                                title="حذف من المستودع"
                            >
                                <IconTrash />
                            </button>

                            {video.status === VideoStatus.PUBLISHED ? (
                                <>
                                    <button 
                                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-green-400 transition-colors" 
                                        title="تحميل الملف"
                                        onClick={(e) => { e.stopPropagation(); alert(`تنزيل الملف: ${video.filename}`); }}
                                    >
                                        <IconDownload />
                                    </button>
                                    <div className="text-green-500 px-2" title="تم النشر">
                                        <IconCheck />
                                    </div>
                                </>
                            ) : (
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* =====================================================================================
          نافذة معاينة الفيديو من الأرشيف (Modal)
         ===================================================================================== */}
      {previewArchivedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewArchivedVideo(null)}>
            <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <IconEye /> معاينة: {previewArchivedVideo.metadata?.title}
                    </h3>
                    <button onClick={() => setPreviewArchivedVideo(null)} className="text-slate-500 hover:text-white">
                        <IconX />
                    </button>
                </div>
                <div className="bg-black aspect-video flex items-center justify-center relative">
                    {previewArchivedVideo.file ? (
                        <video 
                            src={URL.createObjectURL(previewArchivedVideo.file)} 
                            controls 
                            autoPlay
                            className={`max-h-[60vh] ${previewArchivedVideo.metadata?.isShorts ? 'aspect-[9/16]' : 'w-full'}`}
                        />
                    ) : (
                        <div className="text-center">
                            <p className="text-slate-500 mb-2">الملف الأصلي غير موجود في المتصفح.</p>
                            <p className="text-xs text-slate-700">في النظام الحقيقي، سيتم جلب رابط HLS من Cloudflare.</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-900 grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                        <span className="text-slate-500 block text-xs mb-1">رابط البث النهائي (HLS Streaming URL)</span>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                readOnly 
                                value={previewArchivedVideo.hlsUrl || 'قيد المعالجة...'} 
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-green-400 font-mono text-xs select-all"
                            />
                            {previewArchivedVideo.hlsUrl && (
                                <>
                                    <button 
                                        onClick={() => copyToClipboard(previewArchivedVideo.hlsUrl!)}
                                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded flex items-center justify-center font-bold text-xs gap-1"
                                        title="نسخ الرابط"
                                    >
                                        <IconCopy /> نسخ
                                    </button>
                                    <a 
                                        href={previewArchivedVideo.hlsUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded flex items-center justify-center font-bold text-xs whitespace-nowrap gap-1"
                                    >
                                        فتح <IconExternalLink />
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <span className="text-slate-500 block text-xs">الوصف (محفوظ في قاعدة البيانات)</span>
                        <p className="text-slate-300">{previewArchivedVideo.metadata?.description}</p>
                    </div>
                    <div>
                        <span className="text-slate-500 block text-xs">الوسوم</span>
                        <div className="flex gap-1 flex-wrap mt-1">
                            {previewArchivedVideo.metadata?.tags.map(tag => (
                                <span key={tag} className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};