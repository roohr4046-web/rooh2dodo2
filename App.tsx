import React, { useState, useMemo } from 'react';
import { ViewMode, VideoAsset, VideoStatus } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { ConsumerApp } from './components/ConsumerApp';
import { BackendGuide } from './components/BackendGuide';
import { VoiceAssistant } from './components/VoiceAssistant';
import { IconServer, IconCode, IconPlay, IconSettings, IconMic, IconHome, IconBot, IconCpu } from './components/Icons';

// Mock initial data
const INITIAL_VIDEOS: VideoAsset[] = [
    {
        id: 'demo-horror-1',
        filename: 'lion_attack.mp4',
        size: '124.50 MB',
        compressedSize: '49.80 MB', // تمت الإضافة ليظهر الفرق في الحجم مباشرة
        status: VideoStatus.PUBLISHED,
        progress: 100,
        uploadDate: new Date(),
        metadata: {
            title: "أسد يهاجم الحراس في لحظة غفلة",
            description: "مشهد يحبس الأنفاس لأسد ينقض فجأة. تم تصويره في محمية طبيعية.",
            tags: ["رعب", "حيوانات", "هجوم"],
            category: "horror_attacks", // Matches new ID
            aiGenerated: true,
            isShorts: false
        },
        hlsUrl: "https://pub-6ec2273e65fd69c15933ae976f28e832.r2.dev/videos/هجمات_مرعبة/demo-horror-1/index.m3u8"
    }
];

