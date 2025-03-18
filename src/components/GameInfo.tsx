import React from 'react';
import { Planet, Fleet, PlanetOwner } from '../game/types';
import { COLORS } from '../game/constants';
import { Globe, Rocket, Zap, Play, Pause, RotateCcw, Percent, ChevronsRight, ChevronRight, MoreHorizontal } from 'lucide-react';
import { GameSpeed } from '../game/useGameEngine';
import './GameInfo.css';

interface GameInfoProps {
  planets: Planet[];
  fleets: Fleet[];
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  fleetPercentage: number;
  gameSpeed: GameSpeed;
  onSetSpeed: (speed: GameSpeed) => void;
}

const GameInfo: React.FC<GameInfoProps> = ({ 
  planets, 
  fleets, 
  isRunning,
  onStart,
  onPause,
  onReset,
  fleetPercentage,
  gameSpeed,
  onSetSpeed
}) => {
  // Calculate stats for each player
  const player1Planets = planets.filter(p => p.owner === PlanetOwner.Player1);
  const player2Planets = planets.filter(p => p.owner === PlanetOwner.Player2);
  const player3Planets = planets.filter(p => p.owner === PlanetOwner.Player3);
  
  const player1Ships = player1Planets.reduce((sum, planet) => sum + planet.garrison, 0) +
    fleets.filter(f => f.owner === PlanetOwner.Player1).reduce((sum, fleet) => sum + fleet.shipCount, 0);
  
  const player2Ships = player2Planets.reduce((sum, planet) => sum + planet.garrison, 0) +
    fleets.filter(f => f.owner === PlanetOwner.Player2).reduce((sum, fleet) => sum + fleet.shipCount, 0);
  
  const player3Ships = player3Planets.reduce((sum, planet) => sum + planet.garrison, 0) +
    fleets.filter(f => f.owner === PlanetOwner.Player3).reduce((sum, fleet) => sum + fleet.shipCount, 0);
  
  const player1Production = player1Planets.reduce((sum, planet) => sum + planet.productionRate, 0);
  const player2Production = player2Planets.reduce((sum, planet) => sum + planet.productionRate, 0);
  const player3Production = player3Planets.reduce((sum, planet) => sum + planet.productionRate, 0);
  
  // Check if player 3 is in the game
  const hasPlayer3 = player3Planets.length > 0 || fleets.some(f => f.owner === PlanetOwner.Player3);

  return (
    <div className="game-info">
      <div className="player-stats">
        <div className="player-stat" style={{ borderColor: COLORS[PlanetOwner.Player1] }}>
          <h3>P1</h3>
          <div className="stat-item">
            <Globe size={14} strokeWidth={2.5} />
            <span>{player1Planets.length}</span>
          </div>
          <div className="stat-item">
            <Rocket size={14} strokeWidth={2.5} />
            <span>{player1Ships}</span>
          </div>
          <div className="stat-item">
            <Zap size={14} strokeWidth={2.5} />
            <span>{player1Production}</span>
          </div>
        </div>
        
        <div className="player-stat" style={{ borderColor: COLORS[PlanetOwner.Player2] }}>
          <h3>P2</h3>
          <div className="stat-item">
            <Globe size={14} strokeWidth={2.5} />
            <span>{player2Planets.length}</span>
          </div>
          <div className="stat-item">
            <Rocket size={14} strokeWidth={2.5} />
            <span>{player2Ships}</span>
          </div>
          <div className="stat-item">
            <Zap size={14} strokeWidth={2.5} />
            <span>{player2Production}</span>
          </div>
        </div>

        {hasPlayer3 && (
          <div className="player-stat" style={{ borderColor: COLORS[PlanetOwner.Player3] }}>
            <h3>P3</h3>
            <div className="stat-item">
              <Globe size={14} strokeWidth={2.5} />
              <span>{player3Planets.length}</span>
            </div>
            <div className="stat-item">
              <Rocket size={14} strokeWidth={2.5} />
              <span>{player3Ships}</span>
            </div>
            <div className="stat-item">
              <Zap size={14} strokeWidth={2.5} />
              <span>{player3Production}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="percentage-display">
        <Percent size={14} strokeWidth={2.5} />
        <span>{Math.round(fleetPercentage * 100)}</span>
      </div>
      
      <div className="game-controls">
        <div className="speed-controls">
          <span className="speed-label">Speed:</span>
          <button 
            onClick={() => onSetSpeed(GameSpeed.Slow)}
            className={gameSpeed === GameSpeed.Slow ? 'active' : ''}
            title="Slow"
          >
            <ChevronRight size={16} />
          </button>
          <button 
            onClick={() => onSetSpeed(GameSpeed.Normal)}
            className={gameSpeed === GameSpeed.Normal ? 'active' : ''}
            title="Normal"
          >
            <MoreHorizontal size={16} />
          </button>
          <button 
            onClick={() => onSetSpeed(GameSpeed.Fast)}
            className={gameSpeed === GameSpeed.Fast ? 'active' : ''}
            title="Fast"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
        <div className="control-separator"></div>
        {isRunning ? (
          <button onClick={onPause}><Pause size={16} /></button>
        ) : (
          <button onClick={onStart}><Play size={16} /></button>
        )}
        <button onClick={onReset}><RotateCcw size={16} /></button>
      </div>
    </div>
  );
};

export default GameInfo; 