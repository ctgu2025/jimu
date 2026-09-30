import { LevelData, PlacedBlock, DailyChallengeRecord, DailyGlobalLeaderboardItem, BlockShape } from '../types/game';

/**
 * Returns today's date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Simple 32-bit string hash for deterministic daily seed
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Seeded pseudo-random number generator (Mulberry32)
 */
function createPRNG(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a deterministic daily challenge level based on the date
 */
export function generateDailyLevel(dateStr: string = getTodayDateString()): LevelData {
  const seed = hashString(`blockcraft-daily-${dateStr}`);
  const rand = createPRNG(seed);

  // Pick theme based on day seed
  const themes = [
    { name: '极光浮岛', concept: '浮空岛礁与极光天阶', startCol: '#475569', goalCol: '#38bdf8', obsCol: '#1e293b' },
    { name: '深渊回廊', concept: '高低断崖与悬挑长梁', startCol: '#334155', goalCol: '#10b981', obsCol: '#0f172a' },
    { name: '机械天阶', concept: '直角折返与榫卯连廊', startCol: '#78350f', goalCol: '#f59e0b', obsCol: '#1c1917' },
    { name: '星门引力', concept: '微重力跨度与光路走廊', startCol: '#312e81', goalCol: '#ec4899', obsCol: '#090d16' },
  ];
  const themeIndex = Math.floor(rand() * themes.length);
  const themeObj = themes[themeIndex];

  // Grid size: fixed 5x4x5 for consistent, balanced mobile layout
  const gridSize = { x: 5, y: 4, z: 5 };

  // Determine Start and Goal positions:
  // Start is at X=0, Y=0, Z between 0 and 2
  const startZ = Math.floor(rand() * 3);
  const startPos: [number, number, number] = [0, 0, startZ];

  // Goal is on the far diagonal at X=4, Y between 2 and 3, Z between 2 and 4
  const goalY = 2 + Math.floor(rand() * 2); // 2 or 3 height
  const goalZ = 2 + Math.floor(rand() * 3);
  const goalPos: [number, number, number] = [4, goalY, goalZ];

  // Presets: Start Pedestal & Goal Spire
  const presetBlocks: PlacedBlock[] = [
    {
      id: 'daily-start-base',
      type: 'cube_1x1',
      position: startPos,
      rotation: [0, 0, 0],
      color: themeObj.startCol,
      isStatic: true,
      isStart: true,
    },
    {
      id: 'daily-goal-spire',
      type: goalY >= 2 ? 'pillar_1x2' : 'cube_1x1',
      position: [goalPos[0], 0, goalPos[2]],
      rotation: [0, 0, 0],
      color: themeObj.goalCol,
      isStatic: true,
      isGoal: true,
    },
  ];

  // If goal height is 3, stack another pillar
  if (goalY === 3) {
    presetBlocks.push({
      id: 'daily-goal-spire-top',
      type: 'cube_1x1',
      position: [goalPos[0], 2, goalPos[2]],
      rotation: [0, 0, 0],
      color: themeObj.goalCol,
      isStatic: true,
      isGoal: true,
    });
  }

  // Add 1 or 2 strategic intermediate obstacle pillars/stepping stones
  const midX = 2;
  const midZ = Math.floor(rand() * 4);
  presetBlocks.push({
    id: 'daily-mid-stepping-stone',
    type: 'cube_1x1',
    position: [midX, 1, midZ],
    rotation: [0, 0, 0],
    color: '#475569',
    isStatic: true,
  });

  // Allowed inventory: crafted to be versatile and definitely solvable
  const allowedInventory: { type: BlockShape; count: number; color: string }[] = [
    { type: 'stair_step', count: 3, color: '#8b5cf6' },
    { type: 'plank_3x1', count: 1, color: '#10b981' },
    { type: 'domino_2x1', count: 2, color: '#3b82f6' },
    { type: 'corner_L', count: 1, color: '#06b6d4' },
    { type: 'bridge_arch', count: 1, color: '#f97316' },
    { type: 'cube_1x1', count: 2, color: '#f59e0b' },
  ];

  const dateSub = dateStr.replace(/-/g, '.');

  return {
    id: 9999, // Special ID for daily challenge
    title: `今日限定：${themeObj.name}`,
    subtitle: `${dateSub} 全球每日空间挑战`,
    theme: themeObj.name,
    concept: themeObj.concept,
    gridSize,
    winCondition: 'PATH_CONNECT',
    startPos,
    goalPos,
    presetBlocks,
    allowedInventory,
    hint: `【${dateStr} 每日空间推演】：起点光标位于 [${startPos.join(',')}]，终点高台位于 [${goalPos.join(',')}](高度 y=${goalY})。充分利用中央平台作为中继跳板，搭建斜坡阶梯与跨度拱桥连通！`,
    targetMoves: 5,
    targetSeconds: 28,
    initialLeaderboard: [],
    referenceImageDescription: `【${dateStr} 每日挑战官方题卡】：今日全服玩家均面对此完全一致的随机空间布局。考验高差攀爬、跨越空洞与中继基座连接能力。`,
  };
}

/**
 * Deterministically generates today's global leaderboard of top speedrunners
 */
export function generateDailyGlobalLeaderboard(
  dateStr: string = getTodayDateString(),
  userRecord?: DailyChallengeRecord
): DailyGlobalLeaderboardItem[] {
  const seed = hashString(`leaderboard-${dateStr}`);
  const rand = createPRNG(seed);

  // Global contender templates
  const contenders = [
    { name: '林小鹿·冲榜王', avatar: '🦌', city: '上海' },
    { name: '张浩然 空间筑造', avatar: '📐', city: '北京' },
    { name: 'Vivian周 结构师', avatar: '✨', city: '深圳' },
    { name: '喵星工程师Chen', avatar: '🐱', city: '杭州' },
    { name: '鲁班榫卯第十三代', avatar: '🔨', city: '成都' },
    { name: 'Nova_Architect', avatar: '🛸', city: '东京' },
    { name: 'SkyBuilder_Leo', avatar: '🚀', city: '广州' },
    { name: '清华建筑学长', avatar: '🏛️', city: '北京' },
    { name: '几何极客Ada', avatar: '🧠', city: '新加坡' },
    { name: '方块哲学家K', avatar: '🧩', city: '香港' },
    { name: '晨曦漫步者', avatar: '🌅', city: '武汉' },
    { name: '深空领航员', avatar: '👨‍🚀', city: '南京' },
  ];

  // Generate top scores
  let baseTime = 9.4 + (rand() * 2.5); // Top speed around 9.4s - 11.9s

  const items: DailyGlobalLeaderboardItem[] = contenders.map((c, idx) => {
    baseTime += 1.2 + rand() * 1.8;
    const moves = idx < 3 ? 3 + Math.floor(rand() * 2) : 4 + Math.floor(rand() * 2);
    const minutesAgo = Math.floor(10 + idx * 25 + rand() * 20);

    return {
      id: `contender-${idx}`,
      rank: idx + 1,
      name: c.name,
      avatar: c.avatar,
      city: c.city,
      timeSeconds: parseFloat(baseTime.toFixed(1)),
      moves,
      date: `${minutesAgo}分钟前`,
    };
  });

  // If user completed today, insert and re-rank
  if (userRecord && userRecord.completed) {
    const userItem: DailyGlobalLeaderboardItem = {
      id: 'self-daily',
      rank: 1,
      name: '我 (空间极客)',
      avatar: '🧑‍🚀',
      city: '本地',
      timeSeconds: parseFloat(userRecord.timeSeconds.toFixed(1)),
      moves: userRecord.moves,
      date: '今日已完成',
      isSelf: true,
    };

    const combined = [...items, userItem].sort((a, b) => {
      if (a.timeSeconds !== b.timeSeconds) return a.timeSeconds - b.timeSeconds;
      return a.moves - b.moves;
    });

    // Reassign ranks
    return combined.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }

  return items;
}

/**
 * Computes consecutive days streak
 */
export function getDailyStreak(records: Record<string, DailyChallengeRecord>): number {
  let streak = 0;
  const now = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;

    if (records[key] && records[key].completed) {
      streak++;
    } else if (i === 0) {
      // If not yet played today, still check if played yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Formats time countdown until midnight reset (HH:mm:ss)
 */
export function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight.getTime() - now.getTime();
  if (diffMs <= 0) return '00:00:00';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
