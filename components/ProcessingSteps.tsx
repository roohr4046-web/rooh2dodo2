import React from 'react';
import { VideoStatus } from '../types';

interface ProcessingStepsProps {
  status: VideoStatus;
}

const steps = [
  { status: VideoStatus.PROCESSING_FFMPEG, label: 'تقطيع (3 ثوانٍ) + قص', color: 'bg-yellow-500' },
  { status: VideoStatus.GENERATING_METADATA, label: 'الذكاء الاصطناعي', color: 'bg-purple-500' },
  { status: VideoStatus.READY_FOR_REVIEW, label: 'بانتظار المراجعة', color: 'bg-orange-500' },
  { status: VideoStatus.UPLOADING_R2, label: 'رفع HLS للسحابة', color: 'bg-blue-500' },
];

export const ProcessingSteps: React.FC<ProcessingStepsProps> = ({ status }) => {
  if (status === VideoStatus.PUBLISHED) {
    return <span className="text-green-400 text-xs font-mono font-bold bg-green-400/10 px-2 py-1 rounded border border-green-500/20">جاهز للبث (HLS)</span>;
  }
  
  if (status === VideoStatus.PENDING) {
    return <span className="text-slate-500 text-xs font-mono bg-slate-800 px-2 py-1 rounded">في الانتظار</span>;
  }

  // Find current active step index
  const activeIndex = steps.findIndex(s => s.status === status);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, idx) => {
        let stepColor = 'bg-slate-700'; // Pending
        let animate = false;
        
        if (status === step.status) {
          stepColor = step.color; // Active
          animate = true;
        } else if (idx < activeIndex) {
          stepColor = step.color; // Completed
        }

        return (
          <div key={step.label} className="group relative">
            <div className={`w-2.5 h-2.5 rounded-full ${stepColor} ${animate ? 'animate-pulse ring-2 ring-white/20' : ''} transition-all duration-300`}></div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-slate-900 text-white text-[10px] px-2 py-1 rounded border border-slate-700 font-sans z-10 shadow-xl">
              {step.label}
            </div>
          </div>
        );
      })}
      
      {status === VideoStatus.READY_FOR_REVIEW ? (
         <span className="text-[10px] text-orange-400 font-bold mr-1 animate-pulse">مطلوب المراجعة!</span>
      ) : (
         <span className="text-[10px] text-slate-400 font-sans mr-1">
            {steps.find(s => s.status === status)?.label || 'جاري العمل...'}
         </span>
      )}
    </div>
  );
};