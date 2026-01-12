import { ROOMS, WALL_HEIGHT } from './constants';
import { Vector3 } from './types';

export const checkCollision = (newPos: Vector3): Vector3 => {
  // Simple AABB collision against room walls
  // We treat the map as a set of hollow rectangles (Rooms).
  // If player is NOT inside any room definition, they are in a wall (conceptually, assuming corridors are implicit or wide enough)
  // HOWEVER, for this generative approach, we'll invert it:
  // We define "Walkable Areas" (Rooms + Corridors).
  // If newPos is not in a walkable area, clamp to the nearest edge of the current walkable area.

  // Simplified approach: Check if inside ANY room bounding box.
  // We expand room boxes slightly to account for corridors connecting them visually.
  
  let valid = false;
  // Corridors are simulated by simple bounding box unions or by just allowing movement if inside a room
  // To make a playable map without complex pathfinding mesh, we will define corridors as additional "Rooms" without walls.
  
  // Custom logic: Iterate all rooms. 
  // A room spans [x - w/2, x + w/2] and [z - d/2, z + d/2].
  
  // Add some implicit corridors
  const corridors = [
    { x: 0, z: 0, width: 60, depth: 3 }, // Horizontal spine
    { x: -16, z: 3, width: 4, depth: 20 }, // Engine connector
    { x: 0, z: 9, width: 4, depth: 16 }, // Vertical storage
  ];

  const allWalkable = [...ROOMS, ...corridors.map((c, i) => ({ ...c, id: `c-${i}`, name: 'Corridor', color: '#000' }))];

  for (const area of allWalkable) {
    const halfW = area.width / 2;
    const halfD = area.depth / 2;
    
    if (
      newPos.x >= area.x - halfW &&
      newPos.x <= area.x + halfW &&
      newPos.z >= area.z - halfD &&
      newPos.z <= area.z + halfD
    ) {
      valid = true;
      break;
    }
  }

  // If not valid, we simply don't move (return old pos or clamp?). 
  // Returning the "valid" flag would be better, but here we expect a Vector3 result.
  // Since we don't have the old pos here, the caller handles logic. 
  // But wait, the caller passes the *desired* position.
  
  // Better Collision Logic: Circle vs AABB.
  // For simplicity: If invalid, return null to signal collision.
  return newPos; // Placeholder, logic moved to hook for state access
};

export const getDistance = (v1: Vector3, v2: Vector3) => {
  const dx = v1.x - v2.x;
  const dz = v1.z - v2.z;
  return Math.sqrt(dx * dx + dz * dz);
};
