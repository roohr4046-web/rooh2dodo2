import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconAndroid, IconUpload, IconTrash, IconCopy, IconCheck, IconServer, IconExternalLink } from './Icons';

interface ApkFile {
  id: string;
  filename: string;
  size: string;
  uploadDate: string;
  url: string;
}

const INITIAL_APKS: ApkFile[] = [
    {
        id: 'apk-1',
        filename: 'CloudStream_v1.0.apk',
        size: '15.4 MB',
        uploadDate: new Date().toLocaleDateString('en-US'),
        url: 'https://pub-6ec2273e65fd69c15933ae976f28e832.r2.dev/apps/CloudStream_v1.0.apk'
    }
];

export const ApkManager: React.FC = () => {
  const [apks, setApks] = useState<ApkFile[]>(INITIAL_APKS);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renameInput, setRenameInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setRenameInput(file.name);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.android.package-archive': ['.apk'] },
    multiple: false
  });

  const handleUpload = () => {
    if (!selectedFile) return;

    setUploading(true);
    let currentProgress = 0;
    const interval = setInterval(() => {
        currentProgress += 2; // Slower animation to enjoy the neon
        setProgress(currentProgress);
        
        if (currentProgress >= 100) {
            clearInterval(interval);
            const finalName = renameInput.endsWith('.apk') ? renameInput : `${renameInput}.apk`;
            const newApk: ApkFile = {
                id: Math.random().toString(36).substring(7),
                filename: finalName,
                size: (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB',
                uploadDate: new Date().toLocaleDateString('en-US'),
                url: `https://pub-6ec2273e65fd69c15933ae976f28e832.r2.dev/apps/${finalName}`
            };
            setApks(prev => [newApk, ...prev]);
            setUploading(false);
            setSelectedFile(null);
            setProgress(0);
            setRenameInput('');
        }
    }, 50);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`⚠️ منطقة الخطر!\n\nهل أنت متأكد تماماً من حذف التطبيق:\n[ ${name} ]\n\nلا يمكن التراجع عن هذا الإجراء.`)) {
        setApks(prev => prev.filter(apk => apk.id !== id));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to add a toast here, but simple alert or logic is okay for this component as per prompt
    // alert('تم نسخ الرابط!');
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-mono relative overflow-hidden">
      
      {/* Intense Background Glows */}
      <div className="fixed top-20 right-20 w-64 h-64 bg-green-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-20 left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Neon Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 border-b border-white/10 pb-8">
            <div className="relative group">
                <div className="absolute inset-0 bg-green-500 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative w-20 h-20 bg-black border border-green-500/50 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <div className="text-green-400 scale-150 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]"><IconAndroid /></div>
                </div>
            </div>
            <div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] tracking-tight">
                    إدارة <span className="text-white">التطبيقات</span>
                </h1>
                <p className="text-emerald-500/70 text-sm mt-2 font-bold tracking-[0.2em] uppercase">
                    لوحة تحكم السحابة R2 // ملفات APK
                </p>
            </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Upload Zone */}
            <div className="lg:col-span-2">
                {!selectedFile ? (
                    <div 
                        {...getRootProps()} 
                        className={`
                            h-72 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 group relative overflow-hidden
                            ${isDragActive 
                                ? 'border-yellow-400 bg-yellow-400/5 shadow-[0_0_50px_rgba(250,204,21,0.2)]' 
                                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-green-400 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]'
                            }
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                        
                        <div className="w-24 h-24 rounded-full bg-black border border-white/20 flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300 relative z-10">
                            <div className="text-white/50 group-hover:text-green-400 transition-colors"><IconUpload /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors relative z-10">اسحب ملف APK هنا</h3>
                        <p className="text-white/30 text-xs mt-2 font-bold tracking-widest relative z-10">أو اضغط للاستعراض</p>
                    </div>
                ) : (
                    <div className="h-72 bg-black border border-yellow-500/50 shadow-[0_0_40px_rgba(250,204,21,0.15)] rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden">
                        
                        {/* Progress Bar Background */}
                        {uploading && (
                             <div className="absolute inset-0 z-0">
                                 <div className="h-full bg-gradient-to-r from-yellow-900/20 to-yellow-600/20 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
                                 <div className="absolute bottom-0 left-0 h-1 bg-yellow-500 shadow-[0_0_20px_#eab308]" style={{ width: `${progress}%` }}></div>
                             </div>
                        )}
                        
                        <div className="relative z-10">
                            <label className="text-[10px] text-yellow-500 font-bold mb-2 block tracking-[0.2em] uppercase">تغيير اسم الملف (اختياري)</label>
                            <input 
                                type="text" 
                                value={renameInput}
                                onChange={(e) => setRenameInput(e.target.value)}
                                disabled={uploading}
                                className="w-full bg-transparent border-b-2 border-white/20 text-white text-3xl font-black py-2 focus:outline-none focus:border-yellow-400 mb-8 placeholder-white/20 transition-colors text-left dir-ltr"
                            />
                            
                            {!uploading ? (
                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleUpload}
                                        className="flex-1 bg-yellow-400 text-black font-black text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.6)] hover:bg-yellow-300 hover:shadow-[0_0_40px_rgba(250,204,21,0.8)] transition-all transform hover:-translate-y-1"
                                    >
                                        رفع للسحابة
                                    </button>
                                    <button 
                                        onClick={() => setSelectedFile(null)}
                                        className="px-8 border-2 border-red-500/50 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">{progress}%</div>
                                    <p className="text-yellow-200/50 text-sm font-bold animate-pulse tracking-widest">جاري نقل البيانات...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="lg:col-span-1">
                <div className="h-full bg-gradient-to-b from-slate-900 to-black border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-blue-500/50 transition-colors duration-500">
                    <div className="absolute top-0 right-0 p-8 opacity-20 text-blue-500 group-hover:scale-125 transition-transform duration-700">
                        <IconServer />
                    </div>
                    
                    <h4 className="text-blue-400 text-xs font-black tracking-[0.2em] mb-8">حالة السيرفر</h4>
                    
                    <div className="space-y-6">
                        <div>
                            <span className="text-white/40 text-[10px] font-bold block mb-1">الحاوية (BUCKET)</span>
                            <span className="text-white font-bold text-lg tracking-wide">rooh2dodo</span>
                        </div>
                        <div>
                            <span className="text-white/40 text-[10px] font-bold block mb-1">المسار (PATH)</span>
                            <span className="text-yellow-400 font-mono bg-yellow-400/10 px-2 py-1 rounded inline-block border border-yellow-400/20">/apps/</span>
                        </div>
                        <div className="pt-4 border-t border-white/10">
                            <span className="text-white/40 text-[10px] font-bold block mb-1">التطبيقات المثبتة</span>
                            <span className="text-green-400 font-black text-4xl drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">{apks.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* List Table */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></span>
                    التطبيقات المثبتة
                </h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-white/30 text-xs font-black uppercase tracking-widest border-b border-white/5">
                            <th className="p-6 text-right">اسم التطبيق</th>
                            <th className="p-6">الحجم</th>
                            <th className="p-6">التاريخ</th>
                            <th className="p-6">الرابط المباشر</th>
                            <th className="p-6 text-right">تحكم</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {apks.map(apk => (
                            <tr key={apk.id} className="group hover:bg-white/5 transition-colors duration-300">
                                <td className="p-6 text-right">
                                    <span className="font-bold text-white text-lg group-hover:text-green-400 transition-colors" dir="ltr">{apk.filename}</span>
                                </td>
                                <td className="p-6">
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-blue-300">{apk.size}</span>
                                </td>
                                <td className="p-6 text-white/50 text-sm font-mono">{apk.uploadDate}</td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 max-w-[250px]">
                                        <span className="text-[10px] text-blue-400 font-mono truncate dir-ltr flex-1" dir="ltr">{apk.url}</span>
                                        <button onClick={() => copyToClipboard(apk.url)} className="text-slate-400 hover:text-white shrink-0"><IconCopy /></button>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <a 
                                            href={apk.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-10 h-10 flex items-center justify-center bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500 hover:text-white hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] transition-all transform hover:scale-110"
                                            title="تحميل"
                                        >
                                            <IconExternalLink />
                                        </a>
                                        
                                        {/* DELETE BUTTON - HIGH CONTRAST */}
                                        <button 
                                            onClick={() => handleDelete(apk.id, apk.filename)}
                                            className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/50 rounded-xl hover:bg-red-600 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] transition-all transform hover:scale-110 hover:rotate-12"
                                            title="حذف التطبيق"
                                        >
                                            <IconTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {apks.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-white/30 font-bold tracking-widest border border-dashed border-white/10 rounded-xl m-4">
                                    لا يوجد تطبيقات مرفوعة حالياً
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};