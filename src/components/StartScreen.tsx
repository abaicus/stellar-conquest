import React, { useState } from 'react';
import { AIDifficulty } from '../game/types';
import './StartScreen.css';
import { 
  Rocket, 
  Bot, 
  Users, 
  ChevronsRight, 
  Brain, 
  Shield, 
  Zap, 
  Cpu, 
  Orbit
} from 'lucide-react';

interface StartScreenProps {
  onStartGame: (config: GameConfig) => void;
}

export interface GameConfig {
  player1AI: boolean;
  player2AI: boolean;
  numAIOpponents: number;
  aiDifficulty: AIDifficulty;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  const [aiOpponents, setAiOpponents] = useState<number>(1); // Default: 1 AI opponent
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>(AIDifficulty.Medium);

  const handleOpponentsChange = (value: number) => {
    setAiOpponents(value);
  };

  const handleDifficultyChange = (difficulty: AIDifficulty) => {
    setAiDifficulty(difficulty);
  };

  const handleStartGame = () => {
    const config: GameConfig = {
      player1AI: false,
      player2AI: aiOpponents > 0,
      numAIOpponents: aiOpponents,
      aiDifficulty: aiDifficulty
    };
    onStartGame(config);
  };

  return (
    <div className="start-screen">
      <h1 className="title-animation">
        <Orbit className="title-icon" size={36} />
        Stellar Conquest
      </h1>
      <div className="description">
        <p>
          A fast-paced real-time strategy game where you compete to conquer the galaxy.
        </p>
      </div>
      
      <div className="game-options">
        <h2>Game Settings</h2>
        
        <div className="option-section">
          <h3><Bot className="section-icon" size={18} /> AI Opponents</h3>
          <div className="radio-group">
            <label className={aiOpponents === 1 ? 'selected' : ''}>
              <input 
                type="radio" 
                name="aiOpponents" 
                checked={aiOpponents === 1} 
                onChange={() => handleOpponentsChange(1)} 
              />
              <span>1 AI Opponent</span>
            </label>
            
            <label className={aiOpponents === 2 ? 'selected' : ''}>
              <input 
                type="radio" 
                name="aiOpponents" 
                checked={aiOpponents === 2} 
                onChange={() => handleOpponentsChange(2)} 
              />
              <span>2 AI Opponents</span>
            </label>
          </div>
        </div>
        
        <div className="option-section">
          <h3><Brain className="section-icon" size={18} /> AI Difficulty</h3>
          <div className="difficulty-buttons">
            <button 
              className={`difficulty-button ${aiDifficulty === AIDifficulty.Easy ? 'active' : ''}`}
              onClick={() => handleDifficultyChange(AIDifficulty.Easy)}
            >
              Easy
            </button>
            <button 
              className={`difficulty-button ${aiDifficulty === AIDifficulty.Medium ? 'active' : ''}`}
              onClick={() => handleDifficultyChange(AIDifficulty.Medium)}
            >
              Medium
            </button>
            <button 
              className={`difficulty-button ${aiDifficulty === AIDifficulty.Hard ? 'active' : ''}`}
              onClick={() => handleDifficultyChange(AIDifficulty.Hard)}
            >
              Hard
            </button>
          </div>
        </div>
      </div>
      
      <div className="instructions">
        <h2>How to Play</h2>
        <ul>
          <li><strong>Selection:</strong> Left-click on your planets (blue) to select them</li>
          <li><strong>Multi-select:</strong> Click and drag to create a selection box</li>
          <li><strong>Movement:</strong> Right-click on a target planet to send ships</li>
          <li><strong>Fleet size:</strong> Mouse wheel to adjust fleet percentage</li>
          <li><strong>Deselect:</strong> Left-click on empty space to clear selection</li>
        </ul>
        
        <div className="features">
          <h3>Game Objectives</h3>
          <ul>
            <li>Capture neutral planets to expand your territory</li>
            <li>Upgrade planets by selecting them and clicking upgrade</li>
            <li>Attack enemy planets to conquer them</li>
            <li>Win by eliminating all enemy planets</li>
          </ul>
        </div>
      </div>
      
      <button className="start-button" onClick={handleStartGame}>
        <Rocket size={18} />
        Start Game
      </button>
    </div>
  );
};

export default StartScreen; 