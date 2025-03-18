import { v4 as uuidv4 } from 'uuid';
import { 
  Planet, 
  PlanetSize, 
  PlanetOwner, 
  Fleet, 
  GameState,
  Player,
  PlayerType,
  AIDifficulty,
  PlanetLevel,
  LEVEL_UPGRADE_COSTS
} from './types';
import { 
  COLORS,
  PLANET_RADIUS, 
  BASE_PRODUCTION_RATE, 
  MAX_GARRISON,
  SHIP_SPEED,
  FLEET_SPEED,
  MIN_PLANETS,
  MAX_PLANETS,
  CANVAS_PADDING,
  MIN_PLANET_DISTANCE,
  MAX_PLANET_PLACEMENT_ATTEMPTS,
  LEVEL_PRODUCTION_MULTIPLIER
} from './constants';

// Define the Ship type to match what's used in the Fleet interface
interface Ship {
  x: number;
  y: number;
  angle: number;
  targetX: number;
  targetY: number;
}

// Calculate distance between two points
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Check if two planets are overlapping
export const isPlanetOverlapping = (newPlanet: Partial<Planet>, planets: Planet[]): boolean => {
  for (const planet of planets) {
    const minDistance = planet.radius + (newPlanet.radius || 0) + 20; // 20px buffer
    const actualDistance = distance(
      planet.x, 
      planet.y, 
      newPlanet.x || 0, 
      newPlanet.y || 0
    );
    if (actualDistance < minDistance) {
      return true;
    }
  }
  return false;
};

// Generate a random planet
export const generateRandomPlanet = (
  maxWidth: number, 
  maxHeight: number, 
  existingPlanets: Planet[],
  owner: PlanetOwner = PlanetOwner.Neutral
): Planet => {
  // Determine padding from edges
  const padding = 80;
  
  // Try to place the planet without overlapping others
  let attempts = 0;
  
  while (attempts < MAX_PLANET_PLACEMENT_ATTEMPTS) {
    // Random position with padding from edges
    const x = padding + Math.random() * (maxWidth - padding * 2);
    const y = padding + Math.random() * (maxHeight - padding * 2);
    
    // Random size
    const sizes = [PlanetSize.Small, PlanetSize.Medium, PlanetSize.Large];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const radius = PLANET_RADIUS[size];
    
    // Check if this position overlaps with existing planets
    let overlaps = false;
    for (const planet of existingPlanets) {
      const dist = distance(x, y, planet.x, planet.y);
      if (dist < radius + planet.radius + MIN_PLANET_DISTANCE) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      // Calculate production rate based on size and level
      const baseProductionRate = BASE_PRODUCTION_RATE[size];
      const level = PlanetLevel.One; // All planets start at level 1
      const productionRate = baseProductionRate * LEVEL_PRODUCTION_MULTIPLIER[level];
      
      // Random starting garrison for neutral planets
      const garrison = owner === PlanetOwner.Neutral 
        ? Math.floor(Math.random() * 10) + 5 
        : 20;
      
      return {
        id: uuidv4(),
        x,
        y,
        size,
        level,
        owner,
        garrison,
        productionRate,
        radius
      };
    }
    
    attempts++;
  }
  
  throw new Error("Could not place planet after maximum attempts");
};

