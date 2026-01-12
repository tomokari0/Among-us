import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameEngine } from './hooks/useGameEngine';
import { PlayerModel, MapModel, TaskMarker } from './components/GameModels';
import { GameUI } from './components/GameUI';
import { PLAYER_SPEED } from './constants';
import { Vector3, Task } from './types';

// Keyboard Input Hook
const usePlayerControls = () => {
  const keys = useRef({ w: false, a: false, s: false, d: false, e: false, r: false, k: false, m: false });
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
       const k = e.key.toLowerCase();
       if (k in keys.current) keys.current[k as keyof typeof keys.current] = true;
    };
    const handleUp = (e: KeyboardEvent) => {
       const k = e.key.toLowerCase();
       if (k in keys.current) keys.current[k as keyof typeof keys.current] = false;
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
        window.removeEventListener('keydown', handleDown);
        window.removeEventListener('keyup', handleUp);
    };
  }, []);
  return keys;
};

// Scene Controller
const GameScene: React.FC<{ 
    engine: ReturnType<typeof useGameEngine>;
    myTasks: Task[];
}> = ({ engine, myTasks }) => {
    const { camera } = useThree();
    const keys = usePlayerControls();
    const lastActionTime = useRef(0);
    
    // Update Loop
    useFrame((state, delta) => {
        engine.gameTick(delta);

        if (engine.gameState.phase !== 'PLAYING') return;

        const myPlayer = engine.gameState.players.find(p => p.id === engine.gameState.myPlayerId);
        if (!myPlayer || myPlayer.isDead) return; // Spectator mode todo

        // Player Movement
        // Camera direction
        const front = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        front.y = 0;
        front.normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();

        const moveVec = new THREE.Vector3();
        if (keys.current.w) moveVec.add(front);
        if (keys.current.s) moveVec.sub(front);
        if (keys.current.d) moveVec.add(right);
        if (keys.current.a) moveVec.sub(right);

        if (moveVec.length() > 0) {
             moveVec.normalize().multiplyScalar(PLAYER_SPEED);
             engine.movePlayer(myPlayer.id, { x: moveVec.x, y: 0, z: moveVec.z }, delta);
        }

        // Camera follow
        const pPos = new THREE.Vector3(myPlayer.position.x, myPlayer.position.y, myPlayer.position.z);
        
        // 1st/3rd Person Hybrid
        camera.position.x = pPos.x;
        camera.position.y = pPos.y + 1.6; // Eye height
        camera.position.z = pPos.z;

        // Actions
        const now = state.clock.elapsedTime;
        if (now - lastActionTime.current > 0.5) {
            if (keys.current.k) { engine.performAction('KILL'); lastActionTime.current = now; }
            if (keys.current.r) { engine.performAction('REPORT'); lastActionTime.current = now; }
            if (keys.current.e) { engine.performAction('USE'); lastActionTime.current = now; }
        }
    });

    return (
        <>
            <ambientLight intensity={0.3} />
            <pointLight position={[0, 10, 0]} intensity={0.5} />
            <Stars />
            
            <MapModel />
            
            {engine.gameState.players.map(p => (
                <PlayerModel 
                    key={p.id} 
                    player={p} 
                    isMe={p.id === engine.gameState.myPlayerId} 
                />
            ))}

            {/* Render ONLY my tasks */}
            {myTasks.map(t => (
                 !t.completed && <TaskMarker key={t.id} task={t} />
            ))}

            {/* Only enable controls if playing */}
            {engine.gameState.phase === 'PLAYING' && <PointerLockControls />}
        </>
    );
};

const App: React.FC = () => {
  const engine = useGameEngine();
  const [showMap, setShowMap] = useState(false);

  // Map Toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'm') {
            setShowMap(prev => !prev);
        }
        if (e.key === 'Tab') {
            e.preventDefault(); // Prevent tab navigation
            // Could toggle scoreboard/map
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Meeting Timer Effect
  useEffect(() => {
    let interval: any;
    if (engine.gameState.phase === 'MEETING') {
        setShowMap(false); // Close map on meeting
        interval = setInterval(() => {
            engine.setGameState(prev => {
                if (prev.meetingTimer <= 0) {
                    engine.resolveMeeting();
                    return prev;
                }
                return { ...prev, meetingTimer: prev.meetingTimer - 1 };
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [engine.gameState.phase, engine.gameState.meetingTimer]);

  const myTasks = engine.gameState.tasks[engine.gameState.myPlayerId] || [];

  return (
    <div className="w-full h-full relative bg-black">
        <Canvas camera={{ fov: 75, near: 0.1, far: 100, position: [0, 5, 10] }}>
            <GameScene engine={engine} myTasks={myTasks} />
        </Canvas>
        
        <GameUI 
            gameState={engine.gameState}
            killCooldown={engine.killCooldown}
            nearbyTarget={engine.nearbyTarget}
            nearbyTask={engine.nearbyTask}
            onVote={(id) => engine.castVote(engine.gameState.myPlayerId, id)}
            onStart={engine.startGame}
            onRestart={engine.startGame}
            showMap={showMap}
        />
    </div>
  );
};

export default App;