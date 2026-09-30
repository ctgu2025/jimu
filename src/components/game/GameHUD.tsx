import React, { useState } from 'react';
import { Play, RotateCw, RotateCcw, Trash2, Lightbulb, Compass, Share2, Users, Hammer, Map, Undo2, Flame } from 'lucide-react';
import { BlockShape } from '../../types/game';
import { BLOCK_DEFINITIONS } from '../../utils/blockShapes';
import { sound } from '../../services/sound';

interface GameHUDProps {
  levelNumber: number;
  levelTitle: string;
  themeName?: string;
  themeIcon?: string;
  concept: string;
  winCondition: string;
  moves: number;
  elapsedSeconds: number;
  inventory: { type: BlockShape; count: number; color: string }[];
  selectedShape: BlockShape | null;
  onSelectShape: (shape: BlockShape) => void;
  rotation: [number, number, number];
  onRotateY: () => void;
  onRotateX: () => void;
  isDemolishMode: boolean;
  onToggleDemolish: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onRunTest: () => void;
  isSimulating: boolean;
  onOpenHint: () => void;
  onOpenReferenceBlueprint?: () => void;
  showGhost?: boolean;
  onToggleGhost?: () => void;
  onOpenDailyChallenge?: () => void;
  isDailyCompleted?: boolean;
  isDailyActive?: boolean;
  onOpenShareSheet: () => void;
  onOpenMomentsFeed: () => void;
  onOpenWorkshop: () => void;
  onOpenLevelPacks: () => void;
  onSnapCamera: (view: 'iso' | 'top' | 'front' | 'side') => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  levelNumber,
  levelTitle,
  themeName = '奇幻森林',
  themeIcon = '🌲',
  concept,
  winCondition,
  moves,
  elapsedSeconds,
  inventory,
  selectedShape,
  onSelectShape,
  onRotateY,
  onRotateX,
  isDemolishMode,
  onToggleDemolish,
  onUndo,
  canUndo = false,
  onRunTest,
  isSimulating,
  onOpenHint,
  onOpenReferenceBlueprint,
  showGhost = true,
  onToggleGhost,
  onOpenDailyChallenge,
  isDailyCompleted = false,
  isDailyActive = false,
  onOpenShareSheet,
  onOpenMomentsFeed,
  onOpenWorkshop,
  onOpenLevelPacks,
  onSnapCamera,
}) => {
  const [activeCam, setActiveCam] = useState<'iso' | 'top' | 'front' | 'side'>('iso');

  const handleSnap = (view: 'iso' | 'top' | 'front' | 'side') => {
    sound.playClick();
    setActiveCam(view);
    onSnapCamera(view);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* Top HUD Bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-2">
        {/* Left: Level & Spatial Goal (Click to open Level Pack Map!) */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenLevelPacks();
          }}
          className="bg-slate-900/90 hover:bg-slate-800/90 active:scale-95 transition-all backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-lg flex items-center gap-2.5 text-left"
          title="点击切换主题关卡包"
        >
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs font-mono">
            {levelNumber > 100 ? levelNumber % 100 : levelNumber}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 truncate max-w-[110px] sm:max-w-[150px] flex items-center gap-1">
              <span>{themeIcon}</span>
              <span className="truncate">{levelTitle}</span>
            </div>
            <div className="text-[10px] text-amber-400 font-medium truncate max-w-[130px]">
              {concept}
            </div>
          </div>
        </button>

        {/* Center: Live Stats (Moves & Timer) */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-lg flex items-center gap-3 font-mono text-xs">
          <div className="text-center">
            <span className="text-[9px] text-slate-400 block font-sans">步数</span>
            <span className="font-bold text-amber-400">{moves}</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-700" />
          <div className="text-center">
            <span className="text-[9px] text-slate-400 block font-sans">用时</span>
            <span className="font-bold text-sky-400">{elapsedSeconds.toFixed(1)}s</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5">
          {onOpenDailyChallenge && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenDailyChallenge();
              }}
              className={`w-9 h-9 rounded-2xl border flex items-center justify-center shadow-lg active:scale-95 transition-all relative ${
                isDailyActive
                  ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 border-amber-300 font-bold shadow-amber-500/30'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-rose-400 border-slate-700/80'
              }`}
              title="每日全服空间挑战与排行榜"
            >
              <Flame className={`w-4 h-4 ${!isDailyCompleted ? 'fill-rose-500 text-rose-500 animate-pulse' : isDailyActive ? 'fill-slate-950' : ''}`} />
              {!isDailyCompleted && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900" />
              )}
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onOpenLevelPacks();
            }}
            className="w-9 h-9 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-slate-700/80 flex items-center justify-center shadow-lg active:scale-95 transition-all"
            title="主题关卡包选择"
          >
            <Map className="w-4 h-4" />
          </button>

          {onOpenReferenceBlueprint && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenReferenceBlueprint();
              }}
              className="w-9 h-9 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-sky-400 border border-slate-700/80 flex items-center justify-center shadow-lg active:scale-95 transition-all"
              title="查看建筑设计参考图与蓝图"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onOpenHint();
            }}
            className="w-9 h-9 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700/80 flex items-center justify-center shadow-lg active:scale-95 transition-all"
            title="空间解题提示"
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenMomentsFeed();
            }}
            className="w-9 h-9 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-purple-400 border border-slate-700/80 flex items-center justify-center shadow-lg active:scale-95 transition-all relative"
            title="微信朋友圈与排行榜"
          >
            <Users className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* Floating Left: Quick View Snap Pill & Ghost Toggle */}
      <div className="pointer-events-auto self-start mt-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg flex flex-col gap-1">
        <button
          onClick={() => handleSnap('iso')}
          className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeCam === 'iso' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="等轴视角"
        >
          等轴
        </button>
        <button
          onClick={() => handleSnap('top')}
          className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeCam === 'top' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="俯视90°"
        >
          俯视
        </button>
        <button
          onClick={() => handleSnap('front')}
          className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeCam === 'front' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="正视"
        >
          正视
        </button>
        <button
          onClick={() => handleSnap('side')}
          className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeCam === 'side' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
          title="侧视"
        >
          侧视
        </button>

        {onToggleGhost && (
          <div className="pt-1 border-t border-slate-800">
            <button
              onClick={() => {
                sound.playClick();
                onToggleGhost();
              }}
              className={`w-full px-1.5 py-1 rounded-lg text-[9px] font-medium transition-all flex items-center justify-center gap-0.5 ${
                showGhost
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="主舞台全息目标参考虚影开/关"
            >
              <span>{showGhost ? '虚影开' : '虚影关'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Tool Dock */}
      <div className="pointer-events-auto space-y-2">
        {/* Rotation & Mode Bar */}
        <div className="flex items-center justify-between px-1">
          {/* 3D Rotation Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1 shadow-lg">
            <button
              onClick={() => {
                sound.playRotate();
                onRotateY();
              }}
              disabled={isSimulating}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
              title="水平方向顺时针旋转90度"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">转角 Y</span>
            </button>

            <button
              onClick={() => {
                sound.playRotate();
                onRotateX();
              }}
              disabled={isSimulating}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
              title="俯仰翻转积木"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px]">翻转 X</span>
            </button>
          </div>

          {/* Right Tools (Undo, Demolish & Workshop) */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1 shadow-lg">
            {/* Undo Button */}
            <button
              onClick={() => {
                if (canUndo && onUndo) {
                  onUndo();
                }
              }}
              disabled={!canUndo || isSimulating}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 active:scale-95 transition-all ${
                canUndo && !isSimulating
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                  : 'bg-slate-900/60 text-slate-500 cursor-not-allowed opacity-50'
              }`}
              title="撤销上一步积木放置或拆除"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">撤销</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onToggleDemolish();
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 active:scale-95 transition-all ${
                isDemolishMode
                  ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="点击已摆放的积木将其拆除回收"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">{isDemolishMode ? '拆除中' : '拆除'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenWorkshop();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 active:scale-95 transition-all"
              title="自制关卡工坊"
            >
              <Hammer className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">造关</span>
            </button>
          </div>
        </div>

        {/* Block Inventory Carousel & Test Run CTA */}
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2">
          {/* Inventory Items */}
          <div className="flex-1 overflow-x-auto flex items-center gap-2 py-0.5 no-scrollbar">
            {inventory.map((item) => {
              const def = BLOCK_DEFINITIONS[item.type];
              const isSelected = selectedShape === item.type && !isDemolishMode;
              const isDepleted = item.count <= 0;

              return (
                <button
                  key={item.type}
                  onClick={() => {
                    if (isDepleted) return;
                    sound.playClick();
                    onSelectShape(item.type);
                  }}
                  disabled={isDepleted || isSimulating}
                  className={`relative flex flex-col items-center justify-between p-2 rounded-xl min-w-[62px] h-[64px] border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                      : isDepleted
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-40'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {/* Shape Color Preview Pill */}
                  <div
                    className="w-5 h-5 rounded-md shadow-sm border border-white/20 mt-0.5"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* Block Name */}
                  <span className="text-[10px] text-slate-200 font-medium truncate w-full text-center">
                    {def?.name.slice(0, 3)}
                  </span>

                  {/* Quantity Badge */}
                  <span
                    className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-full border shadow-sm ${
                      item.count > 0
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}
                  >
                    ×{item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Large Run & Test CTA */}
          <button
            onClick={() => {
              sound.playClick();
              onRunTest();
            }}
            disabled={isSimulating}
            className="h-[64px] px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-amber-500/25 active:scale-95 transition-all shrink-0 min-w-[76px] disabled:opacity-60"
          >
            <Play className={`w-5 h-5 fill-slate-950 ${isSimulating ? 'animate-pulse' : ''}`} />
            <span className="leading-tight">{isSimulating ? '检验中' : '检验通行'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
