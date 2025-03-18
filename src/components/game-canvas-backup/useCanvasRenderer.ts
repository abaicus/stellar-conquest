import { useEffect } from 'react';
import { GameState, PlanetOwner } from '../../game/types';
import { COLORS } from '../../game/constants';

interface UseCanvasRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  gameState: GameState | null;
  hoveredPlanet: string | null;
  fleetPercentage: number;
  showPercentage: boolean;
  upgradeEffect: { planetId: string; time: number } | null;
  COLORS: typeof COLORS;
  PlanetOwner: typeof PlanetOwner;
  selectedPlanets: string[];
  selectionBox: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  isSelecting: boolean;
}

export const useCanvasRenderer = ({
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
}: UseCanvasRendererProps) => {
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
        }
      }
      
      // Highlight selected planets
      if (selectedPlanets.includes(planet.id)) {
        // Draw selection outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius + (planet.level * 4) + 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw selection indicator
        const segmentCount = 8;
        ctx.strokeStyle = '#55aaff';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < segmentCount; i++) {
          const startAngle = (Math.PI * 2 / segmentCount) * i;
          const endAngle = startAngle + (Math.PI * 2 / segmentCount) * 0.6;
          
          ctx.beginPath();
          ctx.arc(planet.x, planet.y, planet.radius + (planet.level * 4) + 9, startAngle, endAngle);
          ctx.stroke();
        }
        
        // Draw ship count indicator over selected planet
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
            gameState.players.find(p => p.type === 'human' && p.id === planet.owner) &&
            selectedPlanets.length === 1) {
          
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
    
    // Draw selection box if selecting
    if (isSelecting && selectionBox) {
      const width = selectionBox.end.x - selectionBox.start.x;
      const height = selectionBox.end.y - selectionBox.start.y;
      
      // Draw semi-transparent fill
      ctx.fillStyle = 'rgba(85, 170, 255, 0.2)';
      ctx.fillRect(selectionBox.start.x, selectionBox.start.y, width, height);
      
      // Draw border
      ctx.strokeStyle = 'rgba(85, 170, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(selectionBox.start.x, selectionBox.start.y, width, height);
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
  }, [gameState, hoveredPlanet, fleetPercentage, showPercentage, upgradeEffect, COLORS, PlanetOwner, selectedPlanets, selectionBox, isSelecting]);
}; 