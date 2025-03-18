import { useEffect, useCallback } from 'react';
import { GameState, PlanetOwner, PlayerType } from '../../game/types';

interface UseCanvasEventsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  gameState: GameState | null;
  isPaused: boolean;
  fleetPercentage: number;
  lastClickTime: React.RefObject<number>;
  DOUBLE_CLICK_THRESHOLD: number;
  hoveredPlanet: string | null;
  setHoveredPlanet: (planetId: string | null) => void;
  setUpgradeEffect: (effect: { planetId: string; time: number } | null) => void;
  selectPlanet: (planetId: string) => void;
  deselectPlanet: () => void;
  sendFleet: (targetPlanetId: string, percentageToSend: number, sourcePlanetId?: string) => void;
  redoLastAction: () => void;
  upgradePlanetLevel: () => void;
  selectedPlanets: string[];
  setSelectedPlanets: (planetIds: string[]) => void;
  selectionBox: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  setSelectionBox: (box: { start: { x: number; y: number }; end: { x: number; y: number } } | null) => void;
  isSelecting: boolean;
  setIsSelecting: (isSelecting: boolean) => void;
  setFleetPercentage: (value: number | ((prev: number) => number)) => void;
}

export const useCanvasEvents = ({
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
}: UseCanvasEventsProps) => {
  // Track mouse position for hover effects
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
    
    // Update selection box if actively selecting
    if (isSelecting && selectionBox) {
      setSelectionBox({
        start: selectionBox.start,
        end: { x, y }
      });
    }
  }, [canvasRef, gameState, isSelecting, selectionBox, setHoveredPlanet, setSelectionBox]);

  // Handle mouse down events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameState || isPaused) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Left mouse button (select)
    if (e.button === 0) {
      // Check if clicking on the upgrade button of a selected planet
      if (selectedPlanets.length === 1) {
        const selectedPlanet = gameState.planets.find(p => p.id === selectedPlanets[0]);
        
        if (selectedPlanet && 
            selectedPlanet.owner !== PlanetOwner.Neutral && 
            selectedPlanet.level < 3 &&
            gameState.players.find(p => p.type === PlayerType.Human && p.id === selectedPlanet.owner)) {
          
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
      const humanPlayer = gameState.players.find(p => p.type === PlayerType.Human);
      
      if (!humanPlayer) return;
      
      for (const planet of gameState.planets) {
        const distance = Math.sqrt(Math.pow(planet.x - x, 2) + Math.pow(planet.y - y, 2));
        
        if (distance <= planet.radius) {
          clickedOnPlanet = true;
          
          // If the planet belongs to the player, select it
          if (planet.owner === humanPlayer.id) {
            if (e.shiftKey) {
              // If holding shift, add/remove from selection
              if (selectedPlanets.includes(planet.id)) {
                setSelectedPlanets(selectedPlanets.filter(id => id !== planet.id));
              } else {
                setSelectedPlanets([...selectedPlanets, planet.id]);
              }
            } else {
              // Regular click - select only this planet
              selectPlanet(planet.id);
              setSelectedPlanets([planet.id]);
            }
          }
          break;
        }
      }
      
      // If clicked on empty space, start selection box or deselect
      if (!clickedOnPlanet) {
        if (e.shiftKey) {
          // If shift is held, start a selection box without clearing current selection
          setSelectionBox({
            start: { x, y },
            end: { x, y }
          });
          setIsSelecting(true);
        } else {
          // Clear selection if clicking on empty space
          deselectPlanet();
          setSelectedPlanets([]);
          
          // Start selection box
          setSelectionBox({
            start: { x, y },
            end: { x, y }
          });
          setIsSelecting(true);
        }
      }
    }
    
    // Right mouse button (send fleet / action)
    else if (e.button === 2) {
      const now = Date.now();
      
      // Check if it's a double-right-click on background
      if (now - lastClickTime.current < DOUBLE_CLICK_THRESHOLD) {
        // Check if clicked on empty space
        let clickedOnPlanet = false;
        
        for (const planet of gameState.planets) {
          const distance = Math.sqrt(Math.pow(planet.x - x, 2) + Math.pow(planet.y - y, 2));
          
          if (distance <= planet.radius) {
            clickedOnPlanet = true;
            break;
          }
        }
        
        if (!clickedOnPlanet) {
          // Double right-click on empty space - redo last action
          redoLastAction();
          lastClickTime.current = 0; // Reset to prevent triple-click
          return;
        }
      }
      
      // Check if right-clicking on a planet
      for (const planet of gameState.planets) {
        const distance = Math.sqrt(Math.pow(planet.x - x, 2) + Math.pow(planet.y - y, 2));
        
        if (distance <= planet.radius) {
          // If we have planets selected, send fleets from them to this target
          if (selectedPlanets.length > 0) {
            for (const selectedPlanetId of selectedPlanets) {
              const sourcePlanet = gameState.planets.find(p => p.id === selectedPlanetId);
              
              // Don't send fleet to itself and ensure source is valid
              if (sourcePlanet && 
                  sourcePlanet.id !== planet.id && 
                  sourcePlanet.owner !== PlanetOwner.Neutral) {
                sendFleet(planet.id, fleetPercentage, sourcePlanet.id);
              }
            }
          }
          break;
        }
      }
      
      lastClickTime.current = now;
    }
  }, [canvasRef, gameState, isPaused, selectedPlanets, fleetPercentage, lastClickTime, DOUBLE_CLICK_THRESHOLD, selectPlanet, deselectPlanet, sendFleet, redoLastAction, upgradePlanetLevel, setSelectedPlanets, setSelectionBox, setIsSelecting, setUpgradeEffect]);

  // Handle mouse up events
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !gameState) return;
    
    // Finish selection box if we were selecting
    if (isSelecting && selectionBox) {
      // Calculate selection box bounds
      const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
      const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
      const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
      const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);
      
      // Only process if box is large enough (to distinguish from clicks)
      if (maxX - minX > 5 || maxY - minY > 5) {
        const humanPlayer = gameState.players.find(p => p.type === PlayerType.Human);
        if (!humanPlayer) return;
        
        // Find player planets in the selection box
        const newSelectedPlanets = gameState.planets
          .filter(planet => 
            // Only select player's planets
            planet.owner === humanPlayer.id &&
            // Check if planet is within selection box
            planet.x >= minX && planet.x <= maxX && 
            planet.y >= minY && planet.y <= maxY
          )
          .map(planet => planet.id);
        
        // Update selection
        if (e.shiftKey) {
          // If shift key, add to existing selection
          setSelectedPlanets(prevSelected => {
            const combined = [...prevSelected];
            newSelectedPlanets.forEach(id => {
              if (!combined.includes(id)) {
                combined.push(id);
              }
            });
            return combined;
          });
        } else {
          // Replace selection
          setSelectedPlanets(newSelectedPlanets);
          
          // Update the game engine's selected planet (select first one)
          if (newSelectedPlanets.length > 0) {
            selectPlanet(newSelectedPlanets[0]);
          } else {
            deselectPlanet();
          }
        }
      }
    }
    
    // Reset selection state
    setIsSelecting(false);
    setSelectionBox(null);
  }, [canvasRef, gameState, isSelecting, selectionBox, selectPlanet, deselectPlanet, setSelectedPlanets, setIsSelecting, setSelectionBox]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoveredPlanet(null);
    
    // Cancel any in-progress selection
    setIsSelecting(false);
    setSelectionBox(null);
  }, [setHoveredPlanet, setIsSelecting, setSelectionBox]);

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Mouse wheel handler for fleet percentage
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Adjust fleet percentage based on scroll direction
      setFleetPercentage((prev: number) => {
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
  }, [canvasRef, setFleetPercentage]);

  return {
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    handleContextMenu
  };
}; 
