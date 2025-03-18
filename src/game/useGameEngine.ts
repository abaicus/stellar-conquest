import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Planet, 
  Fleet, 
  GameState,
  PlanetOwner,
  PlayerType,
  AIDifficulty,
  PlanetLevel 
  // Don't import LastAction from types to avoid conflict
} from './types';
import { 
  initializeGame, 
  createFleet, 
  updateFleetPositions, 
  processFleetArrivals, 
  producePlanets,
  checkGameOver,
  upgradePlanet
} from './gameUtils';
import { makeAiDecision } from './aiUtils';
import { AI_DECISION_INTERVAL, PRODUCTION_INTERVAL } from './constants';

// Define game speed levels
export enum GameSpeed {
  Slow = 0.5,
  Normal = 1,
  Fast = 2
}

// Define last action type
interface LastAction {
  type: 'sendFleet' | 'upgradePlanet';
  sourcePlanetId: string;
  targetPlanetId?: string;
  percentageToSend?: number;
  upgradeLevel?: number;
}

interface GameEngineProps {
  width: number;
  height: number;
  player1AI: boolean;
  player2AI: boolean;
  numAIOpponents: number;
  aiDifficulty?: AIDifficulty;
}

export const useGameEngine = (
  width: number, 
  height: number, 
  player1AI: boolean = false,
  aiDifficulty: AIDifficulty = AIDifficulty.Medium,
  player2AI: boolean = true,
  numAIOpponents: number = 1
) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isRunning, setIsRunning] = useState(true); // Start game automatically
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>(GameSpeed.Normal);
  const gameStateRef = useRef<GameState | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const productionTimerRef = useRef<number>(0);
  const aiTimerRef = useRef<number>(0);
  const pauseGameRef = useRef<() => void>(() => {});
  
  // Keep a ref to the current gameState for use in the redoLastAction function
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  // Initialize the game
  useEffect(() => {
    if (width && height) {
      setGameState(initializeGame(width, height, player1AI, aiDifficulty, player2AI, numAIOpponents));
    }
  }, [width, height, player1AI, player2AI, aiDifficulty, numAIOpponents]);
  
  // Game loop
  useEffect(() => {
    if (!isRunning || !gameState) return;
    
    let animationFrameId: number;
    
    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      
      const deltaTime = (timestamp - lastTimeRef.current) * gameSpeed;
      lastTimeRef.current = timestamp;
      
      // Update fleet positions with improved animation
      const updatedFleets = updateFleetPositions(
        gameState.fleets, 
        gameState.planets, 
        deltaTime
      );
      
      // Process fleet arrivals
      const { fleets: remainingFleets, planets: updatedPlanets } = processFleetArrivals(
        updatedFleets, 
        gameState.planets
      );
      
      // Update production timer
      productionTimerRef.current += deltaTime;
      let planetsAfterProduction = [...updatedPlanets];
      
      if (productionTimerRef.current >= PRODUCTION_INTERVAL) {
        planetsAfterProduction = producePlanets(updatedPlanets);
        productionTimerRef.current = 0;
      }
      
      // Update AI timer and make AI decisions
      // Support up to 3 players (including a potential third AI)
      let aiMoves: Array<{sourcePlanetId: string, targetPlanetId: string, percentageToSend: number} | null> = [null, null, null];
      aiTimerRef.current += deltaTime;
      
      if (aiTimerRef.current >= AI_DECISION_INTERVAL) {
        // Find AI players
        gameState.players.forEach((player, index) => {
          if (player.type === PlayerType.AI) {
            aiMoves[index] = makeAiDecision(gameState, player.id as PlanetOwner);
          }
        });
        
        aiTimerRef.current = 0;
      }
      
      // Check if game is over
      const { gameOver, winner } = checkGameOver(planetsAfterProduction);
      
      // Update game state with AI move if applicable
      setGameState(prevState => {
        if (!prevState) return null;
        
        let updatedPlanets = planetsAfterProduction;
        let updatedFleets = [...remainingFleets];
        
        // Process AI moves for all players
        aiMoves.forEach(aiMove => {
          // Process each AI's move if there is one
          if (aiMove && !gameOver) {
            const { sourcePlanetId, targetPlanetId, percentageToSend } = aiMove;
            const sourcePlanet = updatedPlanets.find(p => p.id === sourcePlanetId);
            const targetPlanet = updatedPlanets.find(p => p.id === targetPlanetId);
            
            if (sourcePlanet && targetPlanet) {
              // Calculate ships to send
              const shipsToSend = Math.floor(sourcePlanet.garrison * percentageToSend);
              
              if (shipsToSend > 0) {
                // Create new fleet
                const newFleet = createFleet(sourcePlanet, targetPlanet, shipsToSend);
                
                // Update source planet garrison
                updatedPlanets = updatedPlanets.map(planet => {
                  if (planet.id === sourcePlanet.id) {
                    return {
                      ...planet,
                      garrison: planet.garrison - shipsToSend
                    };
                  }
                  return planet;
                });
                
                // Add the new fleet
                updatedFleets.push(newFleet);
              }
            }
          }
        });
        
        // If the game is over, pause the game
        if (gameOver) {
          pauseGameRef.current();
        }
        
        return {
          ...prevState,
          planets: updatedPlanets,
          fleets: updatedFleets,
          gameOver,
          winner
        };
      });
      
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, gameState, gameSpeed]);
  
  // Start game
  const startGame = useCallback(() => {
    setIsRunning(true);
    lastTimeRef.current = null;
    productionTimerRef.current = 0;
    aiTimerRef.current = 0;
  }, []);
  
  // Pause the game
  const pauseGame = useCallback(() => {
    setIsRunning(false);
  }, []);
  
  // Store the pauseGame reference for use when the game is over
  pauseGameRef.current = pauseGame;
  
  // Reset the game
  const resetGame = useCallback(() => {
    lastTimeRef.current = null;
    productionTimerRef.current = 0;
    aiTimerRef.current = 0;
    setLastAction(null);
    
    setGameState(initializeGame(
      width, 
      height, 
      player1AI, 
      aiDifficulty, 
      player2AI,
      numAIOpponents
    ));
    setIsRunning(true);
  }, [width, height, player1AI, player2AI, aiDifficulty, numAIOpponents]);
  
  // Toggle the second AI (no longer needed with numAIOpponents)
  const toggleSecondAI = useCallback(() => {
    // This function remains for compatibility but is now a no-op
    console.log("toggleSecondAI is deprecated, use numAIOpponents instead");
  }, []);
  
  // Handle player selecting a planet
  const selectPlanet = useCallback((planetId: string) => {
    if (!gameState) return;
    
    setGameState(prevState => {
      if (!prevState) return null;
      return {
        ...prevState,
        selectedPlanet: planetId
      };
    });
  }, [gameState]);
  
  // Handle player deselecting a planet
  const deselectPlanet = useCallback(() => {
    if (!gameState) return;
    
    setGameState(prevState => {
      if (!prevState) return null;
      return {
        ...prevState,
        selectedPlanet: null
      };
    });
  }, [gameState]);
  
  // Handle player sending ships from selected planet to target planet
  const sendFleet = useCallback((targetPlanetId: string, percentageToSend: number, sourcePlanetId?: string) => {
    if (!gameState) return;
    
    // Use provided sourcePlanetId or the selected planet
    const actualSourcePlanetId = sourcePlanetId || gameState.selectedPlanet;
    if (!actualSourcePlanetId) return;
    
    // Use gameStateRef for the most up-to-date state
    const currentState = gameStateRef.current;
    if (!currentState) return;
    
    const sourcePlanet = currentState.planets.find(p => p.id === actualSourcePlanetId);
    const targetPlanet = currentState.planets.find(p => p.id === targetPlanetId);
    
    if (!sourcePlanet || !targetPlanet || sourcePlanet.id === targetPlanet.id) return;
    
    // Only player-owned planets can send fleets
    if (sourcePlanet.owner === PlanetOwner.Neutral) return;
    
    // Player can only control their own planets
    const humanPlayer = currentState.players.find(p => p.type === PlayerType.Human);
    if (humanPlayer && sourcePlanet.owner !== humanPlayer.id) return;
    
    // Calculate ships to send
    const shipsToSend = Math.floor(sourcePlanet.garrison * percentageToSend);
    
    if (shipsToSend <= 0) return;
    
    // Create new fleet
    const newFleet = createFleet(sourcePlanet, targetPlanet, shipsToSend);
    
    // Save this action for potential redo
    setLastAction({
      type: 'sendFleet',
      sourcePlanetId: sourcePlanet.id,
      targetPlanetId: targetPlanet.id,
      percentageToSend
    });
    
    // Update game state - use a function to ensure we have the latest state
    setGameState(prevState => {
      if (!prevState) return null;
      
      // Get the most recent planets array
      const currentPlanets = prevState.planets;
      
      // Find the current source planet state to ensure correct garrison value
      const currentSourcePlanet = currentPlanets.find(p => p.id === sourcePlanet.id);
      
      // If the planet doesn't exist or has insufficient garrison, abort
      if (!currentSourcePlanet || currentSourcePlanet.garrison < shipsToSend) {
        return prevState; // Return unchanged state
      }
      
      // Update planets with the correct garrison reduction
      const updatedPlanets = currentPlanets.map(planet => {
        if (planet.id === sourcePlanet.id) {
          return {
            ...planet,
            garrison: planet.garrison - shipsToSend
          };
        }
        return planet;
      });
      
      return {
        ...prevState,
        planets: updatedPlanets,
        fleets: [...prevState.fleets, newFleet],
        selectedPlanet: prevState.selectedPlanet // Keep the selected planet
      };
    });
  }, [gameState]);
  
  // Upgrade a planet's level
  const upgradePlanetLevel = useCallback(() => {
    if (!gameState || !gameState.selectedPlanet) return;
    
    const selectedPlanet = gameState.planets.find(p => p.id === gameState.selectedPlanet);
    
    if (!selectedPlanet) return;
    
    // Only player-owned planets can be upgraded
    const humanPlayer = gameState.players.find(p => p.type === PlayerType.Human);
    if (humanPlayer && selectedPlanet.owner !== humanPlayer.id) return;
    
    // Update planets with the upgraded one
    const result = upgradePlanet(selectedPlanet.id, gameState.planets);
    
    if (result.upgraded) {
      // Save this action for potential redo
      setLastAction({
        type: 'upgradePlanet',
        sourcePlanetId: selectedPlanet.id,
        upgradeLevel: (selectedPlanet.level + 1) as PlanetLevel
      });
      
      // Update game state
      setGameState(prevState => {
        if (!prevState) return null;
        return {
          ...prevState,
          planets: result.planets
        };
      });
    }
  }, [gameState]);
  
  // Redo last action
  const redoLastAction = useCallback(() => {
    if (!lastAction) return;
    
    // Use gameStateRef for the current state to avoid closure issues
    const currentGameState = gameStateRef.current;
    if (!currentGameState) return;
    
    if (lastAction.type === 'sendFleet') {
      const { sourcePlanetId, targetPlanetId, percentageToSend } = lastAction;
      
      // Get current planet states
      const sourcePlanet = currentGameState.planets.find(p => p.id === sourcePlanetId);
      const targetPlanet = currentGameState.planets.find(p => p.id === targetPlanetId);
      
      if (!sourcePlanet || !targetPlanet) return;
      
      // Check if source planet is still owned by player
      const humanPlayer = currentGameState.players.find(p => p.type === PlayerType.Human);
      if (!humanPlayer || sourcePlanet.owner !== humanPlayer.id) return;
      
      // Execute the action directly without relying on selection state
      // Calculate ships to send
      const shipsToSend = Math.floor(sourcePlanet.garrison * percentageToSend!);
      
      if (shipsToSend <= 0) return;
      
      // Create new fleet
      const newFleet = createFleet(sourcePlanet, targetPlanet, shipsToSend);
      
      // Update source planet garrison
      const updatedPlanets = currentGameState.planets.map(planet => {
        if (planet.id === sourcePlanet.id) {
          return {
            ...planet,
            garrison: planet.garrison - shipsToSend
          };
        }
        return planet;
      });
      
      // Update game state - never deselect after sending fleet
      setGameState(prevState => {
        if (!prevState) return null;
        return {
          ...prevState,
          planets: updatedPlanets,
          fleets: [...prevState.fleets, newFleet],
          selectedPlanet: prevState.selectedPlanet // Keep the current selection
        };
      });
    } else if (lastAction.type === 'upgradePlanet') {
      const { sourcePlanetId } = lastAction;
      
      // Select the planet first, then upgrade it
      selectPlanet(sourcePlanetId);
      
      // Wait for selection to take effect
      setTimeout(() => {
        upgradePlanetLevel();
      }, 50);
    }
  }, [lastAction, selectPlanet, upgradePlanetLevel]);
  
  // Set AI difficulty
  const setAIDifficulty = useCallback((difficulty: AIDifficulty) => {
    if (!gameState) return;
    
    setGameState(prevState => {
      if (!prevState) return null;
      
      const updatedPlayers = prevState.players.map(player => {
        if (player.type === PlayerType.AI) {
          return {
            ...player,
            aiDifficulty: difficulty
          };
        }
        return player;
      });
      
      return {
        ...prevState,
        players: updatedPlayers
      };
    });
  }, [gameState]);
  
  // Set game speed
  const setSpeed = useCallback((speed: GameSpeed) => {
    setGameSpeed(speed);
  }, []);
  
  return {
    gameState,
    isRunning,
    gameSpeed,
    startGame,
    pauseGame,
    resetGame,
    selectPlanet,
    deselectPlanet,
    sendFleet,
    upgradePlanetLevel,
    redoLastAction,
    setAIDifficulty,
    toggleSecondAI,
    setSpeed
  };
}; 