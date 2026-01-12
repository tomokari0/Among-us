import { Room, Vector3, PlayerColor, Task } from './types';

// Map Dimensions
export const MAP_SCALE = 1;
export const WALL_HEIGHT = 4;
export const PLAYER_SPEED = 6;
export const IMPOSTOR_KILL_COOLDOWN = 25;
export const IMPOSTOR_KILL_RANGE = 2.5;
export const REPORT_RANGE = 4;
export const INTERACT_RANGE = 2.0;

// Defines the layout of the ship (Skeld-ish)
export const ROOMS: Room[] = [
  { id: 'cafeteria', name: 'Cafeteria', x: 0, z: 0, width: 12, depth: 12, color: '#444' },
  { id: 'weapons', name: 'Weapons', x: 14, z: -6, width: 8, depth: 8, color: '#333' },
  { id: 'navigation', name: 'Navigation', x: 22, z: 0, width: 6, depth: 10, color: '#343' },
  { id: 'shields', name: 'Shields', x: 14, z: 8, width: 7, depth: 7, color: '#334' },
  { id: 'admin', name: 'Admin', x: 6, z: 8, width: 6, depth: 6, color: '#344' },
  { id: 'storage', name: 'Storage', x: 0, z: 16, width: 10, depth: 8, color: '#443' },
  { id: 'electrical', name: 'Electrical', x: -6, z: 16, width: 6, depth: 6, color: '#442' },
  { id: 'medbay', name: 'MedBay', x: -8, z: 0, width: 6, depth: 8, color: '#455' },
  { id: 'upper_engine', name: 'Upper Engine', x: -16, z: -4, width: 6, depth: 10, color: '#333' },
  { id: 'lower_engine', name: 'Lower Engine', x: -16, z: 10, width: 6, depth: 10, color: '#333' },
  { id: 'reactor', name: 'Reactor', x: -24, z: 3, width: 6, depth: 12, color: '#222' },
  { id: 'security', name: 'Security', x: -12, z: 6, width: 5, depth: 5, color: '#232' },
];

// Simple doors/connections (gaps in walls)
// Defines logical centers for navigation
export const NAV_NODES: Vector3[] = ROOMS.map(r => ({ x: r.x, y: 0, z: r.z }));

export const TASK_TEMPLATES = [
  { type: 'WIRES', label: 'Fix Wiring' },
  { type: 'DOWNLOAD', label: 'Download Data' },
  { type: 'SWIPE', label: 'Swipe Card' },
  { type: 'UNLOCK', label: 'Unlock Manifolds' },
  { type: 'PRIME', label: 'Prime Shields' },
] as const;

export const PLAYER_COLORS = Object.values(PlayerColor);
export const PLAYER_NAMES = ['Red', 'Blue', 'Green', 'Pink', 'Orange', 'Yellow', 'Black', 'White'];

// Vents locations
export const VENTS = [
  { id: 'v1', x: 0, z: -4, roomId: 'cafeteria' },
  { id: 'v2', x: 14, z: -8, roomId: 'weapons' },
  { id: 'v3', x: 22, z: 2, roomId: 'navigation' },
  { id: 'v4', x: 14, z: 10, roomId: 'shields' },
  { id: 'v5', x: -6, z: 18, roomId: 'electrical' },
  { id: 'v6', x: -8, z: -2, roomId: 'medbay' },
  { id: 'v7', x: -24, z: 0, roomId: 'reactor' },
];
