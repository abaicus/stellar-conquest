import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameEngine } from '../../game/useGameEngine';
import { PlanetOwner, AIDifficulty } from '../../game/types';
import { COLORS } from '../../game/constants';
import GameInfo from '../GameInfo';
import PlanetInfo from '../PlanetInfo';
import GameOverlay from '../GameOverlay';
import { useCanvasRenderer } from './useCanvasRenderer';
import { useCanvasEvents } from './useCanvasEvents';
import { GameSpeed } from '../../game/useGameEngine';
import './GameCanvas.css';

interface GameCanvasProps {
  player1AI: boolean;
  player2AI: boolean;
  numAIOpponents: number;
  aiDifficulty: AIDifficulty;
  onExitToMenu: () => void;
}

// Star background component
const StarryBackground: React.FC = () => {
  const [stars, setStars] = useState<React.ReactNode[]>([]);
  const [meteors, setMeteors] = useState<React.ReactNode[]>([]);
  
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      const count = Math.max(window.innerWidth, window.innerHeight) / 3;
      
      for (let i = 0; i < count; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random();
        const duration = 3 + Math.random() * 7;
        const delay = Math.random() * 5;
        const opacity = 0.3 + Math.random() * 0.7;
        
        let sizeClass = 'small';
        if (size > 0.7) {
          sizeClass = 'medium';
        } else if (size > 0.9) {
          sizeClass = 'large';
        }
        
        newStars.push(
          <div 
            key={i} 
            className={`stars ${sizeClass}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${delay}s`,
              '--duration': `${duration}s`,
              '--opacity': opacity
            } as React.CSSProperties}
          />
        );
      }
      
      setStars(newStars);
    };

    const generateMeteors = () => {
      const newMeteors = [];
      const meteorCount = 8; // Number of meteors
      
      for (let i = 0; i < meteorCount; i++) {
        const startX = Math.random() * 80;
        const startY = Math.random() * 30;
        const speed = 3 + Math.random() * 7;
        const delay = Math.random() * 15;
        const distance = 100 + Math.random() * 200;
        
        newMeteors.push(
          <div 
            key={i} 
            className="meteor"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              '--speed': `${speed}s`,
              '--delay': `${delay}s`,
              '--distance': distance
            } as React.CSSProperties}
          />
        );
      }
      
      setMeteors(newMeteors);
    };
    
    generateStars();
    generateMeteors();
    
    const handleResize = () => {
      generateStars();
      generateMeteors();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className="starry-background">
      {stars}
      {meteors}
    </div>
  );
};

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  player1AI, 
  player2AI, 
  numAIOpponents,
  aiDifficulty,
  onExitToMenu
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [fleetPercentage, setFleetPercentage] = useState(0.5);
  const [isPaused, setIsPaused] = useState(false);
  const [showPercentage, setShowPercentage] = useState(false);
  const [upgradeEffect, setUpgradeEffect] = useState<{planetId: string, time: number} | null>(null);
  const showPercentageTimer = useRef<number | null>(null);
  const lastClickTime = useRef<number>(0);
  const DOUBLE_CLICK_THRESHOLD = 300;
  
  // Selection state
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  const { 
    gameState, 
    isRunning, 
    gameSpeed,
    startGame, 
    pauseGame, 
    resetGame, 
    selectPlanet, 
    sendFleet,
    deselectPlanet,
    redoLastAction,
    upgradePlanetLevel,
    setSpeed
  } = useGameEngine(
    dimensions.width, 
    dimensions.height, 
    player1AI, 
    aiDifficulty, 
    player2AI,
    numAIOpponents
  );

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Toggle pause menu
  const togglePause = useCallback(() => {
    if (isPaused) {
      startGame();
    } else {
      pauseGame();
    }
    setIsPaused(!isPaused);
  }, [isPaused, startGame, pauseGame]);

  // Show percentage temporarily when it changes (removed, now always visible)
  useEffect(() => {
    // We'll keep this effect for animation purposes but will not hide the percentage
    if (showPercentageTimer.current) {
      window.clearTimeout(showPercentageTimer.current);
    }
    
    setShowPercentage(true);
    
    return () => {
      if (showPercentageTimer.current) {
        window.clearTimeout(showPercentageTimer.current);
      }
    };
  }, [fleetPercentage]);

  // Use the canvas renderer hook
  useCanvasRenderer({
    canvasRef,
    gameState,
    hoveredPlanet,
    fleetPercentage,
    showPercentage,
    upgradeEffect,
    COLORS,
    PlanetOwner,
    selectedPlanets,
    selectionBox,
    isSelecting
  });

  // Use the canvas events hook
  const {
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    handleContextMenu
  } = useCanvasEvents({
    canvasRef,
    gameState,
    isPaused,
    fleetPercentage,
    lastClickTime,
    DOUBLE_CLICK_THRESHOLD,
    hoveredPlanet,
    setHoveredPlanet,
    setUpgradeEffect,
    selectPlanet,
    deselectPlanet,
    sendFleet,
    redoLastAction,
    upgradePlanetLevel,
    selectedPlanets,
    setSelectedPlanets,
    selectionBox,
    setSelectionBox,
    isSelecting,
    setIsSelecting,
    setFleetPercentage
  });

  return (
    <div className="game-container" ref={containerRef}>
      <StarryBackground />
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      />
      
      {gameState && (
        <GameInfo 
          planets={gameState.planets} 
          fleets={gameState.fleets}
          isRunning={isRunning}
          onStart={startGame}
          onPause={togglePause}
          onReset={resetGame}
          fleetPercentage={fleetPercentage}
          gameSpeed={gameSpeed}
          onSetSpeed={setSpeed}
        />
      )}
      
      {hoveredPlanet && gameState && (
        <PlanetInfo 
          planet={gameState.planets.find(p => p.id === hoveredPlanet)!} 
        />
      )}
      
      {gameState && (
        <GameOverlay
          isVisible={isPaused || gameState.gameOver}
          isPaused={isPaused && !gameState.gameOver}
          gameOver={gameState.gameOver}
          winner={gameState.winner}
          onResume={togglePause}
          onReset={resetGame}
          onExitToMenu={onExitToMenu}
          player1AI={player1AI}
          player2AI={player2AI}
          aiDifficulty={aiDifficulty}
          numAIOpponents={numAIOpponents}
        />
      )}
    </div>
  );
};

export default GameCanvas; 