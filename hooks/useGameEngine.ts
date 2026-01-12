import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GamePhase, Player, Role, PlayerColor, Vector3, Task } from '../types';
import { ROOMS, PLAYER_NAMES, PLAYER_COLORS, IMPOSTOR_KILL_COOLDOWN, IMPOSTOR_KILL_RANGE, REPORT_RANGE, NAV_NODES, TASK_TEMPLATES, PLAYER_SPEED, INTERACT_RANGE } from '../constants';
import { getDistance } from '../utils';

const generateTasks = (roomIdList: string[]): Task[] => {
  const tasks: Task[] = [];
  // Assign 3-4 tasks per player
  for (let i = 0; i < 4; i++) {
    const room = ROOMS[Math.floor(Math.random() * ROOMS.length)];
    const template = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];
    tasks.push({
      id: `task-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      roomId: room.id,
      position: { 
        x: room.x + (Math.random() * 4 - 2), 
        y: 1, 
        z: room.z + (Math.random() * 4 - 2) 
      },
      completed: false
    });
  }
  return tasks;
};

// Map collision helper
const isWalkable = (x: number, z: number) => {
  // Check against rooms
  for (const r of ROOMS) {
    if (x > r.x - r.width/2 && x < r.x + r.width/2 && z > r.z - r.depth/2 && z < r.z + r.depth/2) return true;
  }
  // Check central spine corridor
  if (x > -30 && x < 30 && z > -2 && z < 2) return true;
  // Check vertical corridors
  if (x > -2 && x < 2 && z > -10 && z < 20) return true;
  // Engine hallway
  if (x > -18 && x < -14 && z > -10 && z < 15) return true;
  // Right hallway
  if (x > 12 && x < 16 && z > -8 && z < 10) return true;
  
  return false;
};

export const useGameEngine = () => {
  // Initial State Setup
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.LOBBY,
    players: [],
    myPlayerId: '',
    tasks: {},
    totalTasks: 0,
    completedTasks: 0,
    meetingTimer: 0,
    sabotageActive: null,
    sabotageTimer: 0,
    winner: null,
    reportedBodyId: null,
  });

  const [killCooldown, setKillCooldown] = useState(10);
  const [nearbyTarget, setNearbyTarget] = useState<string | null>(null); // For UI prompts
  const [nearbyTask, setNearbyTask] = useState<Task | null>(null);

  // Refs for loop
  const playersRef = useRef<Player[]>([]);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  // Initialize Game
  const startGame = () => {
    const playerCount = 8;
    const newPlayers: Player[] = [];
    const impostorIndex = Math.floor(Math.random() * playerCount);
    const tasks: Record<string, Task[]> = {};
    let totalTasksCount = 0;

    for (let i = 0; i < playerCount; i++) {
      const isMe = i === 0;
      const role = i === impostorIndex ? Role.IMPOSTOR : Role.CREWMATE;
      const id = `p${i}`;
      
      newPlayers.push({
        id,
        name: PLAYER_NAMES[i],
        color: PLAYER_COLORS[i],
        role,
        position: { x: 0, y: 0, z: 0 }, // Cafeteria start
        rotation: 0,
        isDead: false,
        isBot: !isMe,
        targetNode: undefined
      });

      if (role === Role.CREWMATE) {
        const pTasks = generateTasks(ROOMS.map(r => r.id));
        tasks[id] = pTasks;
        totalTasksCount += pTasks.length;
      }
    }

    playersRef.current = newPlayers;
    
    setGameState({
      phase: GamePhase.PLAYING,
      players: newPlayers,
      myPlayerId: 'p0',
      tasks,
      totalTasks: totalTasksCount,
      completedTasks: 0,
      meetingTimer: 0,
      sabotageActive: null,
      sabotageTimer: 0,
      winner: null,
      reportedBodyId: null
    });
    setKillCooldown(IMPOSTOR_KILL_COOLDOWN);
  };

  // Main Loop logic (called by useFrame in UI)
  const gameTick = (delta: number) => {
    if (gameState.phase !== GamePhase.PLAYING) return;

    // 1. Update Cooldowns
    if (killCooldown > 0) setKillCooldown(prev => Math.max(0, prev - delta));

    // 2. AI Logic
    const updatedPlayers = playersRef.current.map(p => {
      if (!p.isBot || p.isDead) return p;

      // Simple AI State Machine
      let moveDir = { x: 0, z: 0 };
      const speed = PLAYER_SPEED * 0.6; // Bots are slower

      // If no target, pick one
      if (!p.targetNode) {
        // Pick random room
        const room = ROOMS[Math.floor(Math.random() * ROOMS.length)];
        // Add some randomness within room
        const tx = room.x + (Math.random() * room.width - room.width/2) * 0.8;
        const tz = room.z + (Math.random() * room.depth - room.depth/2) * 0.8;
        return { ...p, targetNode: { x: tx, y: 0, z: tz } };
      }

      // Move towards target
      const dist = getDistance(p.position, p.targetNode);
      if (dist < 0.5) {
        // Arrived. Wait or perform "task" or "kill"
        // Simply clear target to pick new one next frame
        return { ...p, targetNode: undefined };
      }

      const dx = p.targetNode.x - p.position.x;
      const dz = p.targetNode.z - p.position.z;
      const len = Math.sqrt(dx*dx + dz*dz);
      
      // Basic wall sliding / collision check for AI would be here
      // For this implementation, we assume navigation nodes are largely clear or AI ghosts slightly
      const nx = p.position.x + (dx/len) * speed * delta;
      const nz = p.position.z + (dz/len) * speed * delta;

      // Face direction
      const rot = Math.atan2(dx, dz);

      return {
        ...p,
        position: { x: nx, y: 0, z: nz },
        rotation: rot
      };
    });

    playersRef.current = updatedPlayers;

    // 3. Interaction Checks for My Player
    const myPlayer = updatedPlayers.find(p => p.id === gameState.myPlayerId);
    if (myPlayer && !myPlayer.isDead) {
      // Find nearby interactions
      let closestPlayer: string | null = null;
      let minPDist = Infinity;

      // Kill / Report check
      updatedPlayers.forEach(other => {
        if (other.id === myPlayer.id) return;
        const d = getDistance(myPlayer.position, other.position);
        
        if (myPlayer.role === Role.IMPOSTOR && !other.isDead && !other.isBot && d < IMPOSTOR_KILL_RANGE) {
           // Can kill real player? Actually we treat bots as killable
        }
        
        if (d < IMPOSTOR_KILL_RANGE && !other.isDead && myPlayer.role === Role.IMPOSTOR) {
             if (d < minPDist) { minPDist = d; closestPlayer = other.id; }
        }
        
        if (d < REPORT_RANGE && other.isDead) {
             // Can report
             setNearbyTarget(`REPORT ${other.name}`);
             closestPlayer = other.id; // Overload var for report
        }
      });

      if (myPlayer.role === Role.IMPOSTOR && closestPlayer && !playersRef.current.find(p=>p.id===closestPlayer)?.isDead) {
        setNearbyTarget(killCooldown <= 0 ? `KILL ${playersRef.current.find(p=>p.id===closestPlayer)?.name}` : null);
      } else if (closestPlayer && playersRef.current.find(p=>p.id===closestPlayer)?.isDead) {
        setNearbyTarget(`REPORT BODY`);
      } else {
        setNearbyTarget(null);
      }

      // Task Check
      const myTasks = gameState.tasks[myPlayer.id] || [];
      const pendingTasks = myTasks.filter(t => !t.completed);
      let closestTask: Task | null = null;
      let minTDist = Infinity;
      
      for (const t of pendingTasks) {
        const d = getDistance(myPlayer.position, t.position);
        if (d < INTERACT_RANGE && d < minTDist) {
          minTDist = d;
          closestTask = t;
        }
      }
      setNearbyTask(closestTask);
    }
    
    // Check Win Condition
    checkWinCondition();
  };

  const movePlayer = (id: string, velocity: Vector3, delta: number) => {
    const idx = playersRef.current.findIndex(p => p.id === id);
    if (idx === -1) return;
    const p = playersRef.current[idx];
    if (p.isDead) return; // Ghost movement is usually allowed, but let's restrict for simplicity

    const newX = p.position.x + velocity.x * delta;
    const newZ = p.position.z + velocity.z * delta;

    // Collision
    if (isWalkable(newX, newZ)) {
      const updated = [...playersRef.current];
      updated[idx] = { ...p, position: { x: newX, y: 0, z: newZ }, rotation: velocity.x !== 0 || velocity.z !== 0 ? Math.atan2(velocity.x, velocity.z) : p.rotation };
      playersRef.current = updated;
    }
  };

  const performAction = (action: 'KILL' | 'REPORT' | 'USE' | 'VENT') => {
    const myPlayer = playersRef.current.find(p => p.id === gameState.myPlayerId);
    if (!myPlayer || myPlayer.isDead) return;

    if (action === 'KILL' && myPlayer.role === Role.IMPOSTOR && killCooldown <= 0) {
      // Find closest
      let targetId = null;
      let dist = Infinity;
      playersRef.current.forEach(p => {
        if (p.id !== myPlayer.id && !p.isDead) {
          const d = getDistance(myPlayer.position, p.position);
          if (d < IMPOSTOR_KILL_RANGE && d < dist) { dist = d; targetId = p.id; }
        }
      });

      if (targetId) {
        playersRef.current = playersRef.current.map(p => p.id === targetId ? { ...p, isDead: true } : p);
        setKillCooldown(IMPOSTOR_KILL_COOLDOWN);
        // Play sound?
      }
    }

    if (action === 'REPORT') {
      // Check for bodies
      const body = playersRef.current.find(p => p.isDead && getDistance(myPlayer.position, p.position) < REPORT_RANGE);
      if (body) {
        triggerMeeting(body.id);
      }
    }

    if (action === 'USE' && nearbyTask) {
        // Complete task immediately for this demo (or open minigame)
        completeTask(nearbyTask.id);
    }
  };

  const completeTask = (taskId: string) => {
     setGameState(prev => {
         const myTasks = prev.tasks[prev.myPlayerId].map(t => t.id === taskId ? { ...t, completed: true } : t);
         const completedCount = prev.completedTasks + 1;
         return {
             ...prev,
             tasks: { ...prev.tasks, [prev.myPlayerId]: myTasks },
             completedTasks: completedCount
         };
     });
  };

  const triggerMeeting = (bodyId: string | null) => {
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.MEETING,
      reportedBodyId: bodyId,
      meetingTimer: 30, // 30 seconds to vote
      players: playersRef.current // Sync ref to state
    }));
  };

  const castVote = (voterId: string, targetId: string | null) => {
     setGameState(prev => ({
         ...prev,
         players: prev.players.map(p => p.id === voterId ? { ...p, voteCast: targetId || 'skip' } : p)
     }));
  };

  const resolveMeeting = () => {
    // Tally votes
    const votes: Record<string, number> = {};
    gameState.players.forEach(p => {
        if (p.isDead) return;
        const v = p.voteCast || 'skip'; // Default to skip if not voted
        votes[v] = (votes[v] || 0) + 1;
    });
    
    // AI Voting Logic (Simulate just before resolve if they haven't voted)
    // For this demo, we'll assume AI votes randomly or for the reporter if suspicious
    
    // Find max
    let maxVotes = 0;
    let ejectedId = 'skip';
    Object.entries(votes).forEach(([id, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            ejectedId = id;
        } else if (count === maxVotes) {
            ejectedId = 'skip'; // Tie
        }
    });

    // Eject
    let winner: Role | null = null;
    let newPlayers = [...gameState.players];
    
    if (ejectedId !== 'skip') {
        newPlayers = newPlayers.map(p => p.id === ejectedId ? { ...p, isDead: true } : p);
    }

    // Teleport everyone to Cafeteria
    newPlayers = newPlayers.map(p => ({
        ...p,
        position: { x: 0, y: 0, z: 0 },
        voteCast: undefined,
        targetNode: undefined
    }));

    playersRef.current = newPlayers;

    setGameState(prev => ({
        ...prev,
        phase: GamePhase.PLAYING,
        players: newPlayers,
        reportedBodyId: null
    }));
    
    checkWinCondition();
  };
  
  const checkWinCondition = () => {
      // 1. Task Win
      if (gameState.totalTasks > 0 && gameState.completedTasks >= gameState.totalTasks) {
          setGameState(p => ({ ...p, phase: GamePhase.GAMEOVER, winner: Role.CREWMATE }));
          return;
      }
      
      const aliveImpostors = playersRef.current.filter(p => p.role === Role.IMPOSTOR && !p.isDead).length;
      const aliveCrew = playersRef.current.filter(p => p.role === Role.CREWMATE && !p.isDead).length;

      if (aliveImpostors === 0) {
          setGameState(p => ({ ...p, phase: GamePhase.GAMEOVER, winner: Role.CREWMATE }));
      } else if (aliveImpostors >= aliveCrew) {
          setGameState(p => ({ ...p, phase: GamePhase.GAMEOVER, winner: Role.IMPOSTOR }));
      }
  };

  return {
    gameState,
    setGameState,
    startGame,
    playersRef,
    movePlayer,
    performAction,
    gameTick,
    killCooldown,
    nearbyTarget,
    nearbyTask,
    castVote,
    resolveMeeting
  };
};
