import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { BlockShape, PlacedBlock, ThreeViewProjection } from '../../types/game';
import { BLOCK_DEFINITIONS, getBlockOccupiedVoxels, rotateVoxel } from '../../utils/blockShapes';
import { sound } from '../../services/sound';

export interface VoxelCanvasHandle {
  captureScreenshot: () => string;
  runSimulation: (path: [number, number, number][], onComplete: () => void) => void;
  resetCamera: () => void;
  setSnapView: (view: 'iso' | 'top' | 'front' | 'side') => void;
}

interface VoxelCanvasProps {
  gridSize: { x: number; y: number; z: number };
  placedBlocks: PlacedBlock[];
  selectedShape: BlockShape | null;
  selectedColor: string;
  rotation: [number, number, number]; // [rx, ry, rz]
  isDemolishMode: boolean;
  onPlaceBlock: (pos: [number, number, number]) => void;
  onRemoveBlock: (id: string) => void;
  targetThreeView?: ThreeViewProjection;
  targetGhostVoxels?: [number, number, number][];
  showTargetGhost?: boolean;
  isSimulating: boolean;
  startPos?: [number, number, number];
  goalPos?: [number, number, number];
}

export const VoxelCanvas = forwardRef<VoxelCanvasHandle, VoxelCanvasProps>(({
  gridSize,
  placedBlocks,
  selectedShape,
  selectedColor,
  rotation,
  isDemolishMode,
  onPlaceBlock,
  onRemoveBlock,
  targetGhostVoxels = [],
  showTargetGhost = true,
  startPos,
  goalPos,
  isSimulating,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const blocksGroupRef = useRef<THREE.Group | null>(null);
  const ghostGroupRef = useRef<THREE.Group | null>(null);
  const targetGhostGroupRef = useRef<THREE.Group | null>(null);
  const decorGroupRef = useRef<THREE.Group | null>(null);
  const runnerMeshRef = useRef<THREE.Mesh | null>(null);

  // Orbit state
  const orbitRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    azimuth: Math.PI / 4, // 45 deg
    elevation: Math.PI / 5, // ~36 deg
    targetAzimuth: Math.PI / 4,
    targetElevation: Math.PI / 5,
    distance: 14,
    panX: 0,
    panY: 0,
  });

  const [hoverVoxel, setHoverVoxel] = useState<[number, number, number] | null>(null);

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    captureScreenshot: () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Temporarily hide ghost preview and target ghost wires for clean photo
        if (ghostGroupRef.current) ghostGroupRef.current.visible = false;
        if (targetGhostGroupRef.current) targetGhostGroupRef.current.visible = false;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
        if (ghostGroupRef.current) ghostGroupRef.current.visible = true;
        if (targetGhostGroupRef.current) targetGhostGroupRef.current.visible = true;
        return dataUrl;
      }
      return '';
    },
    runSimulation: (path: [number, number, number][], onComplete: () => void) => {
      if (!sceneRef.current || !runnerMeshRef.current || path.length === 0) return;

      const runner = runnerMeshRef.current;
      runner.visible = true;

      let stepIdx = 0;
      const totalSteps = path.length;

      const moveNextStep = () => {
        if (stepIdx >= totalSteps) {
          // Finished!
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
          });
          onComplete();
          return;
        }

        const [tx, ty, tz] = path[stepIdx];
        const targetWorld = new THREE.Vector3(
          tx - gridSize.x / 2 + 0.5,
          ty + 0.5,
          tz - gridSize.z / 2 + 0.5
        );

        sound.playStep(360 + stepIdx * 35);
        sound.triggerHaptic('light');

        // Smooth hop animation
        const startPos = runner.position.clone();
        const startTime = performance.now();
        const duration = 220; // ms

        const animateHop = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          // Arc trajectory
          const currentPos = startPos.clone().lerp(targetWorld, progress);
          const arcHeight = 0.35 * Math.sin(progress * Math.PI);
          currentPos.y += arcHeight;
          runner.position.copy(currentPos);

          // Pulse scale
          const s = 1 + 0.2 * Math.sin(progress * Math.PI);
          runner.scale.set(s, s, s);

          if (progress < 1) {
            requestAnimationFrame(animateHop);
          } else {
            stepIdx++;
            setTimeout(moveNextStep, 50);
          }
        };

        requestAnimationFrame(animateHop);
      };

      // Set initial position
      const [sx, sy, sz] = path[0];
      runner.position.set(sx - gridSize.x / 2 + 0.5, sy + 0.5, sz - gridSize.z / 2 + 0.5);
      moveNextStep();
    },
    resetCamera: () => {
      orbitRef.current.targetAzimuth = Math.PI / 4;
      orbitRef.current.targetElevation = Math.PI / 5;
    },
    setSnapView: (view: 'iso' | 'top' | 'front' | 'side') => {
      if (view === 'iso') {
        orbitRef.current.targetAzimuth = Math.PI / 4;
        orbitRef.current.targetElevation = Math.PI / 5;
      } else if (view === 'top') {
        orbitRef.current.targetAzimuth = 0;
        orbitRef.current.targetElevation = Math.PI / 2 - 0.01;
      } else if (view === 'front') {
        orbitRef.current.targetAzimuth = 0;
        orbitRef.current.targetElevation = 0.01;
      } else if (view === 'side') {
        orbitRef.current.targetAzimuth = Math.PI / 2;
        orbitRef.current.targetElevation = 0.01;
      }
    },
  }));

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // Slate-900
    sceneRef.current = scene;

    // Camera (Orthographic for crisp isometric CAD/toy feel)
    const aspect = width / height;
    const frustumSize = 10;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    dirLight.position.set(12, 20, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.camera.left = -8;
    dirLight.shadow.camera.right = 8;
    dirLight.shadow.camera.top = 8;
    dirLight.shadow.camera.bottom = -8;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    fillLight.position.set(-10, 8, -10);
    scene.add(fillLight);

    // Groups
    const blocksGroup = new THREE.Group();
    scene.add(blocksGroup);
    blocksGroupRef.current = blocksGroup;

    const ghostGroup = new THREE.Group();
    scene.add(ghostGroup);
    ghostGroupRef.current = ghostGroup;

    const decorGroup = new THREE.Group();
    scene.add(decorGroup);
    decorGroupRef.current = decorGroup;

    const targetGhostGroup = new THREE.Group();
    scene.add(targetGhostGroup);
    targetGhostGroupRef.current = targetGhostGroup;

    // Runner character (Cute golden robot/ball)
    const runnerGeo = new THREE.SphereGeometry(0.35, 24, 24);
    const runnerMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
    });
    const runnerMesh = new THREE.Mesh(runnerGeo, runnerMat);
    runnerMesh.castShadow = true;
    runnerMesh.visible = false;
    scene.add(runnerMesh);
    runnerMeshRef.current = runnerMesh;

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth camera interpolation
      const orbit = orbitRef.current;
      orbit.azimuth += (orbit.targetAzimuth - orbit.azimuth) * 0.12;
      orbit.elevation += (orbit.targetElevation - orbit.elevation) * 0.12;

      // Restrict elevation
      orbit.elevation = Math.max(0.01, Math.min(Math.PI / 2 - 0.01, orbit.elevation));

      const cx = orbit.distance * Math.cos(orbit.elevation) * Math.sin(orbit.azimuth);
      const cy = orbit.distance * Math.sin(orbit.elevation);
      const cz = orbit.distance * Math.cos(orbit.elevation) * Math.cos(orbit.azimuth);

      camera.position.set(cx + orbit.panX, cy + orbit.panY, cz);
      camera.lookAt(orbit.panX, orbit.panY + 0.5, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const asp = w / h;
      cameraRef.current.left = (-frustumSize * asp) / 2;
      cameraRef.current.right = (frustumSize * asp) / 2;
      cameraRef.current.top = frustumSize / 2;
      cameraRef.current.bottom = -frustumSize / 2;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container) container.replaceChildren();
    };
  }, []);

  // Update Grid Base & Pedestals
  useEffect(() => {
    const decor = decorGroupRef.current;
    if (!decor) return;
    decor.clear();

    const { x, z } = gridSize;

    // Wooden grid floor base
    const basePlateGeo = new THREE.BoxGeometry(x + 0.6, 0.4, z + 0.6);
    const basePlateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // slate-800
      roughness: 0.8,
      metalness: 0.1,
    });
    const basePlate = new THREE.Mesh(basePlateGeo, basePlateMat);
    basePlate.position.set(0, -0.21, 0);
    basePlate.receiveShadow = true;
    decor.add(basePlate);

    // Subtle Grid Lines
    const gridHelper = new THREE.GridHelper(Math.max(x, z), Math.max(x, z), 0x475569, 0x334155);
    gridHelper.position.set(0, 0.01, 0);
    decor.add(gridHelper);

    // Start Indicator (Cute blue ring / beacon)
    if (startPos) {
      const ringGeo = new THREE.RingGeometry(0.2, 0.45, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(
        startPos[0] - x / 2 + 0.5,
        startPos[1] + 1.02,
        startPos[2] - z / 2 + 0.5
      );
      decor.add(ring);
    }

    // Goal Indicator (Glowing golden beacon flag)
    if (goalPos) {
      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(
        goalPos[0] - x / 2 + 0.5,
        goalPos[1] + 1.6,
        goalPos[2] - z / 2 + 0.5
      );
      decor.add(pole);

      const flagGeo = new THREE.ConeGeometry(0.28, 0.5, 4);
      const flagMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.3 });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.rotation.z = Math.PI / 2;
      flag.position.set(
        goalPos[0] - x / 2 + 0.65,
        goalPos[1] + 2.0,
        goalPos[2] - z / 2 + 0.5
      );
      decor.add(flag);
    }
  }, [gridSize, startPos, goalPos]);

  // Render Placed Blocks
  useEffect(() => {
    const blocksGroup = blocksGroupRef.current;
    if (!blocksGroup) return;
    blocksGroup.clear();

    const { x: gx, z: gz } = gridSize;

    placedBlocks.forEach((block) => {
      const def = BLOCK_DEFINITIONS[block.type];
      const occupied = getBlockOccupiedVoxels(block);

      const blockColor = block.color || def?.baseColor || '#f59e0b';
      const isStaticFoundation = block.isStatic;

      occupied.forEach(([vx, vy, vz], idx) => {
        // Individual voxel cube with Lego / bevel wooden style
        let geom: THREE.BufferGeometry;

        if (def?.isRamp) {
          // Create wedge / stair ramp geometry
          geom = new THREE.ConeGeometry(0.5, 1, 4);
          geom.rotateY(Math.PI / 4);
        } else {
          geom = new THREE.BoxGeometry(0.96, 0.96, 0.96);
        }

        const mat = new THREE.MeshStandardMaterial({
          color: isStaticFoundation ? (block.isGoal ? 0xef4444 : 0x475569) : new THREE.Color(blockColor),
          roughness: isStaticFoundation ? 0.9 : 0.35,
          metalness: 0.1,
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(
          vx - gx / 2 + 0.5,
          vy + 0.5,
          vz - gz / 2 + 0.5
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { blockId: block.id, isStatic: block.isStatic, gridPos: [vx, vy, vz] };

        // Add Lego stud on top for tactile toy feel
        if (!def?.isRamp && !isStaticFoundation) {
          const studGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
          const stud = new THREE.Mesh(studGeo, mat);
          stud.position.set(0, 0.52, 0);
          mesh.add(stud);
        }

        // Add subtle edge outline
        const edges = new THREE.EdgesGeometry(geom);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: isStaticFoundation ? 0x334155 : 0x000000, linewidth: 1, transparent: true, opacity: 0.25 })
        );
        mesh.add(line);

        blocksGroup.add(mesh);
      });
    });
  }, [placedBlocks, gridSize]);

  // Render Target Holographic Reference Blueprint Voxels
  useEffect(() => {
    const group = targetGhostGroupRef.current;
    if (!group) return;
    group.clear();

    if (!showTargetGhost || !targetGhostVoxels || targetGhostVoxels.length === 0) return;

    const { x: gx, z: gz } = gridSize;

    // Set of voxels currently occupied by placed blocks
    const occupiedSet = new Set(
      placedBlocks.flatMap((b) => getBlockOccupiedVoxels(b).map(([x, y, z]) => `${x},${y},${z}`))
    );

    targetGhostVoxels.forEach(([vx, vy, vz]) => {
      const isAlreadyOccupied = occupiedSet.has(`${vx},${vy},${vz}`);

      const geom = new THREE.BoxGeometry(0.96, 0.96, 0.96);
      const mat = new THREE.MeshBasicMaterial({
        color: isAlreadyOccupied ? 0x10b981 : 0x0284c7,
        transparent: true,
        opacity: isAlreadyOccupied ? 0.12 : 0.28,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        vx - gx / 2 + 0.5,
        vy + 0.5,
        vz - gz / 2 + 0.5
      );

      // Glowing blueprint wireframe edges
      const edges = new THREE.EdgesGeometry(geom);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: isAlreadyOccupied ? 0x34d399 : 0x38bdf8,
          transparent: true,
          opacity: isAlreadyOccupied ? 0.35 : 0.8,
        })
      );
      mesh.add(line);

      group.add(mesh);
    });
  }, [targetGhostVoxels, showTargetGhost, gridSize, placedBlocks]);

  // Update Ghost Preview
  useEffect(() => {
    const ghostGroup = ghostGroupRef.current;
    if (!ghostGroup) return;
    ghostGroup.clear();

    if (!selectedShape || !hoverVoxel || isDemolishMode || isSimulating) return;

    const def = BLOCK_DEFINITIONS[selectedShape];
    if (!def) return;

    const { x: gx, z: gz } = gridSize;
    const ghostBlock: PlacedBlock = {
      id: 'ghost',
      type: selectedShape,
      position: hoverVoxel,
      rotation: rotation,
      color: selectedColor,
    };

    const occupied = getBlockOccupiedVoxels(ghostBlock);

    // Check bounds
    const isOutOfBounds = occupied.some(
      ([vx, vy, vz]) => vx < 0 || vx >= gridSize.x || vy < 0 || vy >= gridSize.y || vz < 0 || vz >= gridSize.z
    );

    // Check collisions
    const placedSet = new Set(
      placedBlocks.flatMap((b) => getBlockOccupiedVoxels(b).map(([x, y, z]) => `${x},${y},${z}`))
    );
    const hasCollision = occupied.some(([x, y, z]) => placedSet.has(`${x},${y},${z}`));

    const isValid = !isOutOfBounds && !hasCollision;
    const previewColor = isValid ? new THREE.Color(selectedColor) : new THREE.Color('#ef4444');

    occupied.forEach(([vx, vy, vz]) => {
      const geom = new THREE.BoxGeometry(0.98, 0.98, 0.98);
      const mat = new THREE.MeshBasicMaterial({
        color: previewColor,
        transparent: true,
        opacity: isValid ? 0.55 : 0.35,
        wireframe: false,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        vx - gx / 2 + 0.5,
        vy + 0.5,
        vz - gz / 2 + 0.5
      );

      // Wireframe overlay
      const edges = new THREE.EdgesGeometry(geom);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: isValid ? 0xffffff : 0xff0000, linewidth: 2 })
      );
      mesh.add(line);

      ghostGroup.add(mesh);
    });
  }, [hoverVoxel, selectedShape, rotation, selectedColor, isDemolishMode, isSimulating, placedBlocks, gridSize]);

  // Raycasting for Voxel coordinate detection
  const getRaycastGridPos = useCallback((e: React.MouseEvent | React.TouchEvent): {
    voxel: [number, number, number] | null;
    clickedBlockId?: string;
  } => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) {
      return { voxel: null };
    }

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY) : e.clientY;

    if (clientX === undefined || clientY === undefined) return { voxel: null };

    const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    // Intersect blocks
    const blockIntersects = blocksGroupRef.current
      ? raycaster.intersectObjects(blocksGroupRef.current.children, false)
      : [];

    if (blockIntersects.length > 0) {
      const hit = blockIntersects[0];
      const clickedBlockId = hit.object.userData?.blockId;

      if (isDemolishMode) {
        return { voxel: null, clickedBlockId };
      }

      // If placing, find face normal to stack on top/side
      const normal = hit.face?.normal || new THREE.Vector3(0, 1, 0);
      const gridPos = hit.object.userData?.gridPos as [number, number, number];
      if (gridPos) {
        const nextVoxel: [number, number, number] = [
          gridPos[0] + Math.round(normal.x),
          gridPos[1] + Math.round(normal.y),
          gridPos[2] + Math.round(normal.z),
        ];
        return { voxel: nextVoxel, clickedBlockId };
      }
    }

    // Intersect ground plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    const hitGround = raycaster.ray.intersectPlane(plane, target);

    if (hitGround) {
      const gx = Math.floor(target.x + gridSize.x / 2);
      const gz = Math.floor(target.z + gridSize.z / 2);
      if (gx >= 0 && gx < gridSize.x && gz >= 0 && gz < gridSize.z) {
        return { voxel: [gx, 0, gz] };
      }
    }

    return { voxel: null };
  }, [gridSize, isDemolishMode]);

  // Pointer event handlers for orbit drag vs click
  const pointerDownPos = useRef({ x: 0, y: 0, time: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    orbitRef.current.isDragging = true;
    orbitRef.current.prevX = e.clientX;
    orbitRef.current.prevY = e.clientY;
    pointerDownPos.current = { x: e.clientX, y: e.clientY, time: performance.now() };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (orbitRef.current.isDragging) {
      const dx = e.clientX - orbitRef.current.prevX;
      const dy = e.clientY - orbitRef.current.prevY;
      orbitRef.current.prevX = e.clientX;
      orbitRef.current.prevY = e.clientY;

      orbitRef.current.targetAzimuth -= dx * 0.008;
      orbitRef.current.targetElevation += dy * 0.008;
    } else {
      // Hover detection
      const { voxel } = getRaycastGridPos(e);
      setHoverVoxel(voxel);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    orbitRef.current.isDragging = false;

    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    const duration = performance.now() - pointerDownPos.current.time;

    // If movement < 6px and duration < 350ms, treat as pure click/tap!
    if (dx < 6 && dy < 6 && duration < 350) {
      const { voxel, clickedBlockId } = getRaycastGridPos(e);

      if (isDemolishMode) {
        if (clickedBlockId) {
          onRemoveBlock(clickedBlockId);
        }
      } else if (voxel) {
        onPlaceBlock(voxel);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        orbitRef.current.isDragging = false;
        setHoverVoxel(null);
      }}
      className="w-full h-full relative cursor-grab active:cursor-grabbing touch-none select-none"
    />
  );
});

VoxelCanvas.displayName = 'VoxelCanvas';
