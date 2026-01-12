export enum Role {
  CREWMATE = 'Crewmate',
  IMPOSTOR = 'Impostor'
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  MEETING = 'MEETING',
  GAMEOVER = 'GAMEOVER'
}

export enum PlayerColor {
  RED = '#C51111',
  BLUE = '#132ED1',
  GREEN = '#117F2D',
  PINK = '#ED54BA',
  ORANGE = '#EF7D0D',
  YELLOW = '#F5F557',
  BLACK = '#3F474E',
  WHITE = '#D6E0F0',
  PURPLE = '#6B2FBC',
  CYAN = '#38FEDC'
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  role: Role;
  position: Vector3;
  rotation: number;
  isDead: boolean;
  isBot: boolean;
  targetNode?: Vector3; // For AI pathfinding
  voteCast?: string | null; // ID of player voted for
}

export interface Room {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  color: string;
}

export interface Task {
  id: string;
  type: 'WIRES' | 'DOWNLOAD' | 'SWIPE' | 'UNLOCK' | 'PRIME';
  roomId: string;
  position: Vector3;
  completed: boolean;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  myPlayerId: string;
  tasks: Record<string, Task[]>; // PlayerID -> Tasks
  totalTasks: number;
  completedTasks: number;
  meetingTimer: number;
  sabotageActive: string | null; // 'REACTOR' or 'O2' or 'LIGHTS'
  sabotageTimer: number;
  winner: Role | null;
  reportedBodyId: string | null;
}