// Generate a set of planets with minimum distances between them
export const generatePlanets = (
  width: number,
  height: number,
  minPlanets: number,
  maxPlanets: number
): Planet[] => {
  const planets: Planet[] = [];
  
  // Determine total number of planets to create
  const numPlanets = Math.floor(Math.random() * (maxPlanets - minPlanets + 1)) + minPlanets;
  console.log(`Attempting to generate ${numPlanets} planets in canvas size ${width}x${height}`);
  
  // Calculate padding to ensure planets fit within the canvas
  const padding = Math.max(PLANET_RADIUS[PlanetSize.Large] + 10, width * 0.05);
  
  // Create player 1's starting planet in the bottom-left quadrant
  const player1X = padding + Math.random() * (width / 3 - padding * 2);
  const player1Y = height / 2 + Math.random() * (height / 2 - padding * 2);
  
  // Start with equal garrison for balanced gameplay
  const initialPlayerGarrison = 30;
  
  planets.push({
    id: uuidv4(),
    x: player1X,
    y: player1Y,
    size: PlanetSize.Large,
    level: PlanetLevel.One,
    owner: PlanetOwner.Player1,
    garrison: initialPlayerGarrison,
    productionRate: BASE_PRODUCTION_RATE[PlanetSize.Large] * LEVEL_PRODUCTION_MULTIPLIER[PlanetLevel.One],
    radius: PLANET_RADIUS[PlanetSize.Large]
  });
  
  // Create neutral planets - make sure we create at least minPlanets-2 planets (so total planets >= minPlanets)
  const minNeutralPlanets = Math.max(numPlanets - 2, minPlanets - 2);
  let neutralPlanetsCreated = 0;
  
  // Divide the map into quadrants for more even distribution
  const quadrants = [
    { minX: 0, maxX: width/2, minY: 0, maxY: height/2 },          // top-left
    { minX: width/2, maxX: width, minY: 0, maxY: height/2 },      // top-right
    { minX: 0, maxX: width/2, minY: height/2, maxY: height },     // bottom-left
    { minX: width/2, maxX: width, minY: height/2, maxY: height }  // bottom-right
  ];
  
  // First pass: ensure at least 2-3 planets in each quadrant
  for (const quadrant of quadrants) {
    // Skip player 1's quadrant for better initial separation
    if (quadrant.minX === 0 && quadrant.minY === height/2) {
      continue;
    }
    
    if (neutralPlanetsCreated >= minNeutralPlanets) break;
    
    // Place 2-3 planets in each quadrant (more evenly distributed)
    const planetsPerQuadrant = Math.min(
      Math.floor(Math.random() * 2) + 2, // 2-3 planets per quadrant
      minNeutralPlanets - neutralPlanetsCreated
    );
    
    for (let i = 0; i < planetsPerQuadrant; i++) {
      for (let attempt = 0; attempt < 15; attempt++) {
        try {
          // Generate a planet within this quadrant (with padding)
          const x = quadrant.minX + padding + Math.random() * (quadrant.maxX - quadrant.minX - padding * 2);
          const y = quadrant.minY + padding + Math.random() * (quadrant.maxY - quadrant.minY - padding * 2);
          
          // Random size but favor medium planets for balance
          const sizeRoll = Math.random();
          let size;
          if (sizeRoll < 0.3) {
            size = PlanetSize.Small;
          } else if (sizeRoll < 0.8) {
            size = PlanetSize.Medium; // 50% chance for medium
          } else {
            size = PlanetSize.Large;
          }
          
          const radius = PLANET_RADIUS[size];
          
          // Check if this position overlaps with existing planets
          let overlaps = false;
          for (const planet of planets) {
            const dist = distance(x, y, planet.x, planet.y);
            if (dist < radius + planet.radius + MIN_PLANET_DISTANCE) {
              overlaps = true;
              break;
            }
          }
          
          if (!overlaps) {
            const baseProductionRate = BASE_PRODUCTION_RATE[size];
            const level = PlanetLevel.One;
            const productionRate = baseProductionRate * LEVEL_PRODUCTION_MULTIPLIER[level];
            const garrison = Math.floor(Math.random() * 10) + 5;
            
            planets.push({
              id: uuidv4(),
              x,
              y,
              size,
              level,
              owner: PlanetOwner.Neutral,
              garrison,
              productionRate,
              radius
            });
            
            neutralPlanetsCreated++;
            break;
          }
        } catch (e) {
          // Just try again
        }
      }
    }
  }
  
  // Second pass: fill in remaining planets randomly
  const maxAttempts = 150;
  let attempts = 0;
  
  while (neutralPlanetsCreated < minNeutralPlanets && attempts < maxAttempts) {
    try {
      const planet = generateRandomPlanet(width, height, planets);
      planets.push(planet);
      neutralPlanetsCreated++;
    } catch (e) {
      // Continue trying
    }
    attempts++;
  }
  
  console.log(`Successfully generated ${planets.length} planets (${neutralPlanetsCreated} neutral planets)`);
  return planets;
};

