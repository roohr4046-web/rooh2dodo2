import React from 'react';
import { VideoAsset, VideoStatus } from '../types';
import { IconPlay } from './Icons';

interface ConsumerAppProps {
  videos: VideoAsset[];
}

export const ConsumerApp: React.FC<ConsumerAppProps> = ({ videos }) => {
  const readyVideos = videos.filter(v => v.status === VideoStatus.PUBLISHED);

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans" dir="rtl">
      {/* واجهة التطبيق العامة */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="font-bold text-xl text-red-600 tracking-tight">StreamFlix AR</div>
            <div className="text-sm text-gray-500">تطبيق الجمهور (واجهة العرض)</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">موصى به لك</h2>
            <p className="text-gray-500 mt-1">أحدث الفيديوهات القادمة من سحابة Cloudflare R2</p>
        </div>

        {readyVideos.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-400">لا يوجد محتوى حالياً. قم برفع الفيديوهات من لوحة التحكم.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {readyVideos.map(video => (
                    <div key={video.id} className="group cursor-pointer">
                        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                             {/* Placeholder Thumbnail Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white group-hover:bg-red-600 transition-colors">
                                    <IconPlay />
                                </div>
                            </div>
                            <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                HLS
                            </span>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-lg font-semibold text-gray-900 leading-tight group-hover:text-red-600 transition-colors">
                                {video.metadata?.title || video.filename}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                {video.metadata?.description || "لا يتوفر وصف."}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {video.metadata?.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-lg text-left" dir="ltr">
            <div className="flex justify-between items-center mb-2">
                 <h4 className="font-mono text-sm font-bold text-slate-700">API Integration Snippet</h4>
                 <span className="text-xs text-slate-500">كود الربط البرمجي</span>
            </div>
           
            <p className="text-xs text-slate-500 mb-3">This view is powered by fetching: <code className="bg-slate-200 px-1 rounded">GET /api/videos?status=READY</code></p>
            <pre className="bg-slate-900 text-slate-300 p-4 rounded text-xs font-mono overflow-x-auto">
{`// Frontend Integration Code
const fetchVideos = async () => {
  const snapshot = await db.collection('videos')
    .where('status', '==', 'READY')
    .orderBy('uploadDate', 'desc')
    .get();
    
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}`}
            </pre>
        </div>
      </main>
    </div>
  );
};