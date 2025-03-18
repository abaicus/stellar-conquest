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
      const baseColor = planet.owner === PlanetOwner.Neutral 
        ? COLORS[PlanetOwner.Neutral] 
        : COLORS[planet.owner];
      
      // Use planet ID as seed for deterministic features
      const seed = parseInt(planet.id.replace(/\D/g, ''), 10) || 0;
      
      // Determine planet type based on seed
      const planetTypes = ['rocky', 'gas', 'ice', 'lava'];
      const planetType = planetTypes[seed % planetTypes.length];
      
      // Draw base planet
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
      
      // Create planet-specific gradients and features
      if (planetType === 'gas') {
        // Gas giant with horizontal bands
        const gradient = ctx.createLinearGradient(
          planet.x - planet.radius, 
          planet.y - planet.radius, 
          planet.x - planet.radius, 
          planet.y + planet.radius
        );
        
        // Create color bands
        const bandCount = 5;
        for (let i = 0; i <= bandCount; i++) {
          const pos = i / bandCount;
          gradient.addColorStop(
            pos, 
            i % 2 === 0 
              ? lightenColor(baseColor, 15) 
              : darkenColor(baseColor, 15)
          );
        }
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add swirl detail
        const swirlCount = 3 + (seed % 3);
        for (let i = 0; i < swirlCount; i++) {
          const swirlY = planet.y - planet.radius/2 + (planet.radius * i / swirlCount);
          const swirlSize = planet.radius * (0.3 + (i * 0.1));
          
          ctx.fillStyle = lightenColor(baseColor, 25, 0.5);
          ctx.beginPath();
          ctx.ellipse(
            planet.x + (i % 2 === 0 ? 1 : -1) * planet.radius/3,
            swirlY,
            swirlSize,
            planet.radius/6,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      } 
      else if (planetType === 'rocky') {
        // Rocky planet with craters
        ctx.fillStyle = baseColor;
        ctx.fill();
        
        // Add surface texture
        const craterCount = 5 + (seed % 5);
        
        for (let i = 0; i < craterCount; i++) {
          // Ensure craters are within planet bounds
          const angle = (seed * i * 100) % 360 * Math.PI / 180;
          const distance = (planet.radius * 0.7) * ((seed + i * 13) % 100) / 100;
          const craterX = planet.x + Math.cos(angle) * distance;
          const craterY = planet.y + Math.sin(angle) * distance;
          const craterSize = planet.radius * (0.05 + ((seed + i) % 10) / 100);
          
          // Create crater
          ctx.fillStyle = darkenColor(baseColor, 20);
          ctx.beginPath();
          ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Add crater rim highlight
          ctx.fillStyle = lightenColor(baseColor, 10);
          ctx.beginPath();
          ctx.arc(
            craterX - craterSize/5, 
            craterY - craterSize/5, 
            craterSize * 0.8, 
            0, 
            Math.PI * 2
          );
          ctx.fill();
        }
      }
      else if (planetType === 'ice') {
        // Ice planet with blue-white coloring
        const iceColor = planet.owner === PlanetOwner.Neutral 
          ? '#a8c8e0' 
          : lightenColor(baseColor, 40);
          
        // Create ice planet gradient
        const gradient = ctx.createRadialGradient(
          planet.x - planet.radius/3, 
          planet.y - planet.radius/3,
          0,
          planet.x, 
          planet.y, 
          planet.radius
        );
        
        gradient.addColorStop(0, lightenColor(iceColor, 30));
        gradient.addColorStop(0.7, iceColor);
        gradient.addColorStop(1, darkenColor(iceColor, 10));
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add ice cracks
        ctx.strokeStyle = lightenColor(iceColor, 50, 0.6);
        ctx.lineWidth = 1;
        
        const crackCount = 3 + (seed % 3);
        for (let i = 0; i < crackCount; i++) {
          const startAngle = (seed * i * 50) % 360 * Math.PI / 180;
          const angleSpan = (20 + (seed * i) % 40) * Math.PI / 180;
          
          ctx.beginPath();
          ctx.arc(
            planet.x, 
            planet.y, 
            planet.radius * 0.4 + (planet.radius * 0.5 * i / crackCount), 
            startAngle, 
            startAngle + angleSpan
          );
          ctx.stroke();
        }
      }
      else if (planetType === 'lava') {
        // Lava planet with orange-red coloring
        const lavaBaseColor = planet.owner === PlanetOwner.Neutral 
          ? '#d73c08' 
          : darkenColor(baseColor, 10);
        
        // Create lava planet gradient
        const gradient = ctx.createRadialGradient(
          planet.x - planet.radius/3, 
          planet.y - planet.radius/3,
          0,
          planet.x, 
          planet.y, 
          planet.radius
        );
        
        gradient.addColorStop(0, lightenColor(lavaBaseColor, 30));
        gradient.addColorStop(0.7, lavaBaseColor);
        gradient.addColorStop(1, darkenColor(lavaBaseColor, 20));
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add lava flow patterns
        const flowCount = 4 + (seed % 4);
        for (let i = 0; i < flowCount; i++) {
          ctx.fillStyle = lightenColor(lavaBaseColor, 40, 0.7);
          
          const startAngle = (seed * i * 70) % 360 * Math.PI / 180;
          const angleSpan = (30 + (seed * i) % 50) * Math.PI / 180;
          
          ctx.beginPath();
          ctx.arc(
            planet.x, 
            planet.y, 
            planet.radius * 0.7, 
            startAngle, 
            startAngle + angleSpan
          );
          ctx.arc(
            planet.x, 
            planet.y, 
            planet.radius * 0.3, 
            startAngle + angleSpan, 
            startAngle, 
            true
          );
          ctx.closePath();
          ctx.fill();
        }
      }
      
      // Add subtle atmosphere glow that stays within bounds of max planet radius
      const glowRadius = planet.radius * 1.15;
      const glow = ctx.createRadialGradient(
        planet.x, 
        planet.y, 
        planet.radius * 0.8,
        planet.x, 
        planet.y, 
        glowRadius
      );
      
      glow.addColorStop(0, 'rgba(255, 255, 255, 0)');
      glow.addColorStop(1, `rgba(${planet.owner === PlanetOwner.Neutral ? '255, 255, 255' : '200, 200, 255'}, 0.3)`);
      
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw level rings around the planet (1-3 rings based on level)
      for (let i = 0; i < planet.level; i++) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Each ring is spaced slightly farther out
        ctx.arc(planet.x, planet.y, planet.radius + 4 + (i * 6), 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw garrison count with better visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw garrison count
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(planet.garrison.toString(), planet.x, planet.y);
      
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
      
      // Draw production rate info below the planet
      if (planet.owner !== PlanetOwner.Neutral) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        
        // Place further down to avoid level outlines
        ctx.fillText(`+${planet.productionRate.toFixed(1)}/s`, planet.x, planet.y + planet.radius + (planet.level * 4) + 20 );
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
  }, [gameState, hoveredPlanet, fleetPercentage, showPercentage, upgradeEffect, COLORS, PlanetOwner, selectedPlanets, selectionBox, isSelecting]);
};

// Add these utility functions at the end of the file
// Helper functions to manipulate colors
function lightenColor(color: string, percent: number, alpha?: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const amount = Math.round(2.55 * percent);
  const newR = Math.min(255, r + amount);
  const newG = Math.min(255, g + amount);
  const newB = Math.min(255, b + amount);
  
  const alphaValue = alpha !== undefined ? alpha : 1;
  
  if (alpha !== undefined) {
    return `rgba(${newR}, ${newG}, ${newB}, ${alphaValue})`;
  }
  
  return `#${(newR).toString(16).padStart(2, '0')}${
    (newG).toString(16).padStart(2, '0')}${
    (newB).toString(16).padStart(2, '0')}`;
}

function darkenColor(color: string, percent: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const amount = Math.round(2.55 * percent);
  const newR = Math.max(0, r - amount);
  const newG = Math.max(0, g - amount);
  const newB = Math.max(0, b - amount);
  
  return `#${(newR).toString(16).padStart(2, '0')}${
    (newG).toString(16).padStart(2, '0')}${
    (newB).toString(16).padStart(2, '0')}`;
} 