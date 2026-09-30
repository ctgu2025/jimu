export type BlockShape = 
  | 'cube_1x1'      // 1x1x1
  | 'domino_2x1'    // 2x1x1
  | 'plank_3x1'     // 3x1x1
  | 'pillar_1x2'    // 1x1x2
  | 'stair_step'    // 1x1x1 斜坡阶梯
  | 'corner_L'      // 2x2 L型转角
  | 'bridge_arch'   // 3x1 跨度拱桥
  | 't_shape';      // T型积木

export interface BlockDefinition {
  type: BlockShape;
  name: string;
  description: string;
  baseColor: string;
  // Relative offsets at default rotation [0, 0, 0]
  voxels: [number, number, number][];
  isRamp?: boolean;
}

export interface PlacedBlock {
  id: string;
  type: BlockShape;
  position: [number, number, number]; // [x, y, z] grid coordinates
  rotation: [number, number, number]; // [rotX, rotY, rotZ] in steps of 90 degrees (0, 1, 2, 3)
  color: string;
  isStatic?: boolean; // Preset level element like base foundation or obstacle
  isStart?: boolean;
  isGoal?: boolean;
}

export interface ThreeViewProjection {
  top: boolean[][];   // Grid [z][x]
  front: boolean[][]; // Grid [y][x]
  side: boolean[][];  // Grid [y][z]
}

export type PuzzleWinCondition = 
  | 'PATH_CONNECT'       // 小人/金球能从起点走到终点
  | 'THREE_VIEW_MATCH'   // 积木外形完全满足三视图投影
  | 'RECONSTRUCT_GHOST'; // 积木完全填满空间虚影

export interface FriendRankItem {
  id: string;
  name: string;
  avatar: string;
  timeSeconds: number;
  moves: number;
  date: string;
  isSelf?: boolean;
}

export interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  theme: string;
  concept: string; // e.g., "重力跨度与三维桥梁", "错觉台阶与空间高低差"
  gridSize: { x: number; y: number; z: number };
  winCondition: PuzzleWinCondition;
  startPos?: [number, number, number];
  goalPos?: [number, number, number];
  presetBlocks: PlacedBlock[];
  allowedInventory: { type: BlockShape; count: number; color: string }[];
  targetThreeView?: ThreeViewProjection;
  targetGhostVoxels?: [number, number, number][];
  referenceImageDescription?: string;
  hint: string;
  targetMoves: number;
  targetSeconds: number;
  initialLeaderboard: FriendRankItem[];
}

export interface UserLevelProgress {
  levelId: number;
  stars: number; // 1-3
  bestTime: number;
  bestMoves: number;
  completed: boolean;
}

export interface ThemePack {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  features: string[];
  themeColor: string;
  bgGradient: string;
  ambientLightColor: number;
  levels: LevelData[];
}

export interface SavedCustomLevel {
  id: string;
  title: string;
  author: string;
  theme: string;
  createdAt: string;
  updatedAt: string;
  gridSize: { x: number; y: number; z: number };
  startPos: [number, number, number];
  goalPos: [number, number, number];
  presetBlocks: PlacedBlock[];
  allowedInventory: { type: BlockShape; count: number; color: string }[];
  winCondition: PuzzleWinCondition;
  verified: boolean;
  bestMoves?: number;
  bestSeconds?: number;
  thumbnailDataUrl?: string;
  shareCode: string;
}

export interface DailyChallengeRecord {
  date: string; // YYYY-MM-DD
  completed: boolean;
  timeSeconds: number;
  moves: number;
  rank?: number;
  stars: number;
}

export interface DailyGlobalLeaderboardItem {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  city: string;
  timeSeconds: number;
  moves: number;
  date: string;
  isSelf?: boolean;
}

export interface CustomLevelSharePayload {
  version: number;
  title: string;
  author: string;
  gridSize: { x: number; y: number; z: number };
  startPos?: [number, number, number];
  goalPos?: [number, number, number];
  presetBlocks: PlacedBlock[];
  inventory: { type: BlockShape; count: number; color: string }[];
  winCondition: PuzzleWinCondition;
  code: string;
}

export interface WeChatMomentsPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  levelTitle: string;
  levelNumber: number;
  timeSeconds: number;
  moves: number;
  caption: string;
  likes: string[];
  comments: { user: string; text: string }[];
  snapshotUrl?: string;
  challengeCode?: string;
}