// Initialize game state
export const initializeGame = (
  width: number, 
  height: number, 
  player1AI: boolean = false,
  aiDifficulty: AIDifficulty = AIDifficulty.Medium,
  player2AI: boolean = true,
  numAIOpponents: number = 1
): GameState => {
  if (!width || !height || width < 200 || height < 200) {
    console.warn(`Invalid dimensions for game initialization: ${width}x${height}. Using defaults.`);
    width = width || 800;
    height = height || 600;
  }
  
  // Generate planets with minimum distance between them
  const planets = generatePlanets(width, height, MIN_PLANETS, MAX_PLANETS);
  
  // Configure player types based on inputs
  const player1Type = player1AI ? PlayerType.AI : PlayerType.Human;
  const player2Type = player2AI ? PlayerType.AI : PlayerType.Human;
  
  // If we have AI players, assign appropriate planets
  if (player2AI && planets.length > 1) {
    // Set the first planet to Player 1 (human or AI)
    // This is already done in generatePlanets
    
    // Find the farthest planet from player 1's planet for Player 2
    let farthestDistance = 0;
    let farthestPlanetIndex = -1;
    
    for (let i = 1; i < planets.length; i++) {
      const dist = distance(planets[0].x, planets[0].y, planets[i].x, planets[i].y);
      if (dist > farthestDistance) {
        farthestDistance = dist;
        farthestPlanetIndex = i;
      }
    }
    
    // Assign the farthest planet to Player 2
    if (farthestPlanetIndex !== -1) {
      planets[farthestPlanetIndex].owner = PlanetOwner.Player2;
      planets[farthestPlanetIndex].garrison = planets[0].garrison; // Same ships as player 1
    }
    
    // If playing with 2 AI opponents (3 player game), assign another planet to Player3
    if (numAIOpponents > 1 && planets.length > 2) {
      // Find a suitable planet for the third player - one that's far from both Player 1 and 2
      let bestDistanceSum = 0;
      let bestPlanetIndex = -1;
      
      for (let i = 1; i < planets.length; i++) {
        // Skip if already assigned to Player 2
        if (i === farthestPlanetIndex) continue;
        
        // Skip if not neutral
        if (planets[i].owner !== PlanetOwner.Neutral) continue;
        
        // Calculate sum of distances to both Player 1 and Player 2 planets
        const distToPlayer1 = distance(planets[0].x, planets[0].y, planets[i].x, planets[i].y);
        const distToPlayer2 = distance(
          planets[farthestPlanetIndex].x, 
          planets[farthestPlanetIndex].y, 
          planets[i].x, 
          planets[i].y
        );
        
        const distanceSum = distToPlayer1 + distToPlayer2;
        
        // Find the planet with maximum total distance from both players
        if (distanceSum > bestDistanceSum) {
          bestDistanceSum = distanceSum;
          bestPlanetIndex = i;
        }
      }
      
      // Assign the chosen planet to Player3 with a different color
      if (bestPlanetIndex !== -1) {
        planets[bestPlanetIndex].owner = PlanetOwner.Player3;
        planets[bestPlanetIndex].garrison = planets[0].garrison; // Same ships as others
      }
    }
  }
  
  // Set up players based on game configuration
  const players: Player[] = [
    { 
      id: PlanetOwner.Player1, 
      type: player1Type,
      aiDifficulty: player1Type === PlayerType.AI ? aiDifficulty : undefined,
      color: COLORS[PlanetOwner.Player1]
    },
    { 
      id: PlanetOwner.Player2, 
      type: player2Type, 
      aiDifficulty: player2Type === PlayerType.AI ? aiDifficulty : undefined,
      color: COLORS[PlanetOwner.Player2]
    }
  ];
  
  // Add Player3 if we have 2 AI opponents
  if (numAIOpponents > 1) {
    players.push({
      id: PlanetOwner.Player3,
      type: PlayerType.AI,
      aiDifficulty: aiDifficulty,
      color: COLORS[PlanetOwner.Player3]
    });
  }
  
  return {
    planets,
    fleets: [],
    players,
    selectedPlanet: null,
    gameOver: false,
    winner: null,
    numAIOpponents
  };
};

