import { LevelData, ThreeViewProjection } from '../types/game';

/**
 * Calculates or retrieves the 3D target reference ghost voxels for a level.
 * Guarantees every level has an exact 3D reference holographic blueprint.
 */
export function getTargetGhostVoxels(level: LevelData): [number, number, number][] {
  // 1. If explicitly defined in level data, use it
  if (level.targetGhostVoxels && level.targetGhostVoxels.length > 0) {
    return level.targetGhostVoxels;
  }

  // 2. If it's a Three-View projection puzzle, synthesize voxels that satisfy the 3-view blueprint
  if (level.winCondition === 'THREE_VIEW_MATCH' && level.targetThreeView) {
    const voxels: [number, number, number][] = [];
    const { top, front, side } = level.targetThreeView;
    const { x: gx, y: gy, z: gz } = level.gridSize;

    // Scan all candidate positions in the grid
    for (let y = 0; y < gy; y++) {
      for (let z = 0; z < gz; z++) {
        for (let x = 0; x < gx; x++) {
          // A voxel can exist only if its projections in all three views are true
          if (top[z]?.[x] && front[y]?.[x] && side[y]?.[z]) {
            voxels.push([x, y, z]);
          }
        }
      }
    }

    if (voxels.length > 0) {
      return voxels;
    }
  }

  // 3. For Path-Connect levels: calculate the ideal stepping pathway between start and goal
  if (level.startPos && level.goalPos) {
    const [sx, sy, sz] = level.startPos;
    const [gx, gy, gz] = level.goalPos;
    const pathVoxels: [number, number, number][] = [];

    // Simple Manhattan stepping trajectory
    let cx = sx;
    let cy = sy;
    let cz = sz;

    while (cx !== gx || cy !== gy || cz !== gz) {
      // Step in X
      if (cx < gx) cx++;
      else if (cx > gx) cx--;
      // Step in Z
      else if (cz < gz) cz++;
      else if (cz > gz) cz--;
      // Step in Y (Elevation rise)
      else if (cy < gy) cy++;
      else if (cy > gy) cy--;

      // Don't duplicate start and goal pedestals
      if ((cx !== sx || cy !== sy || cz !== sz) && (cx !== gx || cy !== gy || cz !== gz)) {
        pathVoxels.push([cx, cy, cz]);
      }
    }

    return pathVoxels;
  }

  return [];
}

/**
 * Returns structural architecture tips for the reference blueprint
 */
export function getReferenceDescription(level: LevelData): string {
  if (level.referenceImageDescription) {
    return level.referenceImageDescription;
  }

  if (level.winCondition === 'THREE_VIEW_MATCH') {
    return '【三视图全息造型蓝图】：观察右上方主视、俯视、侧视三面正交投影。实体必须在三维空间中严丝合缝地填补所有投影交叉点，形成无死角的正交光影轮廓。';
  }

  if (level.winCondition === 'PATH_CONNECT') {
    return `【通路搭建参考蓝图】：起点光圈位于 [${level.startPos?.join(', ')}]，终点奖杯位于 [${level.goalPos?.join(', ')}]。参考虚影已在3D舞台标明理想受力与架桥走廊，注意高差不得超过1格。`;
  }

  return '【空间参考效果图】：按照全息虚影提示的高程和走向，依序摆放积木块完成结构闭合。';
}
