import React, { useState } from 'react';
import GameCanvas from './components/game-canvas/GameCanvas';
import StartScreen, { GameConfig } from './components/StartScreen';
import './App.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    player1AI: false,
    player2AI: true,
    numAIOpponents: 1,
    aiDifficulty: 'medium'
  });

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config);
    setGameStarted(true);
  };

  const handleExitToMenu = () => {
    setGameStarted(false);
  };

  return (
    <div className="app">
      {gameStarted ? (
        <GameCanvas 
          player1AI={gameConfig.player1AI}
          player2AI={gameConfig.player2AI}
          numAIOpponents={gameConfig.numAIOpponents}
          aiDifficulty={gameConfig.aiDifficulty}
          onExitToMenu={handleExitToMenu}
        />
      ) : (
        <StartScreen onStartGame={handleStartGame} />
      )}
    </div>
  );
}

export default App; 