import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { THEME_PACKS } from './data/levelPacks';
import { LevelData, PlacedBlock, BlockShape, ThreeViewProjection, WeChatMomentsPost, FriendRankItem, UserLevelProgress, ThemePack, DailyChallengeRecord } from './types/game';
import { BLOCK_DEFINITIONS, computeThreeView, compareThreeView, findPath, getBlockOccupiedVoxels } from './utils/blockShapes';
import { sound } from './services/sound';
import { VoxelCanvas, VoxelCanvasHandle } from './components/game/VoxelCanvas';
import { GameHUD } from './components/game/GameHUD';
import { ThreeViewPanel } from './components/game/ThreeViewPanel';
import { VictoryModal } from './components/game/VictoryModal';
import { MomentsPosterModal } from './components/share/MomentsPosterModal';
import { WeChatShareActionSheet } from './components/share/WeChatShareActionSheet';
import { MomentsFeedModal } from './components/social/MomentsFeedModal';
import { LevelEditorModal } from './components/editor/LevelEditorModal';
import { LevelPackModal } from './components/game/LevelPackModal';
import { ReferenceBlueprintModal } from './components/game/ReferenceBlueprintModal';
import { HintModal } from './components/game/HintModal';
import { DailyChallengeModal } from './components/game/DailyChallengeModal';
import { WeChatShell } from './components/wechat/WeChatShell';
import { getTargetGhostVoxels } from './utils/referenceHelper';
import { generateDailyLevel, getTodayDateString } from './utils/dailyChallenge';

const STORAGE_KEY_PROGRESS = 'blockcraft_user_progress_v2';
const STORAGE_KEY_DAILY = 'blockcraft_daily_records_v1';

interface HistorySnapshot {
  placedBlocks: PlacedBlock[];
  inventory: { type: BlockShape; count: number; color: string }[];
  moves: number;
}