export default function App() {
  const [view, setView] = useState<ViewMode>('ADMIN');
  const [videos, setVideos] = useState<VideoAsset[]>(INITIAL_VIDEOS);
  const [isBotOpen, setIsBotOpen] = useState(false);

  // Handle Voice Commands
  const handleVoiceCommand = (command: string) => {
    if (command === 'PROCESS_ALL') {
        // Trigger the logic in AdminDashboard via global hack or context (using global for simplicity in this demo structure)
        if ((window as any).triggerProcessing) {
            (window as any).triggerProcessing();
        }
    }
  };

  // Calculate actual storage usage dynamically
  const storageStats = useMemo(() => {
    let totalCount = 0;
    let totalSizeBytes = 0;

    videos.forEach(video => {
      // Only count published videos that are "on the server"
      if (video.status === VideoStatus.PUBLISHED) {
        totalCount++;
        
        // Parse size string (e.g., "49.80 MB")
        const sizeStr = video.compressedSize || video.size;
        const value = parseFloat(sizeStr.replace(/[^0-9.]/g, ''));
        const isGB = sizeStr.includes('GB');
        const isKB = sizeStr.includes('KB');
        
        let bytes = value * 1024 * 1024; // Assume MB default
        if (isGB) bytes = value * 1024 * 1024 * 1024;
        if (isKB) bytes = value * 1024;
        
        totalSizeBytes += bytes;
      }
    });

    const totalGB = totalSizeBytes / (1024 * 1024 * 1024);
    const percentage = (totalGB / 10) * 100; // Based on 10GB free tier

    return {
      count: totalCount,
      usedGB: totalGB.toFixed(4), // More precision for small files
      percentage: Math.min(percentage, 100).toFixed(1)
    };
  }, [videos]);

  // Python code for storage monitoring display
  const monitorCode = `
def get_storage_stats(bucket_name):
    total_size = 0
    video_count = 0
    
    # استخدام Paginator للمرور على كل الملفات
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=bucket_name):
        if 'Contents' in page:
            for obj in page['Contents']:
                total_size += obj['Size']
                # نعد ملفات الفهرس فقط لمعرفة عدد الفيديوهات
                if obj['Key'].endswith('index.m3u8'):
                    video_count += 1
                    
    # تحويل البايت إلى جيجابايت
    total_gb = total_size / (1024 ** 3)
    return video_count, total_gb
  `.trim();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden relative" dir="rtl">
      
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-l border-slate-800 flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <IconServer />
            </div>
            <span>CloudStream</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-mono" dir="ltr">DEV DASHBOARD</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          <button onClick={() => setView('ADMIN')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'ADMIN' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <IconHome /> <span className="font-medium">الرئيسية</span>
          </button>
          <button onClick={() => setView('BACKEND_GUIDE')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'BACKEND_GUIDE' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <IconCode /> <span className="font-medium">الكود (Backend)</span>
          </button>
          <button onClick={() => setView('SETTINGS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'SETTINGS' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <IconSettings /> <span className="font-medium">الإعدادات</span>
          </button>
        </nav>

        <div className="px-4 pb-4">
             <button onClick={() => setIsBotOpen(true)} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300`}>
                <IconMic /> <span>المساعد الصوتي</span>
             </button>
        </div>

        <div className="p-4 border-t border-slate-800">
           <button onClick={() => setView('CONSUMER')} className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'CONSUMER' ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            <IconPlay /> <span className="font-medium">معاينة التطبيق</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-950 relative w-full">
        {view === 'ADMIN' && <AdminDashboard videos={videos} setVideos={setVideos} />}
        {view === 'BACKEND_GUIDE' && <BackendGuide />}
        {view === 'SETTINGS' && (
             <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">إعدادات النظام</h1>
                
                {/* قسم المفاتيح */}
                <div className="space-y-4 md:space-y-6">
                    <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800">
                        <label className="block text-sm font-medium text-slate-400 mb-2">مفتاح Cloudflare R2 Token (Secret Key)</label>
                        <input 
                            type="password" 
                            defaultValue="398acd5ca50bde7c32d4c000b41b56c73a07417d13e85a7f9f405e93d83f45fc" 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono text-xs md:text-sm tracking-wider" 
                        />
                         <p className="text-[10px] text-green-500 mt-2">✅ متصل (الحساب: 6ec2273e65...)</p>
                    </div>
                    <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800">
                        <label className="block text-sm font-medium text-slate-400 mb-2">اسم الحاوية (Bucket Name)</label>
                        <input 
                            type="text" 
                            defaultValue="rooh2dodo" 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" 
                        />
                    </div>
                     <div className="bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-800">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Public Domain</label>
                        <input 
                            type="text" 
                            defaultValue="https://pub-6ec2273e65fd69c15933ae976f28e832.r2.dev" 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono text-xs" 
                        />
                    </div>
                </div>

                {/* قسم مراقبة التخزين (الجديد) */}
                <div className="mt-12 border-t border-slate-800 pt-8">
                   <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                     <IconCpu /> مراقبة التخزين (R2 Monitor)
                   </h2>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* بطاقة عدد الفيديوهات */}
                        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 p-4 opacity-10">
                                <IconPlay />
                            </div>
                            <h3 className="text-slate-400 text-sm font-bold mb-1">عدد الفيديوهات المرفوعة</h3>
                            <p className="text-3xl font-mono text-white">{storageStats.count}</p>
                            <span className="text-[10px] text-green-500">تم الفهرسة (index.m3u8)</span>
                        </div>

                        {/* بطاقة المساحة المستهلكة */}
                        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden">
                            <div className="absolute top-0 left-0 p-4 opacity-10">
                                <IconServer />
                            </div>
                            <h3 className="text-slate-400 text-sm font-bold mb-1">المساحة المستهلكة</h3>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-mono text-white">{storageStats.usedGB}</p>
                                <span className="text-sm text-slate-500 mb-1">GB</span>
                            </div>
                        </div>
                   </div>

                   {/* شريط التقدم للباقة المجانية */}
                   <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-6">
                        <div className="flex justify-between items-end mb-2">
                             <span className="text-sm text-slate-300 font-bold">باقة Cloudflare R2 المجانية (10GB)</span>
                             <span className="text-xs font-mono text-blue-400">{storageStats.usedGB}GB / 10.0GB ({storageStats.percentage}%)</span>
                        </div>
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                             <div 
                                className={`h-full rounded-full transition-all duration-500 ${Number(storageStats.percentage) > 90 ? 'bg-red-500' : 'bg-gradient-to-l from-blue-600 to-blue-400'}`} 
                                style={{ width: `${storageStats.percentage}%` }}
                             ></div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">
                            تنبيه: سيتم تطبيق رسوم إضافية عند تجاوز 10GB. تأكد من حذف الفيديوهات القديمة أو غير المستخدمة.
                        </p>
                   </div>

                   {/* الكود البرمجي للمراقبة */}
                   <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                            <span className="text-xs text-green-400 font-mono">monitor_script.py</span>
                            <span className="text-[10px] text-slate-500">كود بايثون لحساب الإحصائيات أعلاه</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto" dir="ltr">
                            <code>{monitorCode}</code>
                        </pre>
                   </div>

                </div>
             </div>
        )}
        {view === 'CONSUMER' && (
            <div className="absolute inset-0 z-50 flex flex-col bg-white">
                <ConsumerApp videos={videos} /> 
                <button onClick={() => setView('ADMIN')} className="fixed bottom-24 right-6 bg-black/90 text-white px-6 py-3 rounded-full shadow-2xl text-sm z-50 hover:bg-gray-800 border border-gray-700 flex items-center gap-2 backdrop-blur-md">
                    <IconServer /> خروج
                </button>
            </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe z-40">
        <div className="flex justify-around items-center h-16 px-2">
            <button onClick={() => setView('ADMIN')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${view === 'ADMIN' ? 'text-blue-400' : 'text-slate-500'}`}>
                <IconHome />
                <span className="text-[10px]">الرئيسية</span>
            </button>
            
            {/* Central Voice Button */}
            <button onClick={() => setIsBotOpen(true)} className="relative -top-5 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-900/40 border-4 border-slate-950">
                <IconMic />
            </button>

            <button onClick={() => setView('SETTINGS')} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${view === 'SETTINGS' ? 'text-purple-400' : 'text-slate-500'}`}>
                <IconSettings />
                <span className="text-[10px]">إعدادات</span>
            </button>
        </div>
      </div>

      {/* Voice Assistant Overlay */}
      <VoiceAssistant isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} onCommand={handleVoiceCommand} />

    </div>
  );
}