import React, { useState } from 'react';
import { Eye, EyeOff, Layers, Sparkles, X, CheckCircle2, Compass, Box, ArrowRight } from 'lucide-react';
import { LevelData, ThreeViewProjection } from '../../types/game';
import { getTargetGhostVoxels, getReferenceDescription } from '../../utils/referenceHelper';
import { sound } from '../../services/sound';

interface ReferenceBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: LevelData;
  showGhost: boolean;
  onToggleGhost: () => void;
  targetThreeView?: ThreeViewProjection;
}

export const ReferenceBlueprintModal: React.FC<ReferenceBlueprintModalProps> = ({
  isOpen,
  onClose,
  level,
  showGhost,
  onToggleGhost,
  targetThreeView,
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'3d' | 'threeView'>('3d');

  if (!isOpen) return null;

  const ghostVoxels = getTargetGhostVoxels(level);
  const description = getReferenceDescription(level);

  // Render 2D grid for ThreeView blueprint
  const renderProjectionMiniGrid = (grid: boolean[][], title: string, axis: string) => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    return (
      <div className="flex flex-col items-center bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between w-full mb-1.5">
          <span className="text-[11px] font-semibold text-slate-300">{title}</span>
          <span className="text-[9px] text-amber-400 font-mono">{axis}</span>
        </div>
        <div
          className="grid gap-[2px] bg-slate-900 p-1.5 rounded-lg border border-slate-700/60"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const actualRow = rows - 1 - rIdx;
              const isFilled = grid[actualRow]?.[cIdx];
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`w-4 h-4 rounded-[2px] border transition-colors ${
                    isFilled
                      ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                      : 'bg-slate-800/80 border-slate-700/30'
                  }`}
                />
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>建筑设计参考图</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  目标蓝图
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                第 {level.id > 100 ? level.id % 100 : level.id} 关 · {level.title}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch between 3D Blueprint and Orthogonal Three-View */}
        <div className="flex items-center px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 gap-2 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setActiveViewTab('3d');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeViewTab === '3d'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>空间全息透视图</span>
          </button>

          {targetThreeView && (
            <button
              onClick={() => {
                sound.playClick();
                setActiveViewTab('threeView');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeViewTab === 'threeView'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>正交三视图蓝图</span>
            </button>
          )}
        </div>

        {/* Scrollable Blueprint Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* 3D Blueprint Visual Illustration */}
          {activeViewTab === '3d' && (
            <div className="space-y-3">
              <div className="relative aspect-[16/10] rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border border-slate-700/80 p-4 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                {/* Visual coordinate badge */}
                <div className="absolute top-2.5 left-2.5 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  空间范围: {level.gridSize.x}×{level.gridSize.y}×{level.gridSize.z}
                </div>

                {/* Ghost Target Count Badge */}
                <div className="absolute top-2.5 right-2.5 text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>目标结构: {ghostVoxels.length} 单元</span>
                </div>

                {/* Simulated 3D Isometric Blueprint Graphics */}
                <div className="relative w-44 h-32 flex items-center justify-center">
                  {/* Glowing Hologram Grid base */}
                  <div className="absolute inset-0 border border-cyan-500/30 rounded-lg transform -rotate-x-12 scale-90 bg-cyan-500/5 animate-pulse" />

                  {/* Blueprint Nodes Representation */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-20 h-10 border border-cyan-400/80 bg-cyan-400/20 rounded shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center justify-center text-[10px] text-cyan-200 font-bold">
                      目标空间连廊
                    </div>
                    <div className="w-12 h-6 border-x border-b border-dashed border-cyan-400/50 mt-1 flex items-center justify-center text-[9px] text-slate-400">
                      支撑高差
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 text-center mt-1">
                  参考目标架构已在 3D 舞台生成<strong>全息半透明透视虚影</strong>
                </div>
              </div>

              {/* Holographic Ghost Quick Switch */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                    {showGhost ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">主画布3D全息虚影</div>
                    <div className="text-[10px] text-slate-400">
                      {showGhost ? '当前已开启半透明虚影指引' : '虚影已隐藏，可在舞台自由摸索'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    onToggleGhost();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    showGhost
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  {showGhost ? '已开启' : '点击开启'}
                </button>
              </div>
            </div>
          )}

          {/* Three-View Blueprint Display */}
          {activeViewTab === 'threeView' && targetThreeView && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {renderProjectionMiniGrid(targetThreeView.front, '正视图蓝图', 'X × Y')}
                {renderProjectionMiniGrid(targetThreeView.top, '俯视图蓝图', 'X × Z')}
                {renderProjectionMiniGrid(targetThreeView.side, '左侧视蓝图', 'Z × Y')}
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                黄色格子为图纸要求实体必须占据的光影位置，不可遗漏也不可有多余遮挡
              </p>
            </div>
          )}

          {/* Structural Logic Guidance Card */}
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-200">
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>结构推演与构筑要领</span>
            </span>
            <p className="leading-relaxed text-slate-300">{description}</p>
          </div>

          {/* Coordinates breakdown */}
          {level.startPos && level.goalPos && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">起点坐标</span>
                <span className="font-mono text-sky-400 font-bold">[{level.startPos.join(', ')}]</span>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">终点坐标</span>
                <span className="font-mono text-rose-400 font-bold">[{level.goalPos.join(', ')}]</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <span>对照参考图开始推演</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
