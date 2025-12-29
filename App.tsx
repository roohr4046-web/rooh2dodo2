import React, { useState, useMemo } from 'react';
import { ViewMode, VideoAsset, VideoStatus } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { ConsumerApp } from './components/ConsumerApp';
import { BackendGuide } from './components/BackendGuide';
import { VoiceAssistant } from './components/VoiceAssistant';
import { ApkManager } from './components/ApkManager';
import { IconServer, IconCode, IconPlay, IconSettings, IconMic, IconHome, IconBot, IconCpu, IconAndroid } from './components/Icons';

// Mock initial data
const INITIAL_VIDEOS: VideoAsset[] = [
    {
        id: 'demo-horror-1',
        filename: 'lion_attack.mp4',
        size: '124.50 MB',
        compressedSize: '49.80 MB',
        status: VideoStatus.PUBLISHED,
        progress: 100,
        uploadDate: new Date(),
        metadata: {
            title: "أسد يهاجم الحراس في لحظة غفلة",
            description: "مشهد يحبس الأنفاس لأسد ينقض فجأة. تم تصويره في محمية طبيعية.",
            tags: ["رعب", "حيوانات", "هجوم"],
            category: "horror_attacks",
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
      if (video.status === VideoStatus.PUBLISHED) {
        totalCount++;
        const sizeStr = video.compressedSize || video.size;
        const value = parseFloat(sizeStr.replace(/[^0-9.]/g, ''));
        const isGB = sizeStr.includes('GB');
        const isKB = sizeStr.includes('KB');
        
        let bytes = value * 1024 * 1024;
        if (isGB) bytes = value * 1024 * 1024 * 1024;
        if (isKB) bytes = value * 1024;
        
        totalSizeBytes += bytes;
      }
    });

    const totalGB = totalSizeBytes / (1024 * 1024 * 1024);
    const percentage = (totalGB / 10) * 100;

    return {
      count: totalCount,
      usedGB: totalGB.toFixed(4),
      percentage: Math.min(percentage, 100).toFixed(1)
    };
  }, [videos]);

  const monitorCode = `def get_storage_stats...`;

  // Helper for Sidebar Buttons
  const SidebarButton = ({ mode, icon: Icon, label, colorClass }: { mode: ViewMode, icon: any, label: string, colorClass: string }) => {
      const isActive = view === mode;
      return (
        <button 
            onClick={() => setView(mode)} 
            className={`
                w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden
                ${isActive ? 'bg-black text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
            `}
        >
            {/* Active Glow Background */}
            {isActive && (
                <div className={`absolute inset-0 opacity-20 ${colorClass} blur-xl`}></div>
            )}
            {/* Active Border Indicator */}
            {isActive && (
                <div className={`absolute right-0 top-2 bottom-2 w-1 rounded-l-full ${colorClass.replace('bg-', 'bg-')}`}></div>
            )}
            
            <div className={`relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`}>
                <Icon />
            </div>
            <span className={`relative z-10 font-bold tracking-wide ${isActive ? 'text-white' : ''}`}>{label}</span>
        </button>
      );
  };

  return (
    <div className="flex h-screen bg-black text-slate-200 font-sans overflow-hidden relative" dir="rtl">
      
      {/* Sidebar (Desktop Only) - Neon Style */}
      <aside className="hidden md:flex w-72 bg-black border-l border-slate-800 flex-col shrink-0 relative z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
        
        {/* Logo Section */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 font-black text-2xl text-white tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <IconServer />
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                CloudStream
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono tracking-widest opacity-60 ml-1" dir="ltr">V2.0 NEON EDITION</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
            <SidebarButton mode="ADMIN" icon={IconHome} label="الرئيسية" colorClass="bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
            <SidebarButton mode="APK_MANAGER" icon={IconAndroid} label="تطبيقات (APKs)" colorClass="bg-green-500 shadow-[0_0_15px_#22c55e]" />
            <SidebarButton mode="BACKEND_GUIDE" icon={IconCode} label="الأكواد (Backend)" colorClass="bg-yellow-400 shadow-[0_0_15px_#facc15]" />
            <SidebarButton mode="SETTINGS" icon={IconSettings} label="الإعدادات" colorClass="bg-purple-500 shadow-[0_0_15px_#a855f7]" />
        </nav>

        {/* Voice Assistant Trigger */}
        <div className="px-6 pb-6">
             <button 
                onClick={() => setIsBotOpen(true)} 
                className="w-full relative group overflow-hidden rounded-2xl p-[1px]"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 animate-spin-slow opacity-70"></div>
                <div className="relative bg-black rounded-2xl py-3 px-4 flex items-center justify-center gap-3 group-hover:bg-slate-900 transition-colors">
                    <span className="text-white group-hover:scale-110 transition-transform"><IconMic /></span>
                    <span className="font-bold text-white text-sm">المساعد الصوتي</span>
                </div>
             </button>
        </div>

        {/* Preview App Button */}
        <div className="p-4 border-t border-slate-900">
           <button onClick={() => setView('CONSUMER')} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all hover:border-slate-600 hover:text-white">
            <IconPlay /> <span className="font-bold text-sm">معاينة التطبيق</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-black relative w-full scroll-smooth">
        
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none z-0">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10">
            {view === 'ADMIN' && <AdminDashboard videos={videos} setVideos={setVideos} />}
            {view === 'APK_MANAGER' && <ApkManager />}
            {view === 'BACKEND_GUIDE' && <BackendGuide />}
            {view === 'SETTINGS' && (
                <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24">
                    <h1 className="text-3xl font-black text-white mb-8 border-b border-slate-800 pb-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-l from-purple-400 to-pink-600">الإعدادات العامة</span>
                    </h1>
                    
                    {/* Keys Section with Neon Style */}
                    <div className="space-y-6">
                        <div className="group bg-black border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all">
                            <label className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 block">Cloudflare R2 Secret Token</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    defaultValue="398acd5ca50bde7c32d4c000b41b56c73a07417d13e85a7f9f405e93d83f45fc" 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-xs tracking-widest focus:border-blue-500 focus:outline-none focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all" 
                                />
                                <div className="absolute left-3 top-3 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e] animate-pulse"></div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="group bg-black border border-slate-800 p-6 rounded-2xl hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all">
                                <label className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 block">Bucket Name</label>
                                <input 
                                    type="text" 
                                    defaultValue="rooh2dodo" 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-all" 
                                />
                            </div>
                            <div className="group bg-black border border-slate-800 p-6 rounded-2xl hover:border-yellow-500/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] transition-all">
                                <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2 block">Public Domain</label>
                                <input 
                                    type="text" 
                                    defaultValue="https://pub-6ec2273e65fd69c15933ae976f28e832.r2.dev" 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-xs focus:border-yellow-500 focus:outline-none transition-all" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Storage Monitor */}
                    <div className="mt-12 pt-8 border-t border-slate-800">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <IconCpu /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">مراقبة الموارد الحية</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/20 transition-all"></div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Videos</h3>
                                <p className="text-4xl font-black text-white">{storageStats.count}</p>
                            </div>
                            <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-pink-600/10 rounded-full blur-2xl group-hover:bg-pink-600/20 transition-all"></div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Storage Used</h3>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-white">{storageStats.usedGB}</p>
                                    <span className="text-sm font-bold text-pink-500">GB</span>
                                </div>
                            </div>
                        </div>

                        {/* Neon Progress Bar */}
                        <div className="bg-black border border-slate-800 p-6 rounded-2xl mb-6">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-sm text-white font-bold">R2 Free Tier Usage</span>
                                <span className="text-xs font-mono text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)] px-2 py-0.5 rounded border border-blue-500/30">{storageStats.percentage}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-[0_0_15px_#a855f7]" 
                                    style={{ width: `${storageStats.percentage}%` }}
                                ></div>
                            </div>
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
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Neon) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-slate-800 pb-safe z-40">
        <div className="flex justify-around items-center h-20 px-2">
            <button onClick={() => setView('ADMIN')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'ADMIN' ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]' : 'text-slate-600'}`}>
                <IconHome />
            </button>
            <button onClick={() => setView('APK_MANAGER')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'APK_MANAGER' ? 'text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'text-slate-600'}`}>
                <IconAndroid />
            </button>
            <button onClick={() => setIsBotOpen(true)} className="relative -top-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white p-4 rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.5)] border-4 border-black">
                <IconMic />
            </button>
            <button onClick={() => setView('SETTINGS')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'SETTINGS' ? 'text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' : 'text-slate-600'}`}>
                <IconSettings />
            </button>
        </div>
      </div>

      <VoiceAssistant isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} onCommand={handleVoiceCommand} />

    </div>
  );
}