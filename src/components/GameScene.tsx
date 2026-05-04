/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore, globalGameState } from '../store/gameStore';
import { WORLD_SIZE, TURN_SPEED, BOOST_SPEED, BASE_SPEED } from '../shared/types';
import * as THREE from 'three';
import { Sphere, Grid, Text, Billboard, Trail, Float } from '@react-three/drei';

const localCollectedOrbs = new Set<string>();

function Crown() {
  return (
    <group position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`crown-spike-${i}`}
          position={[
            Math.cos((i / 5) * Math.PI * 2) * 0.4,
            0.2,
            Math.sin((i / 5) * Math.PI * 2) * 0.4
          ]}
          rotation={[0, -(i / 5) * Math.PI * 2, 0.4]}
        >
          <coneGeometry args={[0.1, 0.4, 8]} />
          <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function USAHat() {
  return (
    <group position={[0, 0.6, 0]}>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 16]} />
        <meshStandardMaterial color="#3C3B6E" />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.5, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.41, 0.41, 0.1, 16]} />
        <meshStandardMaterial color="#B22234" />
      </mesh>
    </group>
  );
}

function SoccerBall() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.91, 16, 16]} />
        <meshStandardMaterial color="white" roughness={0.1} wireframe />
      </mesh>
    </group>
  );
}

function SkullHat() {
  return (
    <group position={[0, 0.6, 0]}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.2, 0.1, 0.35]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#000000" emissive="#FF0000" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.2, 0.1, 0.35]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#000000" emissive="#FF0000" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function VikingHelmet() {
  return (
    <group position={[0, 0.65, 0]}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.4, 0.2, 0]} rotation={[0, 0, -0.6]}>
        <coneGeometry args={[0.1, 0.5, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.4, 0.2, 0]} rotation={[0, 0, 0.6]}>
        <coneGeometry args={[0.1, 0.5, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
}

function RedCap() {
  return (
    <group position={[0, 0.6, 0]}>
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
        <meshStandardMaterial color="#FF0000" />
      </mesh>
      <mesh position={[0, -0.15, 0.4]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.35]} />
        <meshStandardMaterial color="#FF0000" />
      </mesh>
    </group>
  );
}

function RealSnakeHead() {
  return (
    <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
      {/* Head Boxier shape for snout */}
      <mesh position={[0, 0.3, 0.2]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.6]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.5} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.25, 0.5, 0.3]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#000000" emissive="#ccff00" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.25, 0.5, 0.3]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#000000" emissive="#ccff00" emissiveIntensity={2} />
      </mesh>
      {/* Nostrils */}
      <mesh position={[0.1, 0.45, 0.5]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.1, 0.45, 0.5]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Tongue */}
      <Float speed={8} rotationIntensity={0.5} floatIntensity={0.8}>
        <group position={[0, 0.5, 0.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.08, 0.6, 0.02]} />
            <meshStandardMaterial color="#ff4d4d" />
          </mesh>
          <mesh position={[0.05, 0, 0.3]} rotation={[Math.PI / 2, 0, 0.5]}>
            <boxGeometry args={[0.08, 0.3, 0.02]} />
            <meshStandardMaterial color="#ff4d4d" />
          </mesh>
          <mesh position={[-0.05, 0, 0.3]} rotation={[Math.PI / 2, 0, -0.5]}>
            <boxGeometry args={[0.08, 0.3, 0.02]} />
            <meshStandardMaterial color="#ff4d4d" />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

