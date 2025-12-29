import React, { useCallback, useState } from 'react';
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

const USER_PUBLIC_DOMAIN = "https://pub-6ec2273e65fd69c15933ae976f28e832.r2.dev";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ videos, setVideos }) => {
  const [activeDraft, setActiveDraft] = useState<VideoAsset | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
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
                isShorts: false
            }
        };
        setActiveDraft(newDraft);
        setStep(1);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'video/*': []}, multiple: false });

  const saveCropSettings = () => setStep(2);

  const triggerAI = async () => {
      if (!activeDraft) return;
      setIsGenerating(true);
      await new Promise(r => setTimeout(r, 1000));
      const metadata = await generateVideoMetadata(activeDraft.filename);
      setActiveDraft(prev => prev ? ({
          ...prev,
          metadata: { ...prev.metadata!, title: metadata.title, description: metadata.description, tags: metadata.tags, aiGenerated: true }
      }) : null);
      setIsGenerating(false);
      setStep(3);
  };

  const publishVideo = async () => {
      if (!activeDraft) return;
      setPublishStatus('sending');
      await new Promise(r => setTimeout(r, 1000));
      setPublishStatus('success');
      addToast('تم إرسال الفيديو للمعالجة بنجاح!', 'success');
      await new Promise(r => setTimeout(r, 1500));
      const finalVideo: VideoAsset = { ...activeDraft, status: VideoStatus.PROCESSING_FFMPEG, progress: 0 };
      const exists = videos.find(v => v.id === finalVideo.id);
      if (exists) {
          setVideos(prev => prev.map(v => v.id === finalVideo.id ? finalVideo : v));
      } else {
          setVideos(prev => [finalVideo, ...prev]);
      }
      setActiveDraft(null); 
      setStep(1);
      setPublishStatus('idle');
      startBackgroundProcessing(finalVideo.id, finalVideo.size);
  };

  const handlePreviewVideo = (video: VideoAsset) => {
      // Load selected video into the main player area
      setActiveDraft(video);
      // Go to step 3 to show details
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToast("تم تحميل الفيديو في مشغل المعاينة", "success");
  };

  const handleDeleteVideo = (videoId: string, filename: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الفيديو "${filename}"؟`)) {
        setVideos(prev => prev.filter(v => v.id !== videoId));
        if (activeDraft?.id === videoId) setActiveDraft(null);
        addToast("تم حذف الفيديو من المستودع بنجاح", "success");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('تم نسخ الرابط للحافظة', 'success');
  };

  const startBackgroundProcessing = (videoId: string, originalSizeStr: string) => {
      let currentProgress = 0;
      const speed = Math.random() * 2 + 1; 
      const interval = setInterval(() => {
          currentProgress += speed;
          setVideos(currentVideos => {
              if (!currentVideos.find(v => v.id === videoId)) {
                  clearInterval(interval);
                  return currentVideos;
              }
              return currentVideos.map(v => {
                  if (v.id !== videoId) return v;
                  let newStatus = v.status;
                  let compressedSize = v.compressedSize;
                  let hlsUrl = v.hlsUrl;

                  if (currentProgress < 50) newStatus = VideoStatus.PROCESSING_FFMPEG;
                  else if (currentProgress < 90) newStatus = VideoStatus.UPLOADING_R2;
                  else if (currentProgress >= 100) newStatus = VideoStatus.PUBLISHED;

                  if (currentProgress >= 100 && !compressedSize) {
                      const originalSize = parseFloat(originalSizeStr.replace(/[^0-9.]/g, ''));
                      const unit = originalSizeStr.replace(/[0-9.]/g, '').trim();
                      const compressed = (originalSize * 0.20).toFixed(2); 
                      compressedSize = `${compressed} ${unit}`;
                      const categoryObj = CATEGORIES.find(c => c.id === v.metadata?.category);
                      const categoryFolder = categoryObj ? categoryObj.label.replace(/\s+/g, '_') : 'عام';
                      hlsUrl = `${USER_PUBLIC_DOMAIN}/videos/${categoryFolder}/${videoId}/index.m3u8`;
                      clearInterval(interval);
                      if (v.status !== VideoStatus.PUBLISHED) {
                          setTimeout(() => addToast(`تم نشر الفيديو "${v.filename}" بنجاح!`, 'success'), 0);
                      }
                      return { ...v, progress: 100, status: VideoStatus.PUBLISHED, compressedSize, hlsUrl };
                  }
                  return { ...v, progress: Math.min(Math.round(currentProgress), 99), status: newStatus, compressedSize, hlsUrl };
              });
          });
      }, 200);
  };

  // Helper to determine video source
  const getVideoSrc = (video: VideoAsset) => {
      if (video.file) return URL.createObjectURL(video.file);
      if (video.hlsUrl) return video.hlsUrl; 
      return '';
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto font-sans pb-24 md:pb-8 relative">
      
      {/* Toast Notification */}
      <div className="fixed top-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto flex items-center gap-2 px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border animate-slide-in-left backdrop-blur-md ${toast.type === 'success' ? 'bg-black/80 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-black/80 border-red-500/50 text-red-400'}`}>
            {toast.type === 'success' ? <IconCheck /> : <IconX />}
            <span className="text-sm font-bold tracking-wide">{toast.message}</span>
          </div>
        ))}
      </div>

      <header className="mb-10 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">استوديو <span className="text-blue-500">الفيديو</span></h1>
            <p className="text-blue-500/50 font-bold text-xs tracking-[0.2em] uppercase">معالجة الوسائط وتحويل HLS</p>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="bg-black border border-slate-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-12 relative group transition-all hover:border-blue-500/30">
        
        {/* Empty State */}
        {!activeDraft && (
            <div 
                {...getRootProps()} 
                className={`
                h-[400px] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative
                ${isDragActive ? 'bg-blue-900/10' : 'bg-transparent'}
                `}
            >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                <input {...getInputProps()} />
                <div className="w-24 h-24 bg-black border border-blue-500/30 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(59,130,246,0.2)] group-hover:shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                    <div className="text-blue-400"><IconUpload /></div>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">رفع فيديو جديد</h2>
                <p className="text-slate-500 font-mono text-sm border border-slate-800 px-4 py-1 rounded-full">الصيغ المدعومة: MP4, MOV, MKV</p>
            </div>
        )}

        {/* Editor State */}
        {activeDraft && (
            <div className="flex flex-col md:flex-row h-auto md:h-[550px]">
                {/* Left: Preview */}
                <div className="w-full md:w-3/5 bg-black relative flex flex-col border-l border-slate-800">
                    <div className="flex-1 relative flex items-center justify-center bg-black/50 overflow-hidden">
                        <div className={`relative transition-all duration-500 shadow-2xl overflow-hidden bg-black group ring-1 ring-slate-800 ${activeDraft.metadata?.isShorts ? 'aspect-[9/16] h-[90%]' : 'aspect-video w-[95%]'}`}>
                             {/* Video Player */}
                             <video 
                                src={getVideoSrc(activeDraft)} 
                                controls 
                                autoPlay
                                className="w-full h-full object-cover" 
                            />
                            {(activeDraft.metadata?.cropBottom || 0) > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-red-500/50 border-t border-red-500 flex items-center justify-center backdrop-blur-sm z-10" style={{ height: activeDraft.metadata?.isShorts ? `${((activeDraft.metadata?.cropBottom || 0) / 600) * 100}%` : `${((activeDraft.metadata?.cropBottom || 0) / 400) * 100}%` }}>
                                    <span className="text-[10px] text-white font-bold bg-black px-2 py-1 rounded">منطقة القص</span>
                                    </div>
                            )}
                        </div>
                        <button onClick={() => setActiveDraft(null)} className="absolute top-6 right-6 bg-black/50 backdrop-blur text-white p-3 rounded-full hover:bg-red-600 transition-colors z-30 border border-white/10" title="إغلاق المعاينة"><IconX /></button>
                    </div>

                    <div className="p-6 bg-black border-t border-slate-800 relative z-30">
                        <div className="flex gap-4 mb-6">
                            <button onClick={() => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, isShorts: false}})} className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest transition-all border ${!activeDraft.metadata?.isShorts ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}>أفقي 16:9</button>
                            <button onClick={() => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, isShorts: true}})} className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest transition-all border ${activeDraft.metadata?.isShorts ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}>طولي (Shorts)</button>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-bold text-slate-400 flex items-center gap-2"><IconScissors /> إزالة الحقوق (قص السفلي)</span>
                             <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">{activeDraft.metadata?.cropBottom}px</span>
                        </div>
                        <input type="range" min="0" max="200" step="10" value={activeDraft.metadata?.cropBottom || 0} onChange={(e) => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, cropBottom: parseInt(e.target.value)}})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="w-full md:w-2/5 flex flex-col bg-slate-950">
                    <div className="flex border-b border-slate-800">
                        {[1, 2, 3].map(i => (
                            <button key={i} onClick={() => setStep(i as 1|2|3)} disabled={step < i} className={`flex-1 py-4 text-center text-[10px] font-black tracking-widest transition-colors ${step >= i ? 'text-white border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-600'}`}>الخطوة {i}</button>
                        ))}
                    </div>

                    <div className="flex-1 p-8 relative overflow-y-auto">
                        {step === 1 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-400"><IconScissors /></div>
                                <div><h3 className="text-xl font-bold text-white">ضبط الأبعاد</h3><p className="text-slate-500 text-sm mt-2 px-4">حدد نسبة القص لإزالة أي شعارات في أسفل الفيديو.</p></div>
                                <button onClick={saveCropSettings} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all w-full">حفظ ومتابعة</button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-purple-400 border border-purple-500/30 ${isGenerating ? 'bg-purple-900/20 animate-pulse shadow-[0_0_40px_rgba(168,85,247,0.3)]' : 'bg-slate-900'}`}><IconSparkles /></div>
                                <div><h3 className="text-xl font-bold text-white">الذكاء الاصطناعي (Gemini)</h3><p className="text-slate-500 text-sm mt-2 px-4">جارٍ إنشاء العنوان والوصف والكلمات المفتاحية تلقائياً.</p></div>
                                <button onClick={triggerAI} disabled={isGenerating} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-10 py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] w-full transition-all">{isGenerating ? 'جاري التحليل...' : 'توليد البيانات الوصفية'}</button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">عنوان الفيديو</label><input type="text" value={activeDraft.metadata?.title} onChange={(e) => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, title: e.target.value}})} className="w-full bg-black border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-colors" placeholder="اكتب العنوان هنا..." /></div>
                                <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">الوصف</label><textarea rows={4} value={activeDraft.metadata?.description} onChange={(e) => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, description: e.target.value}})} className="w-full bg-black border border-slate-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none resize-none transition-colors" placeholder="اكتب الوصف هنا..." /></div>
                                <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">القسم</label><div className="relative"><select value={activeDraft.metadata?.category} onChange={(e) => setActiveDraft({...activeDraft, metadata: {...activeDraft.metadata!, category: e.target.value}})} className="w-full bg-black border border-slate-800 rounded-xl p-4 text-white appearance-none focus:border-blue-500 outline-none transition-colors">{CATEGORIES.map(cat => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}</select><div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div></div></div>
                                
                                {activeDraft.hlsUrl && (
                                    <div className="space-y-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl mt-4">
                                        <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2"><IconLink /> رابط التشغيل المباشر</label>
                                        <div className="flex gap-2">
                                            <input type="text" readOnly value={activeDraft.hlsUrl} className="w-full bg-black/50 border border-green-500/30 rounded-lg p-2 text-xs font-mono text-green-300 direction-ltr" dir="ltr" />
                                            <button onClick={() => copyToClipboard(activeDraft.hlsUrl!)} className="p-2 bg-green-500 hover:bg-green-400 text-black rounded-lg transition-colors"><IconCopy /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {step === 3 && activeDraft.status !== VideoStatus.PUBLISHED && (
                        <div className="p-6 border-t border-slate-800 bg-black">
                             <button onClick={publishVideo} disabled={publishStatus !== 'idle'} className={`w-full py-4 rounded-xl font-black text-sm tracking-widest shadow-lg flex items-center justify-center gap-3 transition-all ${publishStatus === 'idle' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]' : publishStatus === 'sending' ? 'bg-slate-800 text-slate-400' : 'bg-green-500 text-white'}`}>{publishStatus === 'idle' && <><IconSend /> نشر للسحابة (R2)</>}{publishStatus === 'sending' && "جاري الاتصال..."}{publishStatus === 'success' && "تم النشر"}</button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Archive Section - Neon Cards */}
      <div>
        <h3 className="text-white font-black text-xl mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
            المكتبة والتحميلات
        </h3>
        
        <div className="grid gap-4">
            {videos.map((video) => (
                <div key={video.id} onClick={() => handlePreviewVideo(video)} className="group relative bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6 transition-all duration-300 hover:bg-black overflow-hidden cursor-pointer">
                    
                    {/* Progress Bar Background */}
                    {video.status !== VideoStatus.PUBLISHED && (
                        <div className="absolute inset-0 bg-blue-900/5 z-0 pointer-events-none">
                            <div className="h-full bg-blue-600/10 transition-all duration-300 ease-linear" style={{ width: `${video.progress}%` }}></div>
                        </div>
                    )}

                    <div className="relative z-10 flex items-center gap-4 flex-1 w-full">
                        <div className="w-16 h-16 bg-black border border-slate-700 rounded-xl flex items-center justify-center text-slate-500 group-hover:border-blue-500 group-hover:text-blue-500 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all">
                            <IconPlay />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-bold truncate mb-1 group-hover:text-blue-400 transition-colors">{video.metadata?.title || video.filename}</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">{CATEGORIES.find(c => c.id === video.metadata?.category)?.label || 'عام'}</span>
                                <span className="text-[10px] font-mono text-slate-500">{video.compressedSize || video.size}</span>
                                {video.status === VideoStatus.PUBLISHED && <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> متاح</span>}
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 mt-4 md:mt-0" onClick={(e) => e.stopPropagation()}>
                         {/* رابط الفيديو المباشر في القائمة مع زر نسخ */}
                         {video.status === VideoStatus.PUBLISHED && video.hlsUrl && (
                             <div className="flex items-center gap-2 mr-0 md:mr-4 bg-black/50 border border-slate-800 rounded-lg px-3 py-2 w-full md:w-auto justify-between">
                                 <div className="flex flex-col">
                                     <span className="text-[8px] text-slate-500 font-bold uppercase">رابط البث</span>
                                     <span className="text-[10px] text-blue-400 font-mono truncate max-w-[150px] md:max-w-[200px]" dir="ltr">{video.hlsUrl}</span>
                                 </div>
                                 <button onClick={(e) => { e.stopPropagation(); copyToClipboard(video.hlsUrl!); }} className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded transition-colors" title="نسخ الرابط"><IconCopy /></button>
                             </div>
                         )}
                         <button onClick={(e) => { e.stopPropagation(); handlePreviewVideo(video); }} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-colors" title="تعديل / معاينة"><IconEdit /></button>
                         <button onClick={(e) => { e.stopPropagation(); handleDeleteVideo(video.id, video.filename); }} className="p-3 bg-slate-800 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-colors border border-transparent hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]" title="حذف"><IconTrash /></button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};