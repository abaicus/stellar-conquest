import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameEngine } from '../game/useGameEngine';
import { PlanetOwner, AIDifficulty } from '../game/types';
import { COLORS } from '../game/constants';
import GameInfo from './GameInfo';
import PlanetInfo from './PlanetInfo';
import GameOverlay from './GameOverlay';
import './GameCanvas.css';

interface GameCanvasProps {
  player1AI: boolean;
  player2AI: boolean;
  numAIOpponents: number;
  aiDifficulty: AIDifficulty;
  onExitToMenu: () => void;
}

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
  const [dragStart, setDragStart] = useState<{ x: number; y: number; planetId: string } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [fleetPercentage, setFleetPercentage] = useState(0.5); // Default to 50%
  const [isPaused, setIsPaused] = useState(false); // Pause menu state
  const [showPercentage, setShowPercentage] = useState(false); // Show percentage temporarily
  const [upgradeEffect, setUpgradeEffect] = useState<{planetId: string, time: number} | null>(null);
  const showPercentageTimer = useRef<number | null>(null);
  const lastClickTime = useRef<number>(0);
  const DOUBLE_CLICK_THRESHOLD = 300; // ms
  
  const { 
    gameState, 
    isRunning, 
    startGame, 
    pauseGame, 
    resetGame, 
    selectPlanet, 
    sendFleet,
    deselectPlanet,
    redoLastAction,
    upgradePlanetLevel
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
  
  // Show percentage temporarily when it changes
  useEffect(() => {
    if (showPercentageTimer.current) {
      window.clearTimeout(showPercentageTimer.current);
    }
    
    setShowPercentage(true);
    showPercentageTimer.current = window.setTimeout(() => {
      setShowPercentage(false);
    }, 1500); // Show for 1.5 seconds
    
    return () => {
      if (showPercentageTimer.current) {
        window.clearTimeout(showPercentageTimer.current);
      }
    };
  }, [fleetPercentage]);
  
  // Render game with smoother animations
  useEffect(() => {
    if (!canvasRef.current || !gameState) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw planets
    gameState.planets.forEach(planet => {
      // Planet circle
      ctx.fillStyle = planet.owner === PlanetOwner.Neutral 
        ? COLORS[PlanetOwner.Neutral] 
        : COLORS[planet.owner];
      
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw level rings around the planet (1-3 rings based on level)
      for (let i = 0; i < planet.level; i++) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Each ring is spaced slightly farther out
        ctx.arc(planet.x, planet.y, planet.radius + 3 + (i * 4), 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw upgrade effect animation if this planet was just upgraded
      if (upgradeEffect && upgradeEffect.planetId === planet.id) {
        const elapsed = Date.now() - upgradeEffect.time;
        const duration = 1000; // 1 second animation
        
        if (elapsed < duration) {
          // Calculate animation progress (0 to 1)
          const progress = elapsed / duration;
          
          // Draw expanding circle
          const maxRadius = planet.radius * 2.5;
          const currentRadius = planet.radius + (maxRadius - planet.radius) * progress;
          
          // Make it fade out as it expands
          const alpha = 1 - progress;
          
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(planet.x, planet.y, currentRadius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Add some sparkles
          const sparkleCount = 8;
          ctx.fillStyle = `rgba(255, 255, 150, ${alpha})`;
          
          for (let i = 0; i < sparkleCount; i++) {
            const angle = (Math.PI * 2 / sparkleCount) * i + progress * Math.PI;
            const distance = currentRadius * 0.8;
            const sparkleX = planet.x + Math.cos(angle) * distance;
            const sparkleY = planet.y + Math.sin(angle) * distance;
            const sparkleSize = 3 + Math.sin(progress * Math.PI * 3) * 2;
            
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Effect is done, remove it
          setUpgradeEffect(null);
        }
      }
      
      // Highlight selected planet
      if (gameState.selectedPlanet === planet.id) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius + (planet.level * 4) + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw ship count selector over selected planet
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(planet.x, planet.y - planet.radius - 15, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Calculate ships to send
        const shipsToSend = Math.floor(planet.garrison * fleetPercentage);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${shipsToSend}`, planet.x, planet.y - planet.radius - 15);
        
        // Draw upgrade button if player owns the planet and it's not at max level
        if (planet.owner !== PlanetOwner.Neutral && 
            planet.level < 3 &&
            gameState.players.find(p => p.type === 'human' && p.id === planet.owner)) {
          
          // Position upgrade button to the right of the planet
          const buttonX = planet.x + planet.radius + 20;
          const buttonY = planet.y;
          const buttonRadius = 15;
          
          // Check if planet has enough ships to upgrade
          const upgradeCost = planet.level === 1 ? 50 : 150;
          const canUpgrade = planet.garrison >= upgradeCost;
          
          // Draw upgrade button
          ctx.fillStyle = canUpgrade ? 'rgba(39, 174, 96, 0.8)' : 'rgba(150, 150, 150, 0.8)';
          ctx.beginPath();
          ctx.arc(buttonX, buttonY, buttonRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw upgrade icon (up arrow)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(buttonX, buttonY + 5);
          ctx.lineTo(buttonX, buttonY - 5);
          ctx.lineTo(buttonX - 4, buttonY - 1);
          ctx.moveTo(buttonX, buttonY - 5);
          ctx.lineTo(buttonX + 4, buttonY - 1);
          ctx.stroke();
          
          // Show upgrade cost
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${upgradeCost}`, buttonX, buttonY + buttonRadius + 12);
        }
      }
      
      // Highlight hovered planet
      if (hoveredPlanet === planet.id) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw garrison count
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(planet.garrison.toString(), planet.x, planet.y + 5);
      
      // Draw production rate info below the planet
      if (planet.owner !== PlanetOwner.Neutral) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        // Place further down to avoid level outlines
        ctx.fillText(`+${planet.productionRate.toFixed(1)}/s`, planet.x, planet.y + planet.radius + (planet.level * 4) + 12);
      }
    });
    
    // Draw fleets (multiple ships)
    gameState.fleets.forEach(fleet => {
      ctx.fillStyle = COLORS[fleet.owner];
      
      // Draw individual ships in the fleet
      fleet.ships.forEach(ship => {
        const size = 4; // Base ship size
        
        ctx.save();
        ctx.translate(ship.x, ship.y);
        
        // Rotate to face direction of travel
        ctx.rotate(ship.angle);
        
        // Draw triangle for each ship
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size / 2, -size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      });
      
      // Display total ship count above the fleet center
      if (fleet.shipCount > 5) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(fleet.shipCount.toString(), fleet.position.x, fleet.position.y - 12);
      }
    });
    
    // Draw drag line if dragging
    if (dragStart && dragEnd) {
      const startPlanet = gameState.planets.find(p => p.id === dragStart.planetId);
      
      if (startPlanet && startPlanet.owner !== PlanetOwner.Neutral) {
        ctx.strokeStyle = COLORS[startPlanet.owner];
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]); // Dashed line for better visibility
        ctx.beginPath();
        ctx.moveTo(startPlanet.x, startPlanet.y);
        ctx.lineTo(dragEnd.x, dragEnd.y);
        ctx.stroke();
        ctx.setLineDash([]);  // Reset to solid line
        
        // Draw ship count to be sent
        const shipsToSend = Math.floor(startPlanet.garrison * fleetPercentage);
        
        if (shipsToSend > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          
          const midX = (startPlanet.x + dragEnd.x) / 2;
          const midY = (startPlanet.y + dragEnd.y) / 2;
          
          // Add a background for better readability
          const text = `${shipsToSend} ships`;
          const textWidth = ctx.measureText(text).width;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(midX - textWidth / 2 - 5, midY - 20, textWidth + 10, 20);
          
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, midX, midY - 5);
        }
      }
    }
    
    // Show percentage when changed
    if (showPercentage) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 60, 100, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(fleetPercentage * 100)}%`, 20, 75);
    }
    
    // Draw game over text if game is over
    if (gameState.gameOver && gameState.winner) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = COLORS[gameState.winner];
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let winner;
      if (gameState.winner === PlanetOwner.Player1) {
        winner = "Player 1";
      } else if (gameState.winner === PlanetOwner.Player2) {
        winner = "Player 2";
      } else if (gameState.winner === PlanetOwner.Player3) {
        winner = "Player 3";
      } else {
        winner = "Unknown Player";
      }
      
      ctx.fillText(`${winner} Wins!`, canvas.width / 2, canvas.height / 2);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Press Reset to play again', canvas.width / 2, canvas.height / 2 + 60);
    }
  }, [gameState, hoveredPlanet, dragStart, dragEnd, fleetPercentage, showPercentage, upgradeEffect]);
  
  // Mouse event handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameState) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if mouse is over a planet
    let found = false;
    
    for (const planet of gameState.planets) {
      const distance = Math.sqrt(Math.pow(planet.x - x, 2) + Math.pow(planet.y - y, 2));
      
      if (distance <= planet.radius) {
        setHoveredPlanet(planet.id);
        found = true;
        break;
      }
    }
    
    if (!found) {
      setHoveredPlanet(null);
    }
    
    // Update drag end position if dragging
    if (dragStart) {
      setDragEnd({ x, y });
    }
  }, [gameState, dragStart]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameState || isPaused) return;
    
    // Right-click to deselect
    if (e.button === 2) {
      deselectPlanet();
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    
    const now = Date.now();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on the upgrade button of a selected planet
    if (gameState.selectedPlanet) {
      const selectedPlanet = gameState.planets.find(p => p.id === gameState.selectedPlanet);
      
      if (selectedPlanet && 
          selectedPlanet.owner !== PlanetOwner.Neutral && 
          selectedPlanet.level < 3 &&
          gameState.players.find(p => p.type === 'human' && p.id === selectedPlanet.owner)) {
        
        // Position of upgrade button
        const buttonX = selectedPlanet.x + selectedPlanet.radius + 20;
        const buttonY = selectedPlanet.y;
        const buttonRadius = 15;
        
        // Check if click is within the upgrade button
        const distToButton = Math.sqrt(Math.pow(buttonX - x, 2) + Math.pow(buttonY - y, 2));
        
        if (distToButton <= buttonRadius) {
          // Get current garrison
          const upgradeCost = selectedPlanet.level === 1 ? 50 : 150;
          
          // Only show effect if planet has enough ships to upgrade
          if (selectedPlanet.garrison >= upgradeCost) {
            // Set upgrade effect for this planet
            setUpgradeEffect({
              planetId: selectedPlanet.id,
              time: Date.now()
            });
          }
          
          // Attempt to upgrade the planet 
          upgradePlanetLevel();
          return;
        }
      }
    }
    
    // Check if clicking on a planet
    let clickedOnPlanet = false;
    
    for (const planet of gameState.planets) {
      const distance = Math.sqrt(Math.pow(planet.x - x, 2) + Math.pow(planet.y - y, 2));
      
      if (distance <= planet.radius) {
        clickedOnPlanet = true;
        const humanPlayer = gameState.players.find(p => p.type === 'human');
        
        // If there's already a selected planet and we click on a different planet, send fleet
        if (gameState.selectedPlanet && gameState.selectedPlanet !== planet.id) {
          const sourcePlanet = gameState.planets.find(p => p.id === gameState.selectedPlanet);
          
          if (sourcePlanet && 
              sourcePlanet.owner !== PlanetOwner.Neutral && 
              humanPlayer && 
              sourcePlanet.owner === humanPlayer.id) {
            sendFleet(planet.id, fleetPercentage);
          }
        } 
        // If clicking on the already selected planet, deselect it
        else if (gameState.selectedPlanet === planet.id) {
          deselectPlanet();
        }
        // Otherwise, select the planet if it's the player's or neutral
        else if (planet.owner === PlanetOwner.Neutral || 
                (humanPlayer && planet.owner === humanPlayer.id)) {
          selectPlanet(planet.id);
          
          // Start drag if planet is owned by player
          if (planet.owner !== PlanetOwner.Neutral) {
            setDragStart({ x: planet.x, y: planet.y, planetId: planet.id });
            setDragEnd({ x, y });
          }
        }
        
        break;
      }
    }
    
    // If clicking on empty space...
    if (!clickedOnPlanet) {
      // Check for double-click to redo last action
      if (now - lastClickTime.current < DOUBLE_CLICK_THRESHOLD) {
        redoLastAction();
      } else {
        // Single click on empty space, deselect current planet
        if (gameState.selectedPlanet) {
          deselectPlanet();
        }
      }
    }
    
    lastClickTime.current = now;
  }, [gameState, selectPlanet, deselectPlanet, sendFleet, fleetPercentage, isPaused, redoLastAction, upgradePlanetLevel]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameState || !dragStart) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if releasing over a planet
    for (const planet of gameState.planets) {
      const distance = Math.sqrt(Math.pow(planet.x - x, 2) + Math.pow(planet.y - y, 2));
      
      if (distance <= planet.radius) {
        // Send fleet from dragStart planet to this planet
        sendFleet(planet.id, fleetPercentage);
        break;
      }
    }
    
    // Reset drag
    setDragStart(null);
    setDragEnd(null);
  }, [gameState, dragStart, sendFleet, fleetPercentage]);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredPlanet(null);
    setDragStart(null);
    setDragEnd(null);
  }, []);
  
  // Mouse wheel handler
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Add wheel event with options
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Adjust fleet percentage based on scroll direction
      setFleetPercentage(prev => {
        // Calculate new percentage in increments of 5%
        const direction = e.deltaY < 0 ? 1 : -1; // Positive for scrolling up, negative for down
        const step = 0.05; // 5% increments
        
        const newValue = Math.max(0.05, Math.min(1, prev + direction * step));
        // Round to nearest 5%
        return Math.round(newValue * 20) / 20;
      });
    };
    
    const canvas = canvasRef.current;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [canvasRef]);
  
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the context menu from appearing
  }, []);
  
  return (
    <div className="game-container" ref={containerRef}>
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