function AdminAccessory() {
  return (
    <group position={[0, 0.4, 0]}>
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.6, 0.05, 16, 32]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={5} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <octahedronGeometry args={[0.3]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={5} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Snake({ playerId, color, skinId, isLocal, localSegments }: { playerId: string, color: string, skinId?: string, isLocal: boolean, localSegments?: {x: number, y: number}[] }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentPositions = useRef<{x: number, y: number}[]>([]);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) return;
    const gs = globalGameState.current;
    if (!gs) return;
    
    // For local player, if we have localSegments, we use those for prediction
    // Otherwise we fall back to gs.players which is the server state
    const player = gs.players[playerId];
    const segments = isLocal && localSegments ? localSegments : player?.segments;

    if (!player || !segments || segments.length === 0) {
      bodyRef.current.visible = false;
      headRef.current.visible = false;
      return;
    }
    
    bodyRef.current.visible = true;
    headRef.current.visible = true;

    const count = segments.length;
    bodyRef.current.count = Math.max(0, count - 1);
    
    // Initialize or grow positions array
    while (currentPositions.current.length < count) {
      const idx = currentPositions.current.length;
      const startPos = segments[idx] || segments[0] || { x: 0, y: 0 };
      currentPositions.current.push({ x: startPos.x, y: startPos.y });
    }

    const isKurdistan = skinId === 'kurdistan';
    const isRealMadrid = skinId === 'realmadrid';
    const isUSA = skinId === 'usa';
    const isRealSnake = skinId === 'real-snake' || skinId === 'snake-head';
    const isAdmin = skinId === 'admin-neon';
    
    // Look up custom skin if not a base skin
    const customSkins = useGameStore.getState().customSkins;
    const customSkin = customSkins.find(s => s.id === skinId);
    const skinColor = customSkin?.type === 'color' ? customSkin.value : color;

    for (let i = 0; i < count; i++) {
      const target = segments[i];
      if (!target) continue;

      const curr = currentPositions.current[i];
      if (!curr) continue;

      if (isLocal) {
        // High-frequency prediction for local player
        curr.x = target.x;
        curr.y = target.y;
      } else {
        // Lag compensation for remote players
        const dx = target.x - curr.x;
        const dy = target.y - curr.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq > 225) { // 15^2
          curr.x = target.x;
          curr.y = target.y;
        } else {
          const lerpFactor = Math.min(1, 15 * delta);
          curr.x += dx * lerpFactor;
          curr.y += dy * lerpFactor;
        }
      }
      
      if (i === 0) {
        headRef.current.position.set(curr.x, curr.y, 0.5);
        headRef.current.rotation.set(Math.PI / 2, 0, (isLocal && localSegments ? (gs.players[playerId]?.currentAngle || 0) : player.currentAngle) - Math.PI / 2);
        
        if (headRef.current && headRef.current.material) {
          const headMat = headRef.current.material as THREE.MeshStandardMaterial;
          if (isKurdistan) headMat.color.set('#FFD700');
          else if (isRealMadrid) headMat.color.set('#FFFFFF');
          else if (isUSA) headMat.color.set('#FFFFFF');
          else if (isRealSnake) headMat.color.set('#2d5a27');
          else if (isAdmin) headMat.color.set('#00ffff');
          else headMat.color.set(skinColor);

          if (isAdmin) {
            headMat.emissive.set('#00ffff');
            headMat.emissiveIntensity = 2;
          } else {
            headMat.emissive.set('#000000');
            headMat.emissiveIntensity = 0;
          }
        }
      } else {
        dummy.position.set(curr.x, curr.y, 0.5);
        // Tapering tail for 3D look
        const baseScale = isAdmin ? 1.2 : 1;
        const taperScale = 1 - (i / count) * 0.5; // Taper to 50% at tail
        dummy.scale.setScalar(baseScale * taperScale);
        dummy.updateMatrix();
        bodyRef.current.setMatrixAt(i - 1, dummy.matrix);

        if (isKurdistan) {
          const patternIdx = (i - 1) % 3;
          if (patternIdx === 0) colorObj.set('#ED2124');
          else if (patternIdx === 1) colorObj.set('#FFFFFF');
          else colorObj.set('#278E43');
          bodyRef.current.setColorAt(i - 1, colorObj);
        } else if (isRealMadrid) {
          const patternIdx = (i - 1) % 2;
          if (patternIdx === 0) colorObj.set('#FFFFFF');
          else colorObj.set('#00529F');
          bodyRef.current.setColorAt(i - 1, colorObj);
        } else if (isUSA) {
          const patternIdx = (i - 1) % 10;
          if (patternIdx < 3) colorObj.set('#3C3B6E');
          else if (patternIdx % 2 === 0) colorObj.set('#B22234');
          else colorObj.set('#FFFFFF');
          bodyRef.current.setColorAt(i - 1, colorObj);
        } else if (isRealSnake) {
          const patternIdx = (i - 1) % 6;
          if (patternIdx < 3) colorObj.set('#2d5a27'); // dark green
          else if (patternIdx < 5) colorObj.set('#1a3317'); // darker forest green
          else colorObj.set('#8b4513'); // saddle brown spot
          bodyRef.current.setColorAt(i - 1, colorObj);
        } else if (isAdmin) {
          const patternIdx = (i - 1) % 4;
          if (patternIdx === 0) colorObj.set('#00ffff');
          else if (patternIdx === 2) colorObj.set('#ff00ff');
          else colorObj.set('#111111');
          bodyRef.current.setColorAt(i - 1, colorObj);
        } else {
          colorObj.set(skinColor);
          bodyRef.current.setColorAt(i - 1, colorObj);
        }
      }
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
    if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <Sphere ref={headRef} args={[0.9, 16, 16]} frustumCulled={false}>
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `
              #include <emissivemap_fragment>
              float fresnel = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 2.0);
              totalEmissiveRadiance += diffuseColor.rgb * (0.4 + fresnel * 3.0);
              `
            );
          }}
        />
        {(skinId === 'kurdistan' || skinId === 'crown') && <Crown />}
        {skinId === 'usa' && <USAHat />}
        {skinId === 'realmadrid' && <SoccerBall />}
        {skinId === 'skull' && <SkullHat />}
        {skinId === 'viking' && <VikingHelmet />}
        {skinId === 'redcap' && <RedCap />}
        {(skinId === 'real-snake' || skinId === 'snake-head') && <RealSnakeHead />}
        {skinId === 'admin-neon' && <AdminAccessory />}
      </Sphere>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, 2000]} frustumCulled={false}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `
              #include <emissivemap_fragment>
              float fresnel = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 2.0);
              totalEmissiveRadiance += diffuseColor.rgb * (0.4 + fresnel * 1.5);
              `
            );
          }}
        />
      </instancedMesh>
    </group>
  );
}