export default function App() {
  const voxelCanvasRef = useRef<VoxelCanvasHandle>(null);

  // Theme Pack & Level state
  const [currentPackId, setCurrentPackId] = useState<string>('forest');
  const currentPack: ThemePack = THEME_PACKS.find((p) => p.id === currentPackId) || THEME_PACKS[0];

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const currentLevel: LevelData = currentPack.levels[currentLevelIndex] || currentPack.levels[0];

  // Daily Challenge State & Records
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyChallengeRecord>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DAILY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [isDailyActive, setIsDailyActive] = useState(false);

  // Generate today's unique deterministic level
  const todayStr = getTodayDateString();
  const todayDailyLevel: LevelData = useMemo(() => generateDailyLevel(todayStr), [todayStr]);
  const todayDailyRecord = dailyRecords[todayStr];

  // Active level: if daily challenge is active, use today's daily level; otherwise campaign level
  const activeLevel: LevelData = isDailyActive ? todayDailyLevel : currentLevel;

  // Placed Blocks
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  // Inventory counts remaining
  const [inventory, setInventory] = useState<{ type: BlockShape; count: number; color: string }[]>([]);
  // History Stack for Undo operation
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  // Currently selected shape for placement
  const [selectedShape, setSelectedShape] = useState<BlockShape | null>(null);
  // Current rotation [rx, ry, rz]
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  // Demolish / Eraser Mode
  const [isDemolishMode, setIsDemolishMode] = useState(false);

  // Game Stats
  const [moves, setMoves] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // User Progression (stars and best records)
  const [userProgressMap, setUserProgressMap] = useState<Record<number, UserLevelProgress>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Modals & Panels
  const [showVictory, setShowVictory] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showMomentsFeed, setShowMomentsFeed] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showLevelPacks, setShowLevelPacks] = useState(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [showTargetGhost, setShowTargetGhost] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Victory / Snapshot state
  const [victoryScreenshot, setVictoryScreenshot] = useState<string>('');
  const [currentStars, setCurrentStars] = useState(3);

  // Dynamic WeChat Moments Stream
  const [momentsPosts, setMomentsPosts] = useState<WeChatMomentsPost[]>([
    {
      id: 'post-1',
      authorName: '张浩然 空间筑造',
      authorAvatar: '📐',
      timestamp: '20分钟前',
      levelTitle: '碧溪横木',
      levelNumber: 2,
      timeSeconds: 6.8,
      moves: 2,
      caption: '奇幻森林的悬臂延伸太讲究力学重心了！用长梁配双连块一次通过，谁来破我纪录？',
      likes: ['森之精灵·鹿鸣', 'Vivian周', '陈工@设计院'],
      comments: [
        { user: '森之精灵·鹿鸣', text: '这个搭法好巧妙，我刚刚也用这个姿势过了！' },
        { user: '陈工@设计院', text: '典型的高空挑梁结构，赞！' },
      ],
    },
    {
      id: 'post-2',
      authorName: '森之精灵·鹿鸣',
      authorAvatar: '🦌',
      timestamp: '1小时前',
      levelTitle: '蘑菇小径',
      levelNumber: 3,
      timeSeconds: 14.2,
      moves: 4,
      caption: '森林关卡包太治愈了！连续双阶梯爬升，把视角切到俯视对齐超好用！',
      likes: ['小青苔', '张浩然 空间筑造'],
      comments: [
        { user: '小青苔', text: '我转了4次视角才连上通路哈哈～' },
      ],
    },
    {
      id: 'post-3',
      authorName: '天宫宇航员-刘',
      authorAvatar: '👨‍🚀',
      timestamp: '2小时前',
      levelTitle: '全息雷达',
      levelNumber: 4,
      timeSeconds: 22.4,
      moves: 4,
      caption: '太空探索包的全息三视图简直绝了！主视和俯视必须精准契合，极客狂喜！',
      likes: ['星舰领航员', 'Leo王同学'],
      comments: [
        { user: '星舰领航员', text: '第4关我也花了20多秒，空间感拉满！' },
      ],
    },
  ]);

  // Current Level Leaderboard
  const [currentLeaderboard, setCurrentLeaderboard] = useState<FriendRankItem[]>(
    activeLevel.initialLeaderboard
  );

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Initialize level
  const initLevel = useCallback((level: LevelData) => {
    setPlacedBlocks([...level.presetBlocks]);
    setInventory(level.allowedInventory.map((i) => ({ ...i })));
    setHistory([]);
    setSelectedShape(level.allowedInventory[0]?.type || 'cube_1x1');
    setRotation([0, 0, 0]);
    setIsDemolishMode(false);
    setMoves(0);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setIsSimulating(false);
    setShowVictory(false);
    setCurrentLeaderboard([...level.initialLeaderboard]);
    voxelCanvasRef.current?.resetCamera();
  }, []);

  // On level or pack change (for campaign)
  useEffect(() => {
    if (!isDailyActive) {
      initLevel(currentLevel);
    }
  }, [currentLevel, isDailyActive, initLevel]);

  // Timer loop
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Check URL hash for shared custom codes or challenges on load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#code=') || hash.startsWith('#custom=')) {
      const code = hash.replace(/^#(code|custom)=/, '');
      showToast(`已检测到好友分享的关卡挑战码：${code}`);
    }
  }, []);

  // Compute live three-view projection
  const currentProjection: ThreeViewProjection = computeThreeView(placedBlocks, activeLevel.gridSize);
  const matchScore = activeLevel.targetThreeView
    ? compareThreeView(currentProjection, activeLevel.targetThreeView, activeLevel.gridSize)
    : undefined;

  // Compute 3D target reference ghost voxels for the active level
  const targetGhostVoxels = getTargetGhostVoxels(activeLevel);

  // Start Daily Challenge
  const handleStartDailyChallenge = () => {
    setIsDailyActive(true);
    setShowDailyChallenge(false);
    initLevel(todayDailyLevel);
    showToast(`🔥 已进入今日全服空间挑战《${todayDailyLevel.title}》！冲刺最快通关！`);
  };

  // Handle block placement
  const handlePlaceBlock = (pos: [number, number, number]) => {
    if (!selectedShape || isSimulating) return;

    // Check inventory availability
    const invItem = inventory.find((i) => i.type === selectedShape);
    if (!invItem || invItem.count <= 0) {
      sound.playError();
      showToast('该形状积木已用尽，拆除或使用其他积木！');
      return;
    }

    const newBlock: PlacedBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: selectedShape,
      position: pos,
      rotation: [...rotation],
      color: invItem.color,
    };

    // Collision check with existing blocks
    const newOccupied = getBlockOccupiedVoxels(newBlock);
    const existingOccupied = new Set(
      placedBlocks.flatMap((b) => getBlockOccupiedVoxels(b).map(([x, y, z]) => `${x},${y},${z}`))
    );

    const hasCollision = newOccupied.some(([x, y, z]) => existingOccupied.has(`${x},${y},${z}`));
    const isOutOfBounds = newOccupied.some(
      ([x, y, z]) =>
        x < 0 ||
        x >= activeLevel.gridSize.x ||
        y < 0 ||
        y >= activeLevel.gridSize.y ||
        z < 0 ||
        z >= activeLevel.gridSize.z
    );

    if (hasCollision || isOutOfBounds) {
      sound.playError();
      showToast('无法在此位置放置：超出边界或重叠冲突！');
      return;
    }

    // Save history snapshot before state change
    setHistory((prev) => [
      ...prev.slice(-30),
      {
        placedBlocks: [...placedBlocks],
        inventory: inventory.map((i) => ({ ...i })),
        moves,
      },
    ]);

    // Sound and haptic
    sound.playPlace(moves % 5);
    sound.triggerHaptic('light');

    // Add block & decrement inventory
    setPlacedBlocks((prev) => [...prev, newBlock]);
    setInventory((prev) =>
      prev.map((item) =>
        item.type === selectedShape ? { ...item, count: item.count - 1 } : item
      )
    );
    setMoves((prev) => prev + 1);

    // Auto-check if 3-view puzzle is solved
    if (activeLevel.winCondition === 'THREE_VIEW_MATCH' && activeLevel.targetThreeView) {
      const nextBlocks = [...placedBlocks, newBlock];
      const nextProj = computeThreeView(nextBlocks, activeLevel.gridSize);
      const score = compareThreeView(nextProj, activeLevel.targetThreeView, activeLevel.gridSize);
      if (score.isMatch) {
        handleVictoryTrigger();
      }
    }
  };

  // Handle block removal
  const handleRemoveBlock = (blockId: string) => {
    const targetBlock = placedBlocks.find((b) => b.id === blockId);
    if (!targetBlock || targetBlock.isStatic) {
      sound.playError();
      showToast('基座或障碍属于固定结构，不可拆除！');
      return;
    }

    // Save history snapshot before removing
    setHistory((prev) => [
      ...prev.slice(-30),
      {
        placedBlocks: [...placedBlocks],
        inventory: inventory.map((i) => ({ ...i })),
        moves,
      },
    ]);

    sound.playRemove();
    sound.triggerHaptic('medium');

    // Remove block & refund inventory
    setPlacedBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setInventory((prev) =>
      prev.map((item) =>
        item.type === targetBlock.type ? { ...item, count: item.count + 1 } : item
      )
    );
    setMoves((prev) => prev + 1);
  };

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isSimulating) return;

    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setPlacedBlocks(previous.placedBlocks);
    setInventory(previous.inventory);
    setMoves(previous.moves);

    sound.playRemove();
    sound.triggerHaptic('light');
    showToast('已撤销上一步积木操作');
  }, [history, isSimulating]);

  // Keyboard shortcut Ctrl+Z / Cmd+Z support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  // Handle Victory Trigger
  const handleVictoryTrigger = () => {
    setIsTimerRunning(false);
    sound.playVictory();
    sound.triggerHaptic('heavy');

    // Capture screenshot from 3D canvas
    const screenshot = voxelCanvasRef.current?.captureScreenshot() || '';
    setVictoryScreenshot(screenshot);

    // Calculate stars
    let stars = 3;
    if (moves > activeLevel.targetMoves + 2 || elapsedSeconds > activeLevel.targetSeconds * 1.5) {
      stars = 2;
    }
    if (moves > activeLevel.targetMoves + 4 || elapsedSeconds > activeLevel.targetSeconds * 2.2) {
      stars = 1;
    }
    setCurrentStars(stars);

    if (isDailyActive) {
      // Record daily challenge progression
      const existing = dailyRecords[todayStr];
      const newDailyRecord: DailyChallengeRecord = {
        date: todayStr,
        completed: true,
        timeSeconds: existing ? Math.min(existing.timeSeconds, elapsedSeconds) : elapsedSeconds,
        moves: existing ? Math.min(existing.moves, moves) : moves,
        stars: Math.max(existing?.stars || 0, stars),
      };
      const updatedMap = { ...dailyRecords, [todayStr]: newDailyRecord };
      setDailyRecords(updatedMap);
      try {
        localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(updatedMap));
      } catch {}
      showToast(`🏆 今日全服空间挑战达成！用时 ${elapsedSeconds.toFixed(1)}s，已载入全球排行榜！`);
    } else {
      // Save campaign progression
      setUserProgressMap((prev) => {
        const existing = prev[activeLevel.id];
        const updated: UserLevelProgress = {
          levelId: activeLevel.id,
          stars: Math.max(existing?.stars || 0, stars),
          bestTime: existing?.bestTime ? Math.min(existing.bestTime, elapsedSeconds) : elapsedSeconds,
          bestMoves: existing?.bestMoves ? Math.min(existing.bestMoves, moves) : moves,
          completed: true,
        };
        const newMap = { ...prev, [activeLevel.id]: updated };
        try {
          localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(newMap));
        } catch {
          // Ignore
        }
        return newMap;
      });
    }

    // Add player to local leaderboard
    const selfRankItem: FriendRankItem = {
      id: 'self',
      name: '我 (空间极客)',
      avatar: '🧑‍🚀',
      timeSeconds: parseFloat(elapsedSeconds.toFixed(1)),
      moves,
      date: '刚刚',
      isSelf: true,
    };

    setCurrentLeaderboard((prev) => {
      const filtered = prev.filter((p) => !p.isSelf);
      const combined = [...filtered, selfRankItem].sort((a, b) => a.timeSeconds - b.timeSeconds);
      return combined;
    });

    setShowVictory(true);
  };

  // Run Test / Path Validation
  const handleRunTest = () => {
    if (isSimulating) return;

    if (activeLevel.winCondition === 'THREE_VIEW_MATCH') {
      if (matchScore?.isMatch) {
        handleVictoryTrigger();
      } else {
        sound.playError();
        showToast(`尚未满足图纸！当前契合度 ${matchScore?.matchPercentage || 0}%，请核对三视图！`);
      }
      return;
    }

    // PATH_CONNECT win condition
    if (!activeLevel.startPos || !activeLevel.goalPos) return;

    const path = findPath(
      placedBlocks,
      activeLevel.gridSize,
      activeLevel.startPos,
      activeLevel.goalPos
    );

    if (path && path.length > 0) {
      setIsSimulating(true);
      showToast('⚡ 空间通路完整闭合！小木偶出发检验...');
      voxelCanvasRef.current?.runSimulation(path, () => {
        setIsSimulating(false);
        handleVictoryTrigger();
      });
    } else {
      sound.playError();
      showToast('❌ 通路中断：小木偶无法跳跃大于1格断崖或高差，请继续搭桥！');
    }
  };

  // Post to Moments Feed
  const handlePostToMoments = () => {
    sound.playClick();
    const newPost: WeChatMomentsPost = {
      id: `post-${Date.now()}`,
      authorName: '我 (空间极客)',
      authorAvatar: '🧑‍🚀',
      timestamp: '刚刚',
      levelTitle: isDailyActive ? `[每日挑战] ${activeLevel.title}` : activeLevel.title,
      levelNumber: isDailyActive ? 999 : activeLevel.id % 100,
      timeSeconds: parseFloat(elapsedSeconds.toFixed(1)),
      moves,
      caption: isDailyActive
        ? `🔥我在今日全服空间挑战《${activeLevel.title}》中创下了 ${elapsedSeconds.toFixed(1)}s / ${moves}步 的超神战绩！登顶今日全服榜，朋友圈谁敢来战？`
        : `我在《${currentPack.name}》第${activeLevel.id % 100}关《${activeLevel.title}》创下了 ${elapsedSeconds.toFixed(1)}s / ${moves}步 的超神战绩！朋友圈谁来破我的纪录？`,
      likes: ['林小鹿', '张浩然 空间筑造'],
      comments: [
        { user: '林小鹿', text: '太牛了！这个搭建思路好精巧！' },
        { user: '张浩然 空间筑造', text: '我用了5步才搞定，你居然这么快！' },
      ],
      snapshotUrl: victoryScreenshot,
      challengeCode: `BK${activeLevel.id}X${moves}S${Math.round(elapsedSeconds)}`,
    };

    setMomentsPosts((prev) => [newPost, ...prev]);
    showToast('已同步发布到微信朋友圈圈子！好友正在赶来PK！');
    setShowMomentsFeed(true);
  };

  // Like a post
  const handleLikePost = (postId: string) => {
    setMomentsPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasLiked = p.likes.includes('我');
          return {
            ...p,
            likes: hasLiked ? p.likes.filter((u) => u !== '我') : [...p.likes, '我'],
          };
        }
        return p;
      })
    );
  };

  // Comment on a post
  const handleCommentPost = (postId: string, text: string) => {
    setMomentsPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, { user: '我', text }] } : p
      )
    );
    showToast('评论发送成功');
  };

  // Challenge a specific level from Moments
  const handleChallengeLevel = (levelNumber: number) => {
    setIsDailyActive(false);
    // Search across theme packs
    for (const pack of THEME_PACKS) {
      const idx = pack.levels.findIndex((l) => (l.id % 100) === levelNumber || l.id === levelNumber);
      if (idx !== -1) {
        setCurrentPackId(pack.id);
        setCurrentLevelIndex(idx);
        showToast(`已载入《${pack.name}》第 ${levelNumber} 关好友挑战！`);
        return;
      }
    }
  };

  // Select level from LevelPackModal
  const handleSelectLevelFromPack = (pack: ThemePack, level: LevelData) => {
    setIsDailyActive(false);
    setCurrentPackId(pack.id);
    const idx = pack.levels.findIndex((l) => l.id === level.id);
    setCurrentLevelIndex(idx >= 0 ? idx : 0);
    showToast(`已进入《${pack.name}》: ${level.title}`);
  };

  // Playtest level from LevelEditor
  const handlePlaytestCustomLevel = (customLevel: LevelData) => {
    setIsDailyActive(false);
    initLevel(customLevel);
    showToast(`已载入自创关卡《${customLevel.title}》，开始亲自通关自测！`);
  };

  return (
    <WeChatShell
      levelTitle={
        isDailyActive
          ? `🔥【每日挑战】${activeLevel.title}`
          : `第${activeLevel.id > 100 ? activeLevel.id % 100 : activeLevel.id}关: ${activeLevel.title}`
      }
      onResetLevel={() => initLevel(activeLevel)}
      onOpenTutorial={() => setShowHint(true)}
      onOpenDailyChallenge={() => setShowDailyChallenge(true)}
    >
      {/* 3D Voxel Viewport */}
      <VoxelCanvas
        ref={voxelCanvasRef}
        gridSize={activeLevel.gridSize}
        placedBlocks={placedBlocks}
        selectedShape={selectedShape}
        selectedColor={
          inventory.find((i) => i.type === selectedShape)?.color || '#f59e0b'
        }
        rotation={rotation}
        isDemolishMode={isDemolishMode}
        onPlaceBlock={handlePlaceBlock}
        onRemoveBlock={handleRemoveBlock}
        targetGhostVoxels={targetGhostVoxels}
        showTargetGhost={showTargetGhost}
        startPos={activeLevel.startPos}
        goalPos={activeLevel.goalPos}
        isSimulating={isSimulating}
      />

      {/* Three-View Panel Visualizer */}
      <ThreeViewPanel
        currentProjection={currentProjection}
        targetProjection={activeLevel.targetThreeView}
        matchScore={matchScore}
        isThreeViewGoal={activeLevel.winCondition === 'THREE_VIEW_MATCH'}
        onOpenReferenceBlueprint={() => setShowBlueprintModal(true)}
      />

      {/* Main HUD & Dock */}
      <GameHUD
        levelNumber={activeLevel.id}
        levelTitle={isDailyActive ? `🔥 ${activeLevel.title}` : activeLevel.title}
        themeName={isDailyActive ? '今日全服挑战' : currentPack.name}
        themeIcon={isDailyActive ? '🔥' : currentPack.icon}
        concept={activeLevel.concept}
        winCondition={activeLevel.winCondition}
        moves={moves}
        elapsedSeconds={elapsedSeconds}
        inventory={inventory}
        selectedShape={selectedShape}
        onSelectShape={(shape) => {
          setSelectedShape(shape);
          setIsDemolishMode(false);
        }}
        rotation={rotation}
        onRotateY={() => setRotation(([rx, ry, rz]) => [rx, (ry + 1) % 4, rz])}
        onRotateX={() => setRotation(([rx, ry, rz]) => [(rx + 1) % 4, ry, rz])}
        isDemolishMode={isDemolishMode}
        onToggleDemolish={() => setIsDemolishMode(!isDemolishMode)}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        onRunTest={handleRunTest}
        isSimulating={isSimulating}
        onOpenHint={() => setShowHint(true)}
        onOpenReferenceBlueprint={() => setShowBlueprintModal(true)}
        showGhost={showTargetGhost}
        onToggleGhost={() => setShowTargetGhost(!showTargetGhost)}
        onOpenDailyChallenge={() => setShowDailyChallenge(true)}
        isDailyCompleted={!!todayDailyRecord?.completed}
        isDailyActive={isDailyActive}
        onOpenShareSheet={() => setShowShareSheet(true)}
        onOpenMomentsFeed={() => setShowMomentsFeed(true)}
        onOpenWorkshop={() => setShowEditor(true)}
        onOpenLevelPacks={() => setShowLevelPacks(true)}
        onSnapCamera={(view) => voxelCanvasRef.current?.setSnapView(view)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-slate-950/90 text-amber-300 border border-slate-700/80 px-4 py-2 rounded-2xl text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in-95 pointer-events-none">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Victory Modal */}
      <VictoryModal
        isOpen={showVictory}
        levelNumber={activeLevel.id > 100 ? activeLevel.id % 100 : activeLevel.id}
        levelTitle={activeLevel.title}
        timeSeconds={elapsedSeconds}
        moves={moves}
        stars={currentStars}
        hasNextLevel={!isDailyActive && currentLevelIndex < currentPack.levels.length - 1}
        isDailyChallenge={isDailyActive}
        onOpenDailyLeaderboard={() => {
          setShowVictory(false);
          setShowDailyChallenge(true);
        }}
        onNextLevel={() => setCurrentLevelIndex((prev) => prev + 1)}
        onReplay={() => initLevel(activeLevel)}
        onOpenPoster={() => setShowPoster(true)}
        onOpenShareSheet={() => setShowShareSheet(true)}
      />

      {/* Moments Poster Generator Modal */}
      <MomentsPosterModal
        isOpen={showPoster}
        onClose={() => setShowPoster(false)}
        levelNumber={activeLevel.id > 100 ? activeLevel.id % 100 : activeLevel.id}
        levelTitle={activeLevel.title}
        timeSeconds={elapsedSeconds}
        moves={moves}
        screenshotUrl={victoryScreenshot}
        challengeCode={`BK-${activeLevel.id}-${moves}M-${Math.round(elapsedSeconds)}S`}
        userName="空间极客小木"
        onShareToFeed={handlePostToMoments}
      />

      {/* WeChat Share Action Sheet */}
      <WeChatShareActionSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        onOpenPoster={() => setShowPoster(true)}
        onPostToMoments={handlePostToMoments}
        levelTitle={activeLevel.title}
        levelNumber={activeLevel.id > 100 ? activeLevel.id % 100 : activeLevel.id}
        timeSeconds={elapsedSeconds}
      />

      {/* Moments Feed & Friends Leaderboard Modal */}
      <MomentsFeedModal
        isOpen={showMomentsFeed}
        onClose={() => setShowMomentsFeed(false)}
        posts={momentsPosts}
        onLikePost={handleLikePost}
        onCommentPost={handleCommentPost}
        onChallengeLevel={handleChallengeLevel}
        currentLevelLeaderboard={currentLeaderboard}
        currentLevelId={activeLevel.id > 100 ? activeLevel.id % 100 : activeLevel.id}
      />

      {/* Full-Featured Level Editor & Library Modal */}
      <LevelEditorModal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onPlaytestCustomLevel={handlePlaytestCustomLevel}
        currentPlacedBlocks={placedBlocks}
        screenshotUrl={victoryScreenshot}
      />

      {/* Level Pack Hall & Map Modal */}
      <LevelPackModal
        isOpen={showLevelPacks}
        onClose={() => setShowLevelPacks(false)}
        currentPackId={currentPackId}
        currentLevelId={currentLevel.id}
        userProgressMap={userProgressMap}
        onSelectLevel={handleSelectLevelFromPack}
        onOpenDailyChallenge={() => {
          setShowLevelPacks(false);
          setShowDailyChallenge(true);
        }}
      />

      {/* Daily Challenge & Global Leaderboard Modal */}
      <DailyChallengeModal
        isOpen={showDailyChallenge}
        onClose={() => setShowDailyChallenge(false)}
        dailyLevel={todayDailyLevel}
        todayRecord={todayDailyRecord}
        dailyRecords={dailyRecords}
        onStartDailyChallenge={handleStartDailyChallenge}
        onShareDailyChallenge={() => {
          setShowDailyChallenge(false);
          setShowShareSheet(true);
        }}
      />

      {/* Reference Blueprint & 3D Ghost Modal */}
      <ReferenceBlueprintModal
        isOpen={showBlueprintModal}
        onClose={() => setShowBlueprintModal(false)}
        level={activeLevel}
        showGhost={showTargetGhost}
        onToggleGhost={() => setShowTargetGhost(!showTargetGhost)}
        targetThreeView={activeLevel.targetThreeView}
      />

      {/* Hint & Spatial Tutorial Modal */}
      <HintModal
        isOpen={showHint}
        onClose={() => setShowHint(false)}
        levelNumber={activeLevel.id > 100 ? activeLevel.id % 100 : activeLevel.id}
        levelTitle={activeLevel.title}
        concept={activeLevel.concept}
        hint={activeLevel.hint}
      />
    </WeChatShell>
  );
}
