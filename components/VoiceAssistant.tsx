import React, { useState, useEffect } from 'react';
import { IconMic, IconBot, IconSparkles } from './Icons';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose, onCommand }) => {
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING'>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [botResponse, setBotResponse] = useState('');

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      reset();
    }
  }, [isOpen]);

  const reset = () => {
    setStatus('IDLE');
    setTranscript('');
    setBotResponse('');
  };

  const startListening = () => {
    setStatus('LISTENING');
    // Simulate listening delay
    setTimeout(() => {
        setTranscript("ابدأ معالجة جميع الفيديوهات...");
        processCommand();
    }, 2500);
  };

  const processCommand = () => {
    setStatus('PROCESSING');
    setTimeout(() => {
        setBotResponse("حاضر، سأقوم ببدء معالجة الفيديوهات المعلقة ورفعها للسيرفر فوراً.");
        setStatus('SPEAKING');
        // Execute the actual command in the app
        onCommand('PROCESS_ALL');
        
        // Auto close after speaking
        setTimeout(() => {
            onClose();
        }, 3000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>

      {/* Bot Interface */}
      <div className="relative w-full max-w-md bg-slate-900 border-t sm:border border-slate-700 sm:rounded-2xl p-6 shadow-2xl pointer-events-auto overflow-hidden animate-slide-up">
        
        {/* Animated Background Mesh */}
        <div className="absolute top-0 right-0 p-10 opacity-20">
             <div className="w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
            {/* Bot Avatar */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${status === 'LISTENING' ? 'bg-red-500/20 text-red-400 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-blue-600/20 text-blue-400'}`}>
                {status === 'LISTENING' ? <IconMic /> : <IconBot />}
            </div>

            {/* Status Text */}
            <h3 className="text-xl font-bold text-white mb-2">
                {status === 'LISTENING' && "جاري الاستماع..."}
                {status === 'PROCESSING' && "جاري التفكير..."}
                {status === 'SPEAKING' && "المساعد الذكي"}
            </h3>

            {/* Transcript Area */}
            <div className="min-h-[60px] w-full bg-slate-950/50 rounded-lg p-3 border border-slate-800 mb-4 flex items-center justify-center">
                {transcript ? (
                    <p className="text-slate-300 text-lg">"{transcript}"</p>
                ) : (
                    <div className="flex gap-1 items-center h-4">
                        <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></span>
                        <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                    </div>
                )}
            </div>

            {/* Bot Response */}
            {botResponse && (
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3 w-full animate-fade-in">
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
                        <IconSparkles />
                        <span>الرد الآلي</span>
                    </div>
                    <p className="text-blue-100 text-sm">{botResponse}</p>
                </div>
            )}
            
            {/* Cancel Button */}
            <button onClick={onClose} className="mt-6 text-slate-500 text-sm hover:text-white">
                إلغاء
            </button>
        </div>
      </div>
    </div>
  );
};