function Orbs() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const gs = globalGameState.current;
    if (!gs) return;

    const time = state.clock.getElapsedTime();
    
    let i = 0;
    for (const orbId in gs.orbs) {
      if (localCollectedOrbs.has(orbId)) continue;
      const orb = gs.orbs[orbId];
      
      let scale = 1;
      let color = orb.color;
      
      if (orb.value >= 5) {
        scale = 1.8 + Math.sin(time * 8) * 0.3;
      } else {
        scale = 1 + Math.sin(time * 3) * 0.1;
      }
      
      dummy.position.set(orb.x, orb.y, 0.5);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      colorObj.set(color);
      meshRef.current.setColorAt(i, colorObj);
      i++;
    }
    meshRef.current.count = i;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, 1000]} castShadow receiveShadow frustumCulled={false}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          roughness={0.4}
          metalness={0.1}
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `
              #include <emissivemap_fragment>
              totalEmissiveRadiance += diffuseColor.rgb * 2.5;
              `
            );
          }}
        />
      </instancedMesh>
      {Object.values(globalGameState.current?.orbs || {}).map((orb, i) => {
        if (orb.value < 5 || localCollectedOrbs.has(orb.id)) return null;
        return (
          <Billboard key={`orb-label-${orb.id || i}-${i}`} position={[orb.x, orb.y, 2]}>
            <Text
              fontSize={0.6}
              color="white"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.woff"
            >
              BIG
            </Text>
          </Billboard>
        );
      })}
    </group>
  );
}

