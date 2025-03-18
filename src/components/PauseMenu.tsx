import React from 'react';
import { AIDifficulty } from '../game/types';
import './PauseMenu.css';
import { Play, RotateCcw, LogOut, MousePointer, ArrowUpCircle, Target } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onReset: () => void;
  onExitToMenu: () => void;
  aiDifficulty: AIDifficulty;
  player1AI: boolean;
  player2AI: boolean;
  numAIOpponents: number;
}

const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onReset,
  onExitToMenu,
  aiDifficulty,
  player1AI,
  player2AI,
  numAIOpponents
}) => {
  // Get game mode text based on AI configuration
  const getGameModeText = () => {
    if (numAIOpponents === 0) return "2 Human Players";
    if (numAIOpponents === 1) return "1 Human vs 1 AI";
    if (numAIOpponents === 2) return "1 Human vs 2 AI Opponents";
    return "Custom Game";
  };

  const handleResetAndResume = () => {
    onReset();
    onResume(); // Start the game after reset
  };

  return (
    <div className="pause-overlay">
      <div className="pause-menu">
        <h2>Game Paused</h2>
        
        <div className="pause-menu-options">
          <button className="pause-button" onClick={onResume}>
            <Play size={18} />
            Resume Game
          </button>
          
          <div className="game-status">
            <h3>Current Game</h3>
            <div className="status-info">
              <p>Game Mode: {getGameModeText()}</p>
              {numAIOpponents > 0 && (
                <p>AI Difficulty: {aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)}</p>
              )}
            </div>
          </div>
          
          <div className="button-group">
            <button className="pause-button reset-button" onClick={handleResetAndResume}>
              <RotateCcw size={18} />
              Reset Game
            </button>
            
            <button className="pause-button exit-button" onClick={onExitToMenu}>
              <LogOut size={18} />
              Exit to Menu
            </button>
          </div>
        </div>
        
        <div className="pause-help">
          <div className="help-section">
            <h3>Controls</h3>
            <ul>
              <li>Left-click to select your planets</li>
              <li>Drag from your planet to target planet</li>
              <li>Click selected planet to deselect</li>
              <li>Right-click to deselect any planet</li>
              <li>Mouse wheel to change fleet percentage</li>
              <li>Double-click background to repeat last action</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h3>Planet Levels</h3>
            <ul>
              <li>Level 1: Base production</li>
              <li>Level 2: 3x production (costs 50 ships)</li>
              <li>Level 3: 6x production (costs 150 ships)</li>
              <li>Click upgrade button <ArrowUpCircle size={16} className="upgrade-icon" /> to improve planets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu; 