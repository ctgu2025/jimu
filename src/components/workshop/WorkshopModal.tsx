import React, { useState } from 'react';
import { Hammer, Play, Share2, Check, Copy, X, Plus, Trash2, HelpCircle } from 'lucide-react';
import { BlockShape, PlacedBlock, PuzzleWinCondition } from '../../types/game';
import { BLOCK_DEFINITIONS } from '../../utils/blockShapes';
import { sound } from '../../services/sound';

interface WorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCustomLevel: (customData: {
    title: string;
    gridSize: { x: number; y: number; z: number };
    presetBlocks: PlacedBlock[];
    allowedInventory: { type: BlockShape; count: number; color: string }[];
    winCondition: PuzzleWinCondition;
    startPos?: [number, number, number];
    goalPos?: [number, number, number];
  }) => void;
}

export const WorkshopModal: React.FC<WorkshopModalProps> = ({
  isOpen,
  onClose,
  onLoadCustomLevel,
}) => {
  const [title, setTitle] = useState('空间神级考验');
  const [gridSize, setGridSize] = useState<{ x: number; y: number; z: number }>({ x: 5, y: 4, z: 5 });
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [startZ, setStartZ] = useState(1);
  const [goalX, setGoalX] = useState(4);
  const [goalY, setGoalY] = useState(2);
  const [goalZ, setGoalZ] = useState(3);

  // Inventory configuration
  const [inventoryList, setInventoryList] = useState<{ type: BlockShape; count: number; color: string }[]>([
    { type: 'domino_2x1', count: 2, color: '#3b82f6' },
    { type: 'stair_step', count: 2, color: '#8b5cf6' },
    { type: 'cube_1x1', count: 3, color: '#f59e0b' },
    { type: 'bridge_arch', count: 1, color: '#f97316' },
  ]);

  const [shareCode, setShareCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleUpdateCount = (type: BlockShape, delta: number) => {
    sound.playClick();
    setInventoryList((prev) =>
      prev.map((item) =>
        item.type === type ? { ...item, count: Math.max(0, Math.min(10, item.count + delta)) } : item
      )
    );
  };

  const handleAddBlockToInventory = (shape: BlockShape) => {
    sound.playClick();
    if (inventoryList.some((i) => i.type === shape)) {
      handleUpdateCount(shape, 1);
      return;
    }
    const def = BLOCK_DEFINITIONS[shape];
    setInventoryList((prev) => [...prev, { type: shape, count: 2, color: def.baseColor }]);
  };

  const handleCreateAndTest = () => {
    sound.playClick();
    const presetBlocks: PlacedBlock[] = [
      {
        id: 'workshop-start',
        type: 'cube_1x1',
        position: [startX, startY, startZ],
        rotation: [0, 0, 0],
        color: '#64748b',
        isStatic: true,
        isStart: true,
      },
      {
        id: 'workshop-goal',
        type: 'cube_1x1',
        position: [goalX, goalY, goalZ],
        rotation: [0, 0, 0],
        color: '#ef4444',
        isStatic: true,
        isGoal: true,
      },
    ];

    const customLevel = {
      title,
      gridSize,
      presetBlocks,
      allowedInventory: inventoryList.filter((i) => i.count > 0),
      winCondition: 'PATH_CONNECT' as PuzzleWinCondition,
      startPos: [startX, startY, startZ] as [number, number, number],
      goalPos: [goalX, goalY, goalZ] as [number, number, number],
    };

    // Generate compact share code
    const payload = btoa(encodeURIComponent(JSON.stringify(customLevel)));
    setShareCode(`BK-${payload.slice(0, 10).toUpperCase()}`);

    onLoadCustomLevel(customLevel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full h-[88vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-sm text-slate-100">关卡工坊 · 创客造关</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Level Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">关卡名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              placeholder="例如：莫比乌斯天空梯"
            />
          </div>

          {/* Grid Dimensions */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-200 mb-2">空间网格跨度 (X × Y × Z)</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400">X 宽度</span>
                <input
                  type="number"
                  min={3}
                  max={7}
                  value={gridSize.x}
                  onChange={(e) => setGridSize({ ...gridSize, x: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-center text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Y 最大高度</span>
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={gridSize.y}
                  onChange={(e) => setGridSize({ ...gridSize, y: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-center text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Z 进深</span>
                <input
                  type="number"
                  min={3}
                  max={7}
                  value={gridSize.z}
                  onChange={(e) => setGridSize({ ...gridSize, z: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-center text-white"
                />
              </div>
            </div>
          </div>

          {/* Start & Goal Positions */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">起点与终点三维坐标</span>
              <span className="text-[10px] text-slate-400">[X, Y, Z]</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Start */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] font-medium text-sky-400 flex items-center gap-1 mb-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> 起点光圈
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={startX}
                    onChange={(e) => setStartX(Number(e.target.value))}
                    className="bg-slate-950 text-center rounded p-1 text-[11px] text-white"
                  />
                  <input
                    type="number"
                    value={startY}
                    onChange={(e) => setStartY(Number(e.target.value))}
                    className="bg-slate-950 text-center rounded p-1 text-[11px] text-white"
                  />
                  <input
                    type="number"
                    value={startZ}
                    onChange={(e) => setStartZ(Number(e.target.value))}
                    className="bg-slate-950 text-center rounded p-1 text-[11px] text-white"
                  />
                </div>
              </div>

              {/* Goal */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" /> 终点奖杯
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={goalX}
                    onChange={(e) => setGoalX(Number(e.target.value))}
                    className="bg-slate-950 text-center rounded p-1 text-[11px] text-white"
                  />
                  <input
                    type="number"
                    value={goalY}
                    onChange={(e) => setGoalY(Number(e.target.value))}
                    className="bg-slate-950 text-center rounded p-1 text-[11px] text-white"
                  />
                  <input
                    type="number"
                    value={goalZ}
                    onChange={(e) => setGoalZ(Number(e.target.value))}
                    className="bg-slate-950 text-center rounded p-1 text-[11px] text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Allowed Block Inventory Setting */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">挑战者可用积木库</span>
              <span className="text-[10px] text-slate-400">限制可用数量以增加解谜难度</span>
            </div>

            <div className="space-y-2">
              {inventoryList.map((item) => {
                const def = BLOCK_DEFINITIONS[item.type];
                return (
                  <div
                    key={item.type}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-slate-200">{def.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateCount(item.type, -1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs text-amber-400">
                        {item.count}
                      </span>
                      <button
                        onClick={() => handleUpdateCount(item.type, 1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick add missing shape */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 w-full mb-1">添加其他特殊积木：</span>
              {(Object.keys(BLOCK_DEFINITIONS) as BlockShape[])
                .filter((s) => !inventoryList.some((i) => i.type === s))
                .map((shape) => {
                  const def = BLOCK_DEFINITIONS[shape];
                  return (
                    <button
                      key={shape}
                      onClick={() => handleAddBlockToInventory(shape)}
                      className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 border border-slate-700"
                    >
                      <Plus className="w-2.5 h-2.5 text-amber-400" />
                      <span>{def.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <button
            onClick={handleCreateAndTest}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>进入3D画布自测 & 发布挑战</span>
          </button>
        </div>
      </div>
    </div>
  );
};