// Create a new fleet
export const createFleet = (
  sourcePlanet: Planet, 
  targetPlanet: Planet, 
  shipCount: number
): Fleet => {
  // Calculate direction vector
  const dx = targetPlanet.x - sourcePlanet.x;
  const dy = targetPlanet.y - sourcePlanet.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize direction vector
  const dirX = dx / dist;
  const dirY = dy / dist;
  
  // Calculate the angle for ships
  const angle = Math.atan2(dy, dx);
  
  // Create ships for the fleet with individual positions
  const ships: Ship[] = [];
  
  // Maximum 20 visible ships, rest are abstracted
  const visibleShips = Math.min(shipCount, 20);
  
  for (let i = 0; i < visibleShips; i++) {
    // Create a formation effect by adding some random offset
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = (Math.random() - 0.5) * 20;
    
    ships.push({
      x: sourcePlanet.x + offsetX,
      y: sourcePlanet.y + offsetY,
      targetX: targetPlanet.x,
      targetY: targetPlanet.y,
      angle
    });
  }
  
  return {
    id: uuidv4(),
    owner: sourcePlanet.owner,
    ships,
    shipCount,
    sourcePlanetId: sourcePlanet.id,
    targetPlanetId: targetPlanet.id,
    position: {
      x: sourcePlanet.x,
      y: sourcePlanet.y
    },
    direction: {
      x: dirX,
      y: dirY
    }
  };
};

// Update fleet positions
export const updateFleetPositions = (
  fleets: Fleet[], 
  planets: Planet[], 
  deltaTime: number
): Fleet[] => {
  return fleets.map(fleet => {
    // Update ships individually for smoother animation
    const updatedShips = fleet.ships.map(ship => {
      // Move ship towards target
      const dx = ship.targetX - ship.x;
      const dy = ship.targetY - ship.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // If ship is very close to target, snap to it
      if (dist < 2) {
        return {
          ...ship,
          x: ship.targetX,
          y: ship.targetY
        };
      }
      
      // Otherwise move towards target
      const dirX = dx / dist;
      const dirY = dy / dist;
      
      // Update angle for smooth rotation
      const targetAngle = Math.atan2(dy, dx);
      let angle = ship.angle;
      
      // Smooth rotation
      const angleDiff = targetAngle - angle;
      const angleDiffNormalized = 
        angleDiff > Math.PI ? angleDiff - 2 * Math.PI :
        angleDiff < -Math.PI ? angleDiff + 2 * Math.PI :
        angleDiff;
      
      angle += angleDiffNormalized * 0.1; // Smooth rotation
      
      return {
        ...ship,
        x: ship.x + dirX * FLEET_SPEED / 1000 * deltaTime,
        y: ship.y + dirY * FLEET_SPEED / 1000 * deltaTime,
        angle
      };
    });
    
    // Update fleet center position (average of all ships)
    const totalX = updatedShips.reduce((sum, ship) => sum + ship.x, 0);
    const totalY = updatedShips.reduce((sum, ship) => sum + ship.y, 0);
    
    return {
      ...fleet,
      ships: updatedShips,
      position: {
        x: totalX / updatedShips.length,
        y: totalY / updatedShips.length
      }
    };
  });
};

// Process fleet arrivals
export const processFleetArrivals = (
  fleets: Fleet[], 
  planets: Planet[]
): { fleets: Fleet[], planets: Planet[] } => {
  const remainingFleets: Fleet[] = [];
  let updatedPlanets = [...planets];
  
  for (const fleet of fleets) {
    const targetPlanet = planets.find(p => p.id === fleet.targetPlanetId);
    
    if (!targetPlanet) {
      remainingFleets.push(fleet);
      continue;
    }
    
    // Check if the fleet has arrived (first ship has reached the target)
    const firstShip = fleet.ships[0];
    if (!firstShip) {
      // This shouldn't happen, but just in case
      remainingFleets.push(fleet);
      continue;
    }
    
    const distToTarget = distance(
      firstShip.x, 
      firstShip.y, 
      targetPlanet.x, 
      targetPlanet.y
    );
    
    if (distToTarget <= targetPlanet.radius) {
      // Fleet has arrived, process it
      updatedPlanets = processFleetArrival(fleet, updatedPlanets);
    } else {
      remainingFleets.push(fleet);
    }
  }
  
  return { fleets: remainingFleets, planets: updatedPlanets };
};

