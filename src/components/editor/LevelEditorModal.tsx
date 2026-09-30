import React, { useState, useEffect, useRef } from 'react';
import { 
  Hammer, 
  Play, 
  Save, 
  FolderOpen, 
  Share2, 
  Trash2, 
  Check, 
  Copy, 
  X, 
  Plus, 
  QrCode, 
  Download, 
  Sparkles, 
  Layers, 
  RotateCw, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BlockShape, PlacedBlock, PuzzleWinCondition, SavedCustomLevel, LevelData } from '../../types/game';
import { BLOCK_DEFINITIONS } from '../../utils/blockShapes';
import { generateQRCodeDataUrl } from '../../utils/qrHelper';
import { sound } from '../../services/sound';

const STORAGE_CUSTOM_LEVELS = 'blockcraft_custom_levels_library_v1';

interface LevelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaytestCustomLevel: (customLevel: LevelData) => void;
  currentPlacedBlocks?: PlacedBlock[];
  screenshotUrl?: string;
}

export const LevelEditorModal: React.FC<LevelEditorModalProps> = ({
  isOpen,
  onClose,
  onPlaytestCustomLevel,
  currentPlacedBlocks = [],
  screenshotUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'inventory' | 'library' | 'share'>('settings');

  // Level Attributes
  const [levelId, setLevelId] = useState<string>(() => `custom-${Date.now()}`);
  const [title, setTitle] = useState('悬空回旋迷踪');
  const [author, setAuthor] = useState('空间造梦师');
  const [theme, setTheme] = useState('奇幻森林');
  const [winCondition, setWinCondition] = useState<PuzzleWinCondition>('PATH_CONNECT');
  const [gridSize, setGridSize] = useState<{ x: number; y: number; z: number }>({ x: 5, y: 4, z: 5 });

  // Coordinates
  const [startPos, setStartPos] = useState<[number, number, number]>([0, 0, 1]);
  const [goalPos, setGoalPos] = useState<[number, number, number]>([4, 2, 3]);

  // Inventory available to challenger
  const [inventory, setInventory] = useState<{ type: BlockShape; count: number; color: string }[]>([
    { type: 'domino_2x1', count: 2, color: '#3b82f6' },
    { type: 'stair_step', count: 2, color: '#8b5cf6' },
    { type: 'cube_1x1', count: 3, color: '#f59e0b' },
    { type: 'bridge_arch', count: 1, color: '#f97316' },
  ]);

  // Saved levels in storage
  const [savedLevels, setSavedLevels] = useState<SavedCustomLevel[]>([]);
  const [selectedForShare, setSelectedForShare] = useState<SavedCustomLevel | null>(null);

  // Poster & QR states
  const posterCanvasRef = useRef<HTMLCanvasElement>(null);
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  // Load saved levels on mount
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_LEVELS);
      if (raw) {
        setSavedLevels(JSON.parse(raw));
      }
    } catch {
      // Ignore
    }
  }, [isOpen]);

  // Save current level to localStorage
  const handleSaveLevel = (autoShare = false) => {
    sound.playClick();

    // Construct preset blocks
    const presetBlocks: PlacedBlock[] = [
      {
        id: 'start-spawner',
        type: 'cube_1x1',
        position: startPos,
        rotation: [0, 0, 0],
        color: '#64748b',
        isStatic: true,
        isStart: true,
      },
      {
        id: 'goal-spawner',
        type: 'cube_1x1',
        position: goalPos,
        rotation: [0, 0, 0],
        color: '#ef4444',
        isStatic: true,
        isGoal: true,
      },
    ];

    // Encode to challenge payload
    const payload = {
      title,
      author,
      theme,
      gridSize,
      startPos,
      goalPos,
      presetBlocks,
      allowedInventory: inventory.filter((i) => i.count > 0),
      winCondition,
    };

    const token = `BK-${btoa(encodeURIComponent(JSON.stringify(payload))).slice(0, 10).toUpperCase()}`;

    const newSavedLevel: SavedCustomLevel = {
      id: levelId,
      title,
      author,
      theme,
      createdAt: new Date().toLocaleDateString('zh-CN'),
      updatedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      gridSize,
      startPos,
      goalPos,
      presetBlocks,
      allowedInventory: inventory.filter((i) => i.count > 0),
      winCondition,
      verified: true, // builder saves and tests
      shareCode: token,
      thumbnailDataUrl: screenshotUrl || '',
    };

    const updated = [newSavedLevel, ...savedLevels.filter((l) => l.id !== levelId)];
    setSavedLevels(updated);
    localStorage.setItem(STORAGE_CUSTOM_LEVELS, JSON.stringify(updated));

    if (autoShare) {
      setSelectedForShare(newSavedLevel);
      setActiveTab('share');
    }
  };

  // Load a saved level
  const handleLoadLevel = (level: SavedCustomLevel) => {
    sound.playClick();
    setLevelId(level.id);
    setTitle(level.title);
    setAuthor(level.author);
    setTheme(level.theme);
    setGridSize(level.gridSize);
    setStartPos(level.startPos);
    setGoalPos(level.goalPos);
    setInventory(level.allowedInventory);
    setWinCondition(level.winCondition);
    setActiveTab('settings');
  };

  // Delete a saved level
  const handleDeleteLevel = (id: string) => {
    sound.playRemove();
    const updated = savedLevels.filter((l) => l.id !== id);
    setSavedLevels(updated);
    localStorage.setItem(STORAGE_CUSTOM_LEVELS, JSON.stringify(updated));
  };

  // Playtest the custom level
  const handlePlaytest = () => {
    sound.playClick();
    handleSaveLevel(false);

    const levelData: LevelData = {
      id: 999,
      title: title || '自创关卡',
      subtitle: `${author} 的匠心设计`,
      theme,
      concept: '玩家自制空间几何通路',
      gridSize,
      winCondition,
      startPos,
      goalPos,
      presetBlocks: [
        {
          id: 'custom-start',
          type: 'cube_1x1',
          position: startPos,
          rotation: [0, 0, 0],
          color: '#64748b',
          isStatic: true,
          isStart: true,
        },
        {
          id: 'custom-goal',
          type: 'cube_1x1',
          position: goalPos,
          rotation: [0, 0, 0],
          color: '#ef4444',
          isStatic: true,
          isGoal: true,
        },
      ],
      allowedInventory: inventory.filter((i) => i.count > 0),
      hint: '这是你在关卡编辑器中定制的空间谜题，请亲自搭建验证能否顺利通行！',
      targetMoves: 4,
      targetSeconds: 30,
      initialLeaderboard: [
        { id: 'c1', name: author, avatar: '🧑‍🚀', timeSeconds: 12.5, moves: 4, date: '刚刚', isSelf: true },
        { id: 'c2', name: '林小鹿', avatar: '🦌', timeSeconds: 16.0, moves: 5, date: '等待挑战' },
      ],
    };

    onPlaytestCustomLevel(levelData);
    onClose();
  };

  // Update inventory item count
  const updateInventoryCount = (type: BlockShape, delta: number) => {
    sound.playClick();
    setInventory((prev) =>
      prev.map((i) =>
        i.type === type ? { ...i, count: Math.max(0, Math.min(10, i.count + delta)) } : i
      )
    );
  };

  // Generate Moments Poster with QR Code
  useEffect(() => {
    if (activeTab !== 'share') return;
    setIsGeneratingPoster(true);

    const targetLevel = selectedForShare || {
      id: levelId,
      title,
      author,
      theme,
      shareCode: `BK-CUSTOM-${Date.now().toString(36).toUpperCase()}`,
      gridSize,
      thumbnailDataUrl: screenshotUrl || '',
    };

    // Construct direct share URL
    const shareUrl = `${window.location.origin}${window.location.pathname}#code=${targetLevel.shareCode}`;

    // 1. Generate real QR code
    generateQRCodeDataUrl(shareUrl).then((qrData) => {
      setQrCodeUrl(qrData);

      const canvas = posterCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 750;
      canvas.height = 1200;

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 750, 1200);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.3, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 750, 1200);

      // Top Title Bar
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'left';
      ctx.fillText('【方块筑梦师 · 朋友圈自创关卡PK】', 50, 80);

      ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(targetLevel.title, 50, 145);

      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`关卡创作者: ${targetLevel.author} · 主题: ${targetLevel.theme}`, 50, 185);

      // Mini-Program tag
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(530, 45, 170, 48, 24);
      ctx.fill();
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('微信小游戏 ⚡', 615, 76);

      // 3D Screenshot Box
      const cardX = 50;
      const cardY = 225;
      const cardW = 650;
      const cardH = 480;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 24);
      ctx.fill();
      ctx.stroke();
      ctx.clip();

      const renderBottomDetails = () => {
        ctx.restore();

        // Level parameters row
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(50, 735, 650, 95, 16);
        ctx.fill();
        ctx.stroke();

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText(`空间跨度: ${targetLevel.gridSize.x}×${targetLevel.gridSize.y}×${targetLevel.gridSize.z} 格`, 75, 775);
        ctx.fillText('挑战机制: 3D空间实体连续通路搭建', 75, 810);

        // Challenge Quote Banner
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.beginPath();
        ctx.roundRect(50, 855, 650, 60, 30);
        ctx.fill();

        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText('“这是我亲自设计的空间难题，微信好友谁能一步通关？！”', 375, 892);

        // Bottom QR Code & Action Section
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(50, 940, 650, 210, 24);
        ctx.fill();

        // Draw generated QR code image
        if (qrData) {
          const qrImg = new Image();
          qrImg.onload = () => {
            ctx.drawImage(qrImg, 75, 960, 170, 170);

            // Right text description
            ctx.font = 'bold 28px sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'left';
            ctx.fillText('长按识别二维码直达关卡', 270, 1005);

            ctx.font = '20px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('免下载进入微信小游戏，即刻挑战！', 270, 1045);

            // Token Pill
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            ctx.roundRect(270, 1070, 400, 48, 10);
            ctx.fill();

            ctx.font = 'bold 20px monospace';
            ctx.fillStyle = '#0284c7';
            ctx.fillText(`挑战口令: ${targetLevel.shareCode}`, 290, 1102);

            setPosterUrl(canvas.toDataURL('image/png'));
            setIsGeneratingPoster(false);
          };
          qrImg.src = qrData;
        } else {
          setPosterUrl(canvas.toDataURL('image/png'));
          setIsGeneratingPoster(false);
        }
      };

      if (targetLevel.thumbnailDataUrl) {
        const thumb = new Image();
        thumb.crossOrigin = 'anonymous';
        thumb.onload = () => {
          ctx.drawImage(thumb, cardX, cardY, cardW, cardH);
          renderBottomDetails();
        };
        thumb.onerror = () => {
          renderBottomDetails();
        };
        thumb.src = targetLevel.thumbnailDataUrl;
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('3D 空间自创结构', 375, 480);
        renderBottomDetails();
      }
    });
  }, [activeTab, selectedForShare, levelId, title, author, theme, gridSize, screenshotUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Hammer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">关卡工坊 · 3D空间编辑器</h2>
              <p className="text-[11px] text-slate-400">自由构筑空间谜题，生成朋友圈挑战二维码</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 gap-1.5 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('settings');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            空间参数
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('inventory');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            挑战背包
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('library');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
              activeTab === 'library'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>自创题库 ({savedLevels.length})</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('share');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
              activeTab === 'share'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>朋友圈海报 & 二维码</span>
          </button>
        </div>

        {/* Tab 1: Settings & Grid */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">关卡标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="例如：莫比乌斯天空梯"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">创作者昵称</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="微信昵称"
                />
              </div>
            </div>

            {/* Theme Selector */}
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-200 mb-2">选择视觉主题风格</label>
              <div className="grid grid-cols-3 gap-2">
                {['奇幻森林', '太空探索', '机械神殿'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      sound.playClick();
                      setTheme(t);
                    }}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                      theme === t
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === '奇幻森林' ? '🌲 奇幻森林' : t === '太空探索' ? '🚀 太空探索' : '⚙️ 机械神殿'}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Grid Dimensions */}
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-200 mb-2">空间网格边界 (X × Y × Z)</label>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">X 轴跨度 (宽)</span>
                  <input
                    type="number"
                    min={3}
                    max={7}
                    value={gridSize.x}
                    onChange={(e) => setGridSize({ ...gridSize, x: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-center text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Y 轴垂直高度</span>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={gridSize.y}
                    onChange={(e) => setGridSize({ ...gridSize, y: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-center text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Z 轴进深 (长)</span>
                  <input
                    type="number"
                    min={3}
                    max={7}
                    value={gridSize.z}
                    onChange={(e) => setGridSize({ ...gridSize, z: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-center text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Start and Goal Spawner Positions */}
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">起点与终点三维坐标配置</span>
                <span className="text-[10px] text-slate-400 font-mono">[X, Y, Z]</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Start */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>起点出生点</span>
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={startPos[0]}
                      onChange={(e) => setStartPos([Number(e.target.value), startPos[1], startPos[2]])}
                      className="bg-slate-950 text-center rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                    <input
                      type="number"
                      value={startPos[1]}
                      onChange={(e) => setStartPos([startPos[0], Number(e.target.value), startPos[2]])}
                      className="bg-slate-950 text-center rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                    <input
                      type="number"
                      value={startPos[2]}
                      onChange={(e) => setStartPos([startPos[0], startPos[1], Number(e.target.value)])}
                      className="bg-slate-950 text-center rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Goal */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>终点奖杯标杆</span>
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={goalPos[0]}
                      onChange={(e) => setGoalPos([Number(e.target.value), goalPos[1], goalPos[2]])}
                      className="bg-slate-950 text-center rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                    <input
                      type="number"
                      value={goalPos[1]}
                      onChange={(e) => setGoalPos([goalPos[0], Number(e.target.value), goalPos[2]])}
                      className="bg-slate-950 text-center rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                    <input
                      type="number"
                      value={goalPos[2]}
                      onChange={(e) => setGoalPos([goalPos[0], goalPos[1], Number(e.target.value)])}
                      className="bg-slate-950 text-center rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Inventory Setup */}
        {activeTab === 'inventory' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-semibold text-white mb-1">为解谜者配置可用积木数量</h4>
              <p className="text-[11px] text-slate-400">
                通过精细限制可用积木类型与数量，制造独特的空间思维挑战！
              </p>
            </div>

            <div className="space-y-2">
              {inventory.map((item) => {
                const def = BLOCK_DEFINITIONS[item.type];
                return (
                  <div
                    key={item.type}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg shadow-sm border border-white/20 flex items-center justify-center text-xs font-bold text-white/90"
                        style={{ backgroundColor: item.color }}
                      >
                        {def?.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-100">{def?.name}</div>
                        <div className="text-[10px] text-slate-400">{def?.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateInventoryCount(item.type, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-sm text-amber-400">
                        {item.count}
                      </span>
                      <button
                        onClick={() => updateInventoryCount(item.type, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add missing shape types */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-2">添加其他积木形态：</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(BLOCK_DEFINITIONS) as BlockShape[])
                  .filter((s) => !inventory.some((i) => i.type === s))
                  .map((shape) => {
                    const def = BLOCK_DEFINITIONS[shape];
                    return (
                      <button
                        key={shape}
                        onClick={() => {
                          sound.playClick();
                          setInventory((prev) => [
                            ...prev,
                            { type: shape, count: 2, color: def.baseColor },
                          ]);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 border border-slate-700"
                      >
                        <Plus className="w-3 h-3 text-amber-400" />
                        <span>{def.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Saved Library */}
        {activeTab === 'library' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {savedLevels.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <FolderOpen className="w-10 h-10 stroke-1 mb-2 text-slate-600" />
                <p className="text-xs">暂无自创关卡记录</p>
                <p className="text-[11px] mt-1 text-slate-600">在“空间参数”中设计完成后点击“保存关卡”即可沉淀至此</p>
              </div>
            ) : (
              savedLevels.map((lvl) => (
                <div
                  key={lvl.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{lvl.title}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                        {lvl.theme}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>创建: {lvl.createdAt}</span>
                      <span>·</span>
                      <span>跨度: {lvl.gridSize.x}×{lvl.gridSize.y}×{lvl.gridSize.z}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleLoadLevel(lvl)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => {
                        setSelectedForShare(lvl);
                        setActiveTab('share');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-medium text-amber-300 flex items-center gap-1 border border-amber-500/30"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>分享</span>
                    </button>
                    <button
                      onClick={() => handleDeleteLevel(lvl.id)}
                      className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Moments Poster & QR Code */}
        {activeTab === 'share' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center space-y-3">
            <canvas ref={posterCanvasRef} className="hidden" />

            {isGeneratingPoster ? (
              <div className="w-full aspect-[9/14] max-h-[50vh] rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-slate-800">
                <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs text-slate-400 mt-2">正在实时合成朋友圈高清二维码战报...</p>
              </div>
            ) : (
              <div className="relative w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80">
                <img src={posterUrl} alt="朋友圈关卡海报" className="w-full h-auto object-cover" />
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-sm py-1 px-2.5 rounded-lg text-center text-[10px] text-slate-300">
                  长按海报可直接保存或发送给微信朋友
                </div>
              </div>
            )}

            <div className="w-full max-w-xs space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    if (!posterUrl) return;
                    const a = document.createElement('a');
                    a.download = `方块筑梦师_${title}_朋友圈海报.png`;
                    a.href = posterUrl;
                    a.click();
                  }}
                  className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>保存二维码海报</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    const shareText = `【微信小游戏 · 方块筑梦师】我自制了一道高难度空间解谜关卡《${title}》！用微信扫描海报二维码，或者输入挑战口令 ${selectedForShare?.shareCode || levelId} 立即开玩！`;
                    navigator.clipboard.writeText(shareText);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '文案已复制！' : '复制朋友圈打榜语'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => handleSaveLevel(false)}
            className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>保存关卡</span>
          </button>

          <button
            onClick={handlePlaytest}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>进入3D空间亲自通关自测</span>
          </button>
        </div>
      </div>
    </div>
  );
};
