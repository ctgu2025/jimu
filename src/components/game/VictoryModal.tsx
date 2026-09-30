import React from 'react';
import { Star, Trophy, ArrowRight, RotateCcw, Share2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { sound } from '../../services/sound';

interface VictoryModalProps {
  isOpen: boolean;
  levelNumber: number;
  levelTitle: string;
  timeSeconds: number;
  moves: number;
  stars: number;
  hasNextLevel: boolean;
  isDailyChallenge?: boolean;
  onOpenDailyLeaderboard?: () => void;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenPoster: () => void;
  onOpenShareSheet: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  levelNumber,
  levelTitle,
  timeSeconds,
  moves,
  stars,
  hasNextLevel,
  isDailyChallenge = false,
  onOpenDailyLeaderboard,
  onNextLevel,
  onReplay,
  onOpenPoster,
  onOpenShareSheet,
}) => {
  if (!isOpen) return null;

  const beatsPercent = Math.min(99.8, Math.max(85.0, 100 - (moves * 1.2 + timeSeconds * 0.3))).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Trophy Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
          <Trophy className="w-8 h-8" />
        </div>

        {/* Header Title */}
        <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
          {isDailyChallenge ? '🔥 全服每日挑战达成 · 极速登榜' : '关卡达成 · 空间大师'}
        </span>
        <h2 className="text-xl font-bold text-white mt-0.5">
          {isDailyChallenge ? levelTitle : `第 ${levelNumber} 关：${levelTitle}`}
        </h2>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 my-4">
          {[1, 2, 3].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-7 h-7 transition-all duration-300 ${
                starIdx <= stars
                  ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Performance Metrics Card */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 mb-3">
          <div className="text-center p-1">
            <span className="text-[10px] text-slate-400">通关总用时</span>
            <div className="text-lg font-bold font-mono text-sky-400">{timeSeconds.toFixed(1)}s</div>
          </div>
          <div className="text-center p-1 border-l border-slate-800">
            <span className="text-[10px] text-slate-400">积木搭建步数</span>
            <div className="text-lg font-bold font-mono text-amber-400">{moves} 步</div>
          </div>
        </div>

        {/* Friends Benchmark Callout */}
        <div className="bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-xl mb-5 flex items-center justify-center gap-1.5 text-xs text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {isDailyChallenge
              ? '今日成绩已同步写入全球天梯榜！'
              : `超越了微信朋友圈 ${beatsPercent}% 的空间推演者！`}
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2">
          {isDailyChallenge ? (
            <button
              onClick={() => {
                sound.playClick();
                if (onOpenDailyLeaderboard) onOpenDailyLeaderboard();
              }}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-98 transition-all"
            >
              <Trophy className="w-4 h-4 fill-slate-950" />
              <span>查看今日全球通关排行</span>
            </button>
          ) : hasNextLevel ? (
            <button
              onClick={() => {
                sound.playClick();
                onNextLevel();
              }}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
            >
              <span>挑战下一关</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="py-2 text-xs text-emerald-400 font-semibold">
              🎉 恭喜通关全部主线！快去关卡工坊自创谜题挑战好友吧！
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onOpenPoster();
              }}
              className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>生成朋友圈海报</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenShareSheet();
              }}
              className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>发微信PK比拼</span>
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onReplay();
            }}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>再次推演本关刷新纪录</span>
          </button>
        </div>
      </div>
    </div>
  );
};
