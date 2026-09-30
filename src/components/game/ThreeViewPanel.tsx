import React, { useState } from 'react';
import { Eye, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { ThreeViewProjection } from '../../types/game';

interface ThreeViewPanelProps {
  currentProjection: ThreeViewProjection;
  targetProjection?: ThreeViewProjection;
  matchScore?: { matchPercentage: number; details: { top: number; front: number; side: number } };
  isThreeViewGoal?: boolean;
  onOpenReferenceBlueprint?: () => void;
}

export const ThreeViewPanel: React.FC<ThreeViewPanelProps> = ({
  currentProjection,
  targetProjection,
  matchScore,
  isThreeViewGoal,
  onOpenReferenceBlueprint,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Render a 2D boolean grid
  const renderGrid = (
    grid: boolean[][],
    targetGrid?: boolean[][],
    title?: string,
    axisLabels?: { x: string; y: string }
  ) => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-[11px] font-semibold text-slate-300">{title}</span>
          {targetGrid && (
            <span className="text-[9px] text-amber-400 font-mono">
              {axisLabels?.y} × {axisLabels?.x}
            </span>
          )}
        </div>
        <div
          className="grid gap-[2px] bg-slate-950/80 p-1 rounded-md border border-slate-700/60 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, rIdx) =>
            // Invert row index so y=0 is at bottom
            row.map((cell, cIdx) => {
              const actualRow = rows - 1 - rIdx;
              const isFilled = grid[actualRow]?.[cIdx];
              const targetFilled = targetGrid ? targetGrid[actualRow]?.[cIdx] : undefined;

              let cellStyle = 'bg-slate-800/80 border-slate-700/30';
              if (targetFilled !== undefined) {
                if (isFilled && targetFilled) {
                  // Matched correctly!
                  cellStyle = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] border-emerald-400';
                } else if (isFilled && !targetFilled) {
                  // Redundant block placed
                  cellStyle = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)] border-rose-400';
                } else if (!isFilled && targetFilled) {
                  // Missing block needed by blueprint
                  cellStyle = 'bg-amber-500/20 border-amber-400/60 border-dashed animate-pulse';
                }
              } else if (isFilled) {
                cellStyle = 'bg-amber-400 border-amber-300 shadow-sm';
              }

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[2px] border transition-colors ${cellStyle}`}
                />
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="absolute top-16 right-3 z-20 pointer-events-auto">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-2.5 max-w-[280px] transition-all">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left text-xs text-slate-200 font-medium pb-1"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>三维空间投影图</span>
            {isThreeViewGoal && matchScore && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                matchScore.matchPercentage === 100
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {matchScore.matchPercentage}% 契合
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-slate-800 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {renderGrid(currentProjection.front, targetProjection?.front, '主视图 (正)', { x: 'X', y: 'Y' })}
              {renderGrid(currentProjection.top, targetProjection?.top, '俯视图 (顶)', { x: 'X', y: 'Z' })}
              {renderGrid(currentProjection.side, targetProjection?.side, '侧视图 (左)', { x: 'Z', y: 'Y' })}
            </div>

            {targetProjection && (
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 px-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 完美重合
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400/40 border border-dashed border-amber-400 inline-block" /> 缺失图纸
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> 多余遮挡
                </span>
              </div>
            )}

            {onOpenReferenceBlueprint && (
              <button
                onClick={onOpenReferenceBlueprint}
                className="w-full mt-1.5 py-1 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-medium flex items-center justify-center gap-1 border border-amber-500/30 transition-colors"
              >
                <span>🔍 查看目标造型参考图</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