export function GameScene() {
  const gameState = useGameStore(state => state.gameState);
  const playerId = useGameStore(state => state.playerId);
  const sendPlayerState = useGameStore(state => state.sendPlayerState);
  const sendCollectOrb = useGameStore(state => state.sendCollectOrb);
  const { camera } = useThree();
  const inputs = useRef({ left: false, right: false, boost: false });
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const [lightTarget] = useState(() => new THREE.Object3D());

  const localPlayerRef = useRef<{
    active: boolean;
    segments: {x: number, y: number}[];
    score: number;
    currentAngle: number;
    isBoosting: boolean;
    lastSendTime: number;
    lastDeathTime: number;
  }>({
    active: false,
    segments: [],
    score: 10,
    currentAngle: 0,
    isBoosting: false,
    lastSendTime: 0,
    lastDeathTime: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') && !inputs.current.left) { inputs.current.left = true; }
      if ((e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') && !inputs.current.right) { inputs.current.right = true; }
      if ((e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && !inputs.current.boost) { inputs.current.boost = true; }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') && inputs.current.left) { inputs.current.left = false; }
      if ((e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') && inputs.current.right) { inputs.current.right = false; }
      if ((e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && inputs.current.boost) { inputs.current.boost = false; }
    };

    const handleBlur = () => {
      inputs.current = { left: false, right: false, boost: false };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useFrame((state, delta) => {
    const gs = globalGameState.current;
    if (!gs || !playerId) return;

    // Merge keyboard and mobile inputs
    const { mobileInputs, joystickAngle, socket } = useGameStore.getState();
    const isLeft = inputs.current.left || mobileInputs.left;
    const isRight = inputs.current.right || mobileInputs.right;
    const isBoost = inputs.current.boost || mobileInputs.boost;
    
    const serverPlayer = gs.players[playerId];
    const now = Date.now();

    if (serverPlayer && serverPlayer.state === 'alive') {
      
      // Initialize from server if not active and haven't died recently
      if (!localPlayerRef.current.active && serverPlayer.segments.length > 0 && now - localPlayerRef.current.lastDeathTime > 1000) {
        localPlayerRef.current.active = true;
        localPlayerRef.current.segments = [...serverPlayer.segments];
        localPlayerRef.current.score = serverPlayer.score;
        localPlayerRef.current.currentAngle = serverPlayer.currentAngle;
      }

      if (!localPlayerRef.current.active) return;

      // Movement logic
      if (joystickAngle !== null) {
        // High-precision 360-degree rotation
        let diff = joystickAngle - localPlayerRef.current.currentAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        const lerpFactor = Math.min(1, 20 * delta);
        localPlayerRef.current.currentAngle += diff * lerpFactor;
      } else {
        if (isLeft) localPlayerRef.current.currentAngle += TURN_SPEED * delta;
        if (isRight) localPlayerRef.current.currentAngle -= TURN_SPEED * delta;
      }
      
      localPlayerRef.current.isBoosting = isBoost && localPlayerRef.current.score > 10;
      const speed = localPlayerRef.current.isBoosting ? BOOST_SPEED : BASE_SPEED;
      
      const head = { ...localPlayerRef.current.segments[0] };
      head.x += Math.cos(localPlayerRef.current.currentAngle) * speed * delta;
      head.y += Math.sin(localPlayerRef.current.currentAngle) * speed * delta;

      // Boundary check - Wall hit kills
      const boundary = WORLD_SIZE / 2;
      let hitWall = false;
      if (head.x < -boundary || head.x > boundary || head.y < -boundary || head.y > boundary) {
        hitWall = true;
      }

      localPlayerRef.current.segments.unshift(head);

      if (localPlayerRef.current.isBoosting) {
        localPlayerRef.current.score -= 2 * delta;
        if (localPlayerRef.current.score <= 10) {
          localPlayerRef.current.isBoosting = false;
          localPlayerRef.current.score = 10;
        }
      }

      const targetLength = Math.floor(localPlayerRef.current.score);
      while (localPlayerRef.current.segments.length > targetLength) {
        localPlayerRef.current.segments.pop();
      }

      // Check orb collisions
      for (const orbId in gs.orbs) {
        if (localCollectedOrbs.has(orbId)) continue;
        const orb = gs.orbs[orbId];
        const dx = head.x - orb.x;
        const dy = head.y - orb.y;
        if (dx * dx + dy * dy < 4) {
          localPlayerRef.current.score += orb.value;

          if (orb.value >= 5) {
            useGameStore.getState().addNotification('Big orb!');
          }
          
          localCollectedOrbs.add(orbId);
          // We don't mutate the gs.orbs object directly as it triggers issues with React tracking the same object.
          // localCollectedOrbs.has(orbId) at the start of loop will skip it.
          sendCollectOrb(orbId);
        }
      }

      // Cleanup localCollectedOrbs occasionally
      if (Math.random() < 0.05) {
        for (const id of localCollectedOrbs) {
          if (!gs.orbs[id]) localCollectedOrbs.delete(id);
        }
      }

      // Check player collisions
      let collided = false;
      let killedBy = '';
      
      if (hitWall) {
        collided = true;
        killedBy = 'the wall';
      } else {
        for (const otherId in gs.players) {
          if (otherId === playerId) continue;
          const other = gs.players[otherId];
          if (other.state !== 'alive') continue;
          for (let i = 0; i < other.segments.length; i++) {
            const seg = other.segments[i];
            const dx = head.x - seg.x;
            const dy = head.y - seg.y;
            // Slightly larger collision radius for head-to-head for mutual destruction
            const collisionDist = i === 0 ? 3.0 : 2.25; 
            if (dx * dx + dy * dy < collisionDist) {
              collided = true;
              killedBy = otherId;
              break;
            }
          }
          if (collided) break;
        }
      }

      if (collided) {
        localPlayerRef.current.active = false;
        localPlayerRef.current.lastDeathTime = Date.now();
        sendPlayerState({
          segments: localPlayerRef.current.segments,
          score: localPlayerRef.current.score,
          currentAngle: localPlayerRef.current.currentAngle,
          isBoosting: localPlayerRef.current.isBoosting,
          state: 'dead',
          killedBy: killedBy
        });
        return;
      }

      // We no longer mutate the global state (gs.players[playerId]) here
      // because it causes React update loops. We will handle local player smooth rendering
      // by either updating the Snake component or other means.
      // For now, let's just send the state and let the server sync it back.
      // The visual smoothness of the local snake is handled by the Snake's LERP logic
      // if we ensure it knows it's the local player.

      const now_send = Date.now();
      if (now_send - localPlayerRef.current.lastSendTime > 50) {
        sendPlayerState({
          segments: localPlayerRef.current.segments,
          score: localPlayerRef.current.score,
          currentAngle: localPlayerRef.current.currentAngle,
          isBoosting: localPlayerRef.current.isBoosting,
          state: 'alive'
        });
        localPlayerRef.current.lastSendTime = now_send;
      }

      const targetZ = 50; // Increased from 40 for better visibility
      const lerpFactor = Math.min(1, 10 * delta);
      const targetX = head.x || 0;
      const targetY = head.y || 0;

      // Fixed 2D Top-down Camera
      camera.position.x += (targetX - camera.position.x) * lerpFactor;
      camera.position.y += (targetY - camera.position.y) * lerpFactor;
      camera.position.z = targetZ; // Lock Z at fixed height
      camera.rotation.set(0, 0, 0); // Straight down
      camera.lookAt(camera.position.x, camera.position.y, 0);

      // Light follow
      if (lightRef.current) {
        lightRef.current.position.set(camera.position.x + 10, camera.position.y - 10, 30);
        lightTarget.position.set(camera.position.x, camera.position.y, 0);
        lightTarget.updateMatrixWorld();
      }
    } else {
      localPlayerRef.current.active = false;
    }
  });

  if (!gameState) return null;

  return (
    <>
      <ambientLight intensity={1.5} />
      <pointLight position={[0, 0, 10]} intensity={1} />
      <primitive object={lightTarget} />

      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#0b0b1a" />
      </mesh>

      <Grid
        position={[0, 0, -0.1]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[WORLD_SIZE, WORLD_SIZE]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e3a8a"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#3b82f6"
        fadeDistance={100}
        fadeStrength={1}
      />

      <Orbs />

      {Object.values(gameState.players).map((player, i) => {
        if (player.state !== 'alive' || player.segments.length === 0) return null;
        return (
          <Snake
            key={`player-snake-${player.id || i}-${i}`}
            playerId={player.id}
            color={player.color}
            skinId={player.skin}
            isLocal={player.id === playerId}
            localSegments={player.id === playerId ? localPlayerRef.current.segments : undefined}
          />
        );
      })}
    </>
  );
}
