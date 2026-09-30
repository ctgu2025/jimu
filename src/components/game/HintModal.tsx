import React from 'react';
import { Lightbulb, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { sound } from '../../services/sound';

interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelNumber: number;
  levelTitle: string;
  concept: string;
  hint: string;
}

export const HintModal: React.FC<HintModalProps> = ({
  isOpen,
  onClose,
  levelNumber,
  levelTitle,
  concept,
  hint,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-left relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-bold block">第 {levelNumber} 关 空间思维指引</span>
              <h3 className="text-sm font-bold text-white">{levelTitle}</h3>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Concept Card */}
        <div className="my-4 space-y-3">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">本关核心空间法则：</span>
            <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{concept}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 text-xs text-slate-200 leading-relaxed space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>{hint}</p>
            </div>
          </div>

          {/* Spatial tip */}
          <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-300">
            💡 <strong>小提示</strong>：随时可以用手指拖拽旋转视角，或点击左侧“俯视/正视/侧视”快速校准对齐。
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
        >
          我懂了，去推演
        </button>
      </div>
    </div>
  );
};
