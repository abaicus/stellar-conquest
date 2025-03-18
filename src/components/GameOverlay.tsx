import React from 'react';
import { PlanetOwner, AIDifficulty } from '../game/types';
import { COLORS } from '../game/constants';
import PauseMenu from './PauseMenu';
import './GameOverlay.css';

interface GameOverlayProps {
  isVisible: boolean;
  isPaused: boolean;
  gameOver: boolean;
  winner: PlanetOwner | null;
  onResume: () => void;
  onReset: () => void;
  onExitToMenu: () => void;
  player1AI: boolean;
  player2AI: boolean;
  aiDifficulty: AIDifficulty;
  numAIOpponents: number;
}

const GameOverlay: React.FC<GameOverlayProps> = ({
  isVisible,
  isPaused,
  gameOver,
  winner,
  onResume,
  onReset,
  onExitToMenu,
  player1AI,
  player2AI,
  aiDifficulty,
  numAIOpponents
}) => {
  if (!isVisible) return null;

  // Display game over content
  if (gameOver && winner) {
    let winnerText = "Unknown";
    
    switch(winner) {
      case PlanetOwner.Player1:
        winnerText = "Player 1";
        break;
      case PlanetOwner.Player2:
        winnerText = "Player 2";
        break;
      case PlanetOwner.Player3:
        winnerText = "Player 3";
        break;
    }

    const handlePlayAgain = () => {
      onReset();
      onResume(); // Ensure the game starts running after reset
    };

    return (
      <div className="game-overlay">
        <div className="game-over-container">
          <h2 style={{ color: COLORS[winner] }}>{winnerText} Wins!</h2>
          <div className="game-over-actions">
            <button className="primary" onClick={handlePlayAgain}>Play Again</button>
            <button onClick={onExitToMenu}>Exit to Menu</button>
          </div>
        </div>
      </div>
    );
  }

  // Display pause menu
  if (isPaused) {
    return (
      <div className="game-overlay">
        <PauseMenu
          onResume={onResume}
          onReset={onReset}
          onExitToMenu={onExitToMenu}
          player1AI={player1AI}
          player2AI={player2AI}
          aiDifficulty={aiDifficulty}
          numAIOpponents={numAIOpponents}
        />
      </div>
    );
  }

  return null;
};

export default GameOverlay; 