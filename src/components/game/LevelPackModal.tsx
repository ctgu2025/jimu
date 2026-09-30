import React, { useState } from 'react';
import { X, Trophy, Sparkles, ChevronRight, CheckCircle2, Play, Star } from 'lucide-react';
import { THEME_PACKS } from '../../data/levelPacks';
import { ThemePack, LevelData, UserLevelProgress } from '../../types/game';
import { sound } from '../../services/sound';

interface LevelPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPackId: string;
  currentLevelId: number;
  userProgressMap: Record<number, UserLevelProgress>;
  onSelectLevel: (pack: ThemePack, level: LevelData) => void;
  onOpenDailyChallenge?: () => void;
}

export const LevelPackModal: React.FC<LevelPackModalProps> = ({
  isOpen,
  onClose,
  currentPackId,
  currentLevelId,
  userProgressMap,
  onSelectLevel,
  onOpenDailyChallenge,
}) => {
  const [selectedPackId, setSelectedPackId] = useState<string>(currentPackId || 'forest');

  if (!isOpen) return null;

  const currentTheme = THEME_PACKS.find((p) => p.id === selectedPackId) || THEME_PACKS[0];

  // Calculate completed count
  const completedCount = currentTheme.levels.filter(
    (lvl) => userProgressMap[lvl.id]?.completed
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/70">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <span>主题关卡包大厅</span>
            </h2>
            <p className="text-[11px] text-slate-400">选择不同空间维度的解谜世界</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daily Challenge Promo Banner */}
        {onOpenDailyChallenge && (
          <div className="px-4 pt-2.5 pb-1 bg-slate-950/60 border-b border-slate-800 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                onClose();
                onOpenDailyChallenge();
              }}
              className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 hover:from-amber-500/30 hover:via-rose-500/30 border border-amber-500/40 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔥</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-300">今日全服空间挑战</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold animate-pulse">
                      全服同题
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">每日随机布局，争夺全球通关极速榜首！</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Theme Pack Tabs */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto shrink-0 no-scrollbar">
          {THEME_PACKS.map((pack) => {
            const isSelected = pack.id === selectedPackId;
            return (
              <button
                key={pack.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedPackId(pack.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-md border-amber-400 ring-1 ring-amber-400/40'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-base">{pack.icon}</span>
                <span>{pack.name}</span>
                <span className="text-[10px] opacity-70">({pack.levels.length}关)</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Theme Banner & Description Card */}
          <div
            className={`p-4 rounded-2xl border border-slate-700/80 bg-gradient-to-br ${currentTheme.bgGradient} relative overflow-hidden shadow-lg`}
          >
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/10 text-white inline-block">
                  {currentTheme.tagline}
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{currentTheme.icon}</span>
                  <span>{currentTheme.name} 探索世界</span>
                </h3>
              </div>

              {/* Progress pill */}
              <div className="text-right">
                <span className="text-[10px] text-slate-300 block">通关进度</span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {completedCount} / {currentTheme.levels.length}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-200/90 mt-2.5 leading-relaxed relative z-10">
              {currentTheme.description}
            </p>

            {/* Feature Highlights */}
            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-1.5 relative z-10">
              {currentTheme.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Level Cards Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 px-1">
              关卡挑战清单（按空间难度递增）
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentTheme.levels.map((lvl, index) => {
                const isCurrentPlaying = lvl.id === currentLevelId;
                const progress = userProgressMap[lvl.id];
                const isUnlocked = index === 0 || userProgressMap[currentTheme.levels[index - 1]?.id]?.completed;

                return (
                  <button
                    key={lvl.id}
                    onClick={() => {
                      sound.playClick();
                      onSelectLevel(currentTheme, lvl);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isCurrentPlaying
                        ? 'bg-amber-500/15 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Level Number Pill */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-xs shrink-0 ${
                          progress?.completed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isCurrentPlaying
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Title & Concept */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white truncate">
                            {lvl.title}
                          </span>
                          {isCurrentPlaying && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-bold shrink-0">
                              进行中
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {lvl.concept}
                        </span>
                      </div>
                    </div>

                    {/* Right Stars or Play */}
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      {progress?.completed ? (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (progress.stars || 3)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-800/80 text-amber-400 flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-colors">
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        </div>
                      )}

                      {progress?.bestTime && (
                        <span className="text-[9px] text-sky-400 font-mono">
                          {progress.bestTime.toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