// Process a single fleet's arrival
const processFleetArrival = (fleet: Fleet, planets: Planet[]): Planet[] => {
  const targetPlanet = planets.find(p => p.id === fleet.targetPlanetId);
  
  if (!targetPlanet) return planets;
  
  // If the planet is owned by the same player, reinforce it
  if (targetPlanet.owner === fleet.owner) {
    return planets.map(planet => {
      if (planet.id === targetPlanet.id) {
        return {
          ...planet,
          garrison: planet.garrison + fleet.shipCount
        };
      }
      return planet;
    });
  }
  
  // Otherwise, attack the planet
  const attackingForce = fleet.shipCount;
  const defendingForce = targetPlanet.garrison;
  
  // Combat logic is simple: 1:1 attrition
  const remainingAttackers = Math.max(0, attackingForce - defendingForce);
  const remainingDefenders = Math.max(0, defendingForce - attackingForce);
  
  // If attackers won, they take the planet
  if (remainingAttackers > 0) {
    return planets.map(planet => {
      if (planet.id === targetPlanet.id) {
        return {
          ...planet,
          owner: fleet.owner,
          garrison: remainingAttackers
        };
      }
      return planet;
    });
  }
  
  // If defenders won, they keep the planet with remaining forces
  return planets.map(planet => {
    if (planet.id === targetPlanet.id) {
      return {
        ...planet,
        garrison: remainingDefenders
      };
    }
    return planet;
  });
};

// Produce new ships on planets
export const producePlanets = (planets: Planet[]): Planet[] => {
  return planets.map(planet => {
    // Only owned planets produce ships
    if (planet.owner === PlanetOwner.Neutral) {
      return planet;
    }
    
    // Calculate production based on size and level
    const production = planet.productionRate;
    
    // Apply production (round to nearest integer)
    const newGarrison = Math.min(
      MAX_GARRISON, 
      planet.garrison + Math.round(production)
    );
    
    return {
      ...planet,
      garrison: newGarrison
    };
  });
};

// Upgrade a planet's level
export const upgradePlanet = (
  planetId: string, 
  planets: Planet[]
): { planets: Planet[], upgraded: boolean } => {
  let upgraded = false;
  
  const updatedPlanets = planets.map(planet => {
    if (planet.id === planetId) {
      // Only upgrade if not already at max level
      if (planet.level < PlanetLevel.Three) {
        const currentLevel = planet.level;
        
        // Get the upgrade cost based on current level
        let upgradeCost = 50; // Default for level 1->2
        if (currentLevel === PlanetLevel.Two) {
          upgradeCost = 150; // Cost for level 2->3
        }
        
        // Check if planet has enough garrison to upgrade
        if (planet.garrison >= upgradeCost) {
          const newLevel = planet.level + 1 as PlanetLevel;
          const baseProductionRate = BASE_PRODUCTION_RATE[planet.size];
          const newProductionRate = baseProductionRate * LEVEL_PRODUCTION_MULTIPLIER[newLevel];
          
          upgraded = true;
          
          return {
            ...planet,
            level: newLevel,
            productionRate: newProductionRate,
            garrison: planet.garrison - upgradeCost
          };
        }
      }
    }
    return planet;
  });
  
  return { planets: updatedPlanets, upgraded };
};

// Check if the game is over
export const checkGameOver = (planets: Planet[]): { gameOver: boolean, winner: PlanetOwner | null } => {
  // Get all unique owners of planets (excluding neutral)
  const owners = new Set<PlanetOwner>();
  
  planets.forEach(planet => {
    if (planet.owner !== PlanetOwner.Neutral) {
      owners.add(planet.owner);
    }
  });
  
  // If there's only one owner (or none, which shouldn't happen), the game is over
  if (owners.size === 1) {
    const winner = owners.values().next().value as PlanetOwner;
    return { gameOver: true, winner };
  }
  
  // If there are no owners (all planets are neutral), the game is a draw
  if (owners.size === 0) {
    return { gameOver: true, winner: null };
  }
  
  // Otherwise, the game continues
  return { gameOver: false, winner: null };
}; 