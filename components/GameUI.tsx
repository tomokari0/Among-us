import React from 'react';
import { GameState, GamePhase, Role, Player } from '../types';

interface UIProps {
  gameState: GameState;
  killCooldown: number;
  nearbyTarget: string | null;
  nearbyTask: any;
  onVote: (id: string | null) => void;
  onStart: () => void;
  onRestart: () => void;
  timeRemaining?: number;
}

export const GameUI: React.FC<UIProps> = ({ 
  gameState, killCooldown, nearbyTarget, nearbyTask, onVote, onStart, onRestart, timeRemaining 
}) => {
  const me = gameState.players.find(p => p.id === gameState.myPlayerId);

  if (gameState.phase === GamePhase.LOBBY) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-600 mb-8 tracking-widest uppercase">Suspicious Space</h1>
          <button 
            onClick={onStart}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold rounded shadow-lg transition"
          >
            START GAME
          </button>
          <p className="mt-4 text-gray-400">WASD to Move | Mouse to Look | E to Interact | R to Report</p>
        </div>
      </div>
    );
  }

  if (gameState.phase === GamePhase.GAMEOVER) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-95 z-50">
            <h1 className={`text-6xl font-bold mb-4 ${gameState.winner === Role.IMPOSTOR ? 'text-red-500' : 'text-blue-500'}`}>
                {gameState.winner === Role.IMPOSTOR ? 'IMPOSTOR VICTORY' : 'CREWMATE VICTORY'}
            </h1>
            <button onClick={onRestart} className="px-6 py-3 bg-white text-black font-bold rounded">PLAY AGAIN</button>
        </div>
      );
  }

  if (gameState.phase === GamePhase.MEETING) {
      const remainingVotes = gameState.players.filter(p => !p.isDead && !p.voteCast).length;
      return (
          <div className="absolute inset-0 bg-blue-900 bg-opacity-95 p-10 flex flex-col z-40">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-white">EMERGENCY MEETING</h2>
                  <div className="text-2xl font-mono">Time: {gameState.meetingTimer}s</div>
              </div>
              <div className="text-center text-gray-300 mb-4">Who is the Impostor? ({remainingVotes} remaining)</div>
              
              <div className="grid grid-cols-4 gap-4 flex-1">
                  {gameState.players.map(p => (
                      <div key={p.id} 
                           className={`relative bg-gray-800 p-4 rounded border-2 ${p.isDead ? 'border-red-900 opacity-50' : 'border-gray-600'} flex flex-col items-center cursor-pointer hover:bg-gray-700`}
                           onClick={() => !p.isDead && !me?.voteCast && onVote(p.id)}
                      >
                          <div className="w-12 h-12 rounded-full mb-2" style={{ backgroundColor: p.color }}></div>
                          <span className="font-bold">{p.name}</span>
                          {p.isDead && <span className="text-red-500 text-xs">DEAD</span>}
                          {gameState.players.filter(v => v.voteCast === p.id).map((_, i) => (
                              <div key={i} className="w-3 h-3 bg-white rounded-full mt-1 border border-black inline-block mx-0.5"></div>
                          ))}
                      </div>
                  ))}
              </div>
              <div className="mt-6 flex justify-center">
                  <button 
                    disabled={!!me?.voteCast}
                    onClick={() => onVote(null)}
                    className="px-6 py-3 bg-gray-500 text-white rounded font-bold hover:bg-gray-400 disabled:opacity-50"
                  >
                      SKIP VOTE
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Role Reveal (Fade out handled by logic usually, keeping simple here) */}
      <div className="absolute top-4 left-4 text-2xl font-bold drop-shadow-md">
        <span className={me?.role === Role.IMPOSTOR ? 'text-red-500' : 'text-blue-400'}>
          {me?.role.toUpperCase()}
        </span>
      </div>

      {/* Task Bar */}
      <div className="absolute top-4 left-0 right-0 flex justify-center">
        <div className="w-1/2 bg-gray-700 h-6 border-2 border-gray-500 rounded-full overflow-hidden">
            <div 
                className="h-full bg-green-500 transition-all duration-500" 
                style={{ width: `${(gameState.completedTasks / (gameState.totalTasks || 1)) * 100}%` }}
            ></div>
        </div>
      </div>

      {/* Interaction Prompts */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-4">
          {nearbyTask && !nearbyTask.completed && me?.role === Role.CREWMATE && (
              <div className="bg-yellow-500 text-black font-bold px-4 py-2 rounded animate-bounce">
                  PRESS E TO {nearbyTask.type}
              </div>
          )}
          {nearbyTarget && (
              <div className="bg-red-600 text-white font-bold px-4 py-2 rounded animate-pulse">
                   PRESS {nearbyTarget.includes('KILL') ? 'K' : 'R'} TO {nearbyTarget}
              </div>
          )}
      </div>

      {/* Action Buttons (Visual only, controls are KB) */}
      {me?.role === Role.IMPOSTOR && (
          <div className="absolute bottom-4 right-4 flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mb-2 ${killCooldown > 0 ? 'border-gray-500 bg-gray-800' : 'border-red-500 bg-red-900'}`}>
                  {killCooldown > 0 ? (
                      <span className="text-2xl font-mono font-bold text-gray-300">{Math.ceil(killCooldown)}</span>
                  ) : (
                      <span className="text-xl font-bold text-white">KILL</span>
                  )}
              </div>
              <span className="font-bold text-sm bg-black/50 px-2 rounded">K</span>
          </div>
      )}
      
       <div className="absolute bottom-4 right-28 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-800 flex items-center justify-center mb-2">
              <span className="text-sm font-bold">REPORT</span>
          </div>
          <span className="font-bold text-sm bg-black/50 px-2 rounded">R</span>
       </div>
    </div>
  );
};
