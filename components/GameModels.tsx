import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Player, Room, Task } from '../types';
import { ROOMS, VENTS, NAV_NODES } from '../constants';

export const PlayerModel: React.FC<{ player: Player; isMe: boolean }> = ({ player, isMe }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Interpolate position for smoothness
      meshRef.current.position.lerp(new THREE.Vector3(player.position.x, 0, player.position.z), 0.2);
      meshRef.current.rotation.y = player.rotation;
    }
  });

  if (player.isDead) {
      // Dead body (bone)
      return (
        <group position={[player.position.x, 0.2, player.position.z]} rotation={[0, player.rotation, Math.PI/2]}>
             <mesh>
                 <capsuleGeometry args={[0.4, 0.8]} />
                 <meshStandardMaterial color={player.color} />
             </mesh>
             <mesh position={[0, 0.5, 0]}>
                 <boxGeometry args={[0.3, 0.8, 0.3]} />
                 <meshStandardMaterial color="white" />
             </mesh>
        </group>
      );
  }

  return (
    <group ref={meshRef}>
      {/* Body */}
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.5, 1.5, 4, 8]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 1.5, 0.35]}>
        <boxGeometry args={[0.6, 0.4, 0.4]} />
        <meshStandardMaterial color="#71D4E3" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Backpack */}
      <mesh position={[0, 1.2, -0.4]}>
        <boxGeometry args={[0.7, 0.9, 0.3]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      {/* Name Tag */}
      {!isMe && (
         <Html position={[0, 2.5, 0]} center>
            <div className="text-white font-bold text-xs bg-black/50 px-1 rounded whitespace-nowrap">
                {player.name}
            </div>
         </Html>
      )}
    </group>
  );
};

export const MapModel: React.FC = () => {
    const floorGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
    
    return (
        <group>
            {/* Rooms */}
            {ROOMS.map(room => (
                <group key={room.id} position={[room.x, 0.01, room.z]}>
                    {/* Floor */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[room.width, room.depth, 1]}>
                        <planeGeometry />
                        <meshStandardMaterial color={room.color} />
                    </mesh>
                    
                    {/* Walls (Simple Box frames) - Procedural Generation */}
                    {/* North Wall */}
                    <mesh position={[0, 2, -room.depth/2 - 0.2]} scale={[room.width + 0.4, 4, 0.4]}>
                         <boxGeometry />
                         <meshStandardMaterial color="#667" />
                    </mesh>
                    {/* South Wall */}
                    <mesh position={[0, 2, room.depth/2 + 0.2]} scale={[room.width + 0.4, 4, 0.4]}>
                         <boxGeometry />
                         <meshStandardMaterial color="#667" />
                    </mesh>
                    {/* West Wall */}
                    <mesh position={[-room.width/2 - 0.2, 2, 0]} scale={[0.4, 4, room.depth]}>
                         <boxGeometry />
                         <meshStandardMaterial color="#667" />
                    </mesh>
                    {/* East Wall */}
                    <mesh position={[room.width/2 + 0.2, 2, 0]} scale={[0.4, 4, room.depth]}>
                         <boxGeometry />
                         <meshStandardMaterial color="#667" />
                    </mesh>
                    
                    {/* Room Label */}
                    <Text position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]} fontSize={1} color="rgba(255,255,255,0.3)">
                        {room.name}
                    </Text>
                </group>
            ))}

            {/* Corridors (Visuals only, logic is in collision) */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]} scale={[60, 4, 1]}>
                 <planeGeometry />
                 <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[-16, 0, 3]} rotation={[-Math.PI/2, 0, 0]} scale={[4, 25, 1]}>
                 <planeGeometry />
                 <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0, 0, 9]} rotation={[-Math.PI/2, 0, 0]} scale={[4, 16, 1]}>
                 <planeGeometry />
                 <meshStandardMaterial color="#222" />
            </mesh>
            
            {/* Vents */}
            {VENTS.map(v => (
                 <mesh key={v.id} position={[v.x, 0.05, v.z]} rotation={[-Math.PI/2, 0, 0]}>
                     <planeGeometry args={[1.5, 1]} />
                     <meshStandardMaterial color="#333" />
                     <mesh position={[0, 0, 0.1]}>
                         <boxGeometry args={[1.5, 1, 0.1]} />
                         <meshStandardMaterial color="#555" wireframe />
                     </mesh>
                 </mesh>
            ))}
        </group>
    );
};

export const TaskMarker: React.FC<{ task: Task }> = ({ task }) => {
    if (task.completed) return null;
    return (
        <group position={[task.position.x, 1, task.position.z]}>
            <mesh>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#F9E076" emissive="#F9E076" emissiveIntensity={0.5} />
            </mesh>
            <pointLight distance={3} intensity={2} color="#F9E076" />
        </group>
    );
};
