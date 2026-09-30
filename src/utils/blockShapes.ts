import { BlockDefinition, BlockShape, PlacedBlock, ThreeViewProjection } from '../types/game';

export const BLOCK_DEFINITIONS: Record<BlockShape, BlockDefinition> = {
  cube_1x1: {
    type: 'cube_1x1',
    name: '标准方块',
    description: '基础1×1×1立方体积木，最通用的空间支撑单元',
    baseColor: '#f59e0b', // Amber wood
    voxels: [[0, 0, 0]],
  },
  domino_2x1: {
    type: 'domino_2x1',
    name: '双连积木',
    description: '2×1×1条形积木，用于搭建悬臂和跨度延伸',
    baseColor: '#3b82f6', // Bright Blue
    voxels: [[0, 0, 0], [1, 0, 0]],
  },
  plank_3x1: {
    type: 'plank_3x1',
    name: '三连木梁',
    description: '3×1×1长条木梁，用于横跨大间隙高空走廊',
    baseColor: '#10b981', // Emerald
    voxels: [[0, 0, 0], [1, 0, 0], [2, 0, 0]],
  },
  pillar_1x2: {
    type: 'pillar_1x2',
    name: '立式高柱',
    description: '1×2×1垂直立柱，提供高度跃升与下层稳固支撑',
    baseColor: '#ec4899', // Pink
    voxels: [[0, 0, 0], [0, 1, 0]],
  },
  stair_step: {
    type: 'stair_step',
    name: '爬坡阶梯',
    description: '斜坡引导块，允许小木偶平滑攀爬1格垂直落差',
    baseColor: '#8b5cf6', // Purple
    voxels: [[0, 0, 0]],
    isRamp: true,
  },
  corner_L: {
    type: 'corner_L',
    name: 'L型折角',
    description: '空间折角积木，解决90度转角与多向延展',
    baseColor: '#06b6d4', // Cyan
    voxels: [[0, 0, 0], [1, 0, 0], [0, 0, 1]],
  },
  bridge_arch: {
    type: 'bridge_arch',
    name: '跨度拱门',
    description: '下凹上凸的拱券构造，底部可穿行，顶部为通路',
    baseColor: '#f97316', // Orange
    voxels: [[0, 0, 0], [1, 1, 0], [2, 0, 0]],
  },
  t_shape: {
    type: 't_shape',
    name: 'T型榫卯',
    description: '双向延伸支撑积木，用于复杂三维交错节点',
    baseColor: '#14b8a6', // Teal
    voxels: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1]],
  },
};

/**
 * Rotate a voxel coordinate around (0,0,0) by 90-degree steps:
 * rotX, rotY, rotZ are integers (0, 1, 2, 3) representing (0, 90, 180, 270)
 */
export function rotateVoxel(
  v: [number, number, number],
  rx: number,
  ry: number,
  rz: number
): [number, number, number] {
  let [x, y, z] = v;

  // Rotate around X (pitch)
  for (let i = 0; i < ((rx % 4) + 4) % 4; i++) {
    const ny = -z;
    const nz = y;
    y = ny;
    z = nz;
  }

  // Rotate around Y (yaw)
  for (let i = 0; i < ((ry % 4) + 4) % 4; i++) {
    const nx = z;
    const nz = -x;
    x = nx;
    z = nz;
  }

  // Rotate around Z (roll)
  for (let i = 0; i < ((rz % 4) + 4) % 4; i++) {
    const nx = -y;
    const ny = x;
    x = nx;
    y = ny;
  }

  return [Math.round(x), Math.round(y), Math.round(z)];
}

/**
 * Returns all world voxel coordinates occupied by a placed block
 */
export function getBlockOccupiedVoxels(block: PlacedBlock): [number, number, number][] {
  const def = BLOCK_DEFINITIONS[block.type];
  if (!def) return [block.position];

  return def.voxels.map((v) => {
    const rotV = rotateVoxel(v, block.rotation[0], block.rotation[1], block.rotation[2]);
    return [
      block.position[0] + rotV[0],
      block.position[1] + rotV[1],
      block.position[2] + rotV[2],
    ] as [number, number, number];
  });
}

/**
 * Calculate 2D projections (Top, Front, Side) of all occupied voxels
 */
export function computeThreeView(
  blocks: PlacedBlock[],
  gridSize: { x: number; y: number; z: number }
): ThreeViewProjection {
  // Top view: [z][x]
  const top: boolean[][] = Array.from({ length: gridSize.z }, () =>
    Array(gridSize.x).fill(false)
  );
  // Front view: [y][x]
  const front: boolean[][] = Array.from({ length: gridSize.y }, () =>
    Array(gridSize.x).fill(false)
  );
  // Side view (from left): [y][z]
  const side: boolean[][] = Array.from({ length: gridSize.y }, () =>
    Array(gridSize.z).fill(false)
  );

  for (const block of blocks) {
    const voxels = getBlockOccupiedVoxels(block);
    for (const [vx, vy, vz] of voxels) {
      if (
        vx >= 0 && vx < gridSize.x &&
        vy >= 0 && vy < gridSize.y &&
        vz >= 0 && vz < gridSize.z
      ) {
        top[vz][vx] = true;
        front[vy][vx] = true;
        side[vy][vz] = true;
      }
    }
  }

  return { top, front, side };
}

/**
 * Compare two three-view projections and return match percentage [0 - 100] and isMatch boolean
 */
export function compareThreeView(
  current: ThreeViewProjection,
  target: ThreeViewProjection,
  gridSize: { x: number; y: number; z: number }
): { matchPercentage: number; isMatch: boolean; details: { top: number; front: number; side: number } } {
  let totalCells = 0;
  let matchedCells = 0;

  let topTotal = 0, topMatched = 0;
  for (let z = 0; z < gridSize.z; z++) {
    for (let x = 0; x < gridSize.x; x++) {
      topTotal++;
      if (current.top[z]?.[x] === target.top[z]?.[x]) {
        topMatched++;
      }
    }
  }

  let frontTotal = 0, frontMatched = 0;
  for (let y = 0; y < gridSize.y; y++) {
    for (let x = 0; x < gridSize.x; x++) {
      frontTotal++;
      if (current.front[y]?.[x] === target.front[y]?.[x]) {
        frontMatched++;
      }
    }
  }

  let sideTotal = 0, sideMatched = 0;
  for (let y = 0; y < gridSize.y; y++) {
    for (let z = 0; z < gridSize.z; z++) {
      sideTotal++;
      if (current.side[y]?.[z] === target.side[y]?.[z]) {
        sideMatched++;
      }
    }
  }

  totalCells = topTotal + frontTotal + sideTotal;
  matchedCells = topMatched + frontMatched + sideMatched;

  const matchPercentage = Math.round((matchedCells / totalCells) * 100);
  const isMatch = matchedCells === totalCells;

  return {
    matchPercentage,
    isMatch,
    details: {
      top: Math.round((topMatched / topTotal) * 100),
      front: Math.round((frontMatched / frontTotal) * 100),
      side: Math.round((sideMatched / sideTotal) * 100),
    },
  };
}

/**
 * Simple 3D Breadth-First Pathfinding from start to goal
 * Walking is allowed on top surfaces of voxels:
 * A walkable node is (x, y, z) where (x, y, z) is empty and (x, y-1, z) is a solid voxel (or y=0 ground if allowed),
 * or stairs allow climbing between y and y+1.
 */
export function findPath(
  blocks: PlacedBlock[],
  gridSize: { x: number; y: number; z: number },
  start: [number, number, number],
  goal: [number, number, number]
): [number, number, number][] | null {
  // Build 3D solid lookup set
  const solidSet = new Set<string>();
  const rampSet = new Set<string>();

  for (const b of blocks) {
    const voxels = getBlockOccupiedVoxels(b);
    for (const v of voxels) {
      const key = `${v[0]},${v[1]},${v[2]}`;
      solidSet.add(key);
      if (b.type === 'stair_step') {
        rampSet.add(key);
      }
    }
  }

  // Helper: Is voxel solid
  const isSolid = (x: number, y: number, z: number) => solidSet.has(`${x},${y},${z}`);

  // Determine walkable positions: A position (x, y, z) is standing on top of (x, y-1, z)
  // Or at ground level y=0 if solid or ground supported
  const queue: { pos: [number, number, number]; path: [number, number, number][] }[] = [
    { pos: start, path: [start] },
  ];

  const visited = new Set<string>();
  visited.add(`${start[0]},${start[1]},${start[2]}`);

  // Directions in horizontal plane
  const dirs = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const [cx, cy, cz] = current.pos;

    // Check if reached goal
    if (cx === goal[0] && cy === goal[1] && cz === goal[2]) {
      return current.path;
    }

    for (const [dx, _, dz] of dirs) {
      const nx = cx + dx;
      const nz = cz + dz;

      if (nx < 0 || nx >= gridSize.x || nz < 0 || nz >= gridSize.z) continue;

      // Check elevation options:
      // Option 1: Flat step (same height cy)
      // Needs: cell (nx, cy, nz) is NOT solid, but cell (nx, cy - 1, nz) IS solid (or ground level cy === 0)
      const heightsToTry = [cy, cy + 1, cy - 1];

      for (const ny of heightsToTry) {
        if (ny < 0 || ny >= gridSize.y) continue;

        const cellFree = !isSolid(nx, ny, nz);
        const supported = ny === 0 || isSolid(nx, ny - 1, nz);

        // Climb up check: if climbing up +1, either current cell is ramp or target has ramp or regular step
        if (cellFree && supported) {
          const key = `${nx},${ny},${nz}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({
              pos: [nx, ny, nz],
              path: [...current.path, [nx, ny, nz]],
            });
          }
        }
      }
    }
  }

  return null;
}
