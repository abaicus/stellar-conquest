import { GameState, Planet, PlanetOwner, Fleet, AIDifficulty } from './types';
import { distance } from './gameUtils';

// Evaluate the strength of a player
const evaluatePlayerStrength = (
  gameState: GameState,
  playerOwner: PlanetOwner
): number => {
  const playerPlanets = gameState.planets.filter(p => p.owner === playerOwner);
  const playerFleets = gameState.fleets.filter(f => f.owner === playerOwner);
  
  // Calculate total garrison
  const totalGarrison = playerPlanets.reduce((sum, planet) => sum + planet.garrison, 0);
  
  // Calculate total ships in fleets
  const totalFleetShips = playerFleets.reduce((sum, fleet) => sum + fleet.shipCount, 0);
  
  // Calculate total production rate
  const totalProduction = playerPlanets.reduce((sum, planet) => sum + planet.productionRate, 0);
  
  // Weight factors
  const GARRISON_WEIGHT = 1;
  const FLEET_WEIGHT = 1;
  const PRODUCTION_WEIGHT = 5;
  const PLANET_COUNT_WEIGHT = 10;
  
  // Calculate strength score
  const strengthScore = 
    totalGarrison * GARRISON_WEIGHT +
    totalFleetShips * FLEET_WEIGHT +
    totalProduction * PRODUCTION_WEIGHT +
    playerPlanets.length * PLANET_COUNT_WEIGHT;
  
  return strengthScore;
};

// Calculate attack value for a target planet
const calculateAttackValue = (
  sourcePlanet: Planet,
  targetPlanet: Planet,
  gameState: GameState
): number => {
  // Distance factor: closer planets are more valuable targets
  const dist = distance(sourcePlanet.x, sourcePlanet.y, targetPlanet.x, targetPlanet.y);
  const distanceFactor = 1000 / (dist + 10); // Prevent division by zero
  
  // Garrison factor: weaker planets are easier to conquer
  const garrisonFactor = targetPlanet.garrison > 0 
    ? sourcePlanet.garrison / targetPlanet.garrison 
    : 10; // High value if target has no defense
  
  // Production factor: higher production planets are more valuable
  const productionFactor = targetPlanet.productionRate * 10;
  
  // Calculate incoming friendly fleets to this target
  const incomingFriendlyFleets = gameState.fleets.filter(
    f => f.targetPlanetId === targetPlanet.id && f.owner === sourcePlanet.owner
  );
  const incomingFriendlyShips = incomingFriendlyFleets.reduce(
    (sum, fleet) => sum + fleet.shipCount, 0
  );
  
  // Calculate incoming enemy fleets to this target
  const incomingEnemyFleets = gameState.fleets.filter(
    f => f.targetPlanetId === targetPlanet.id && f.owner !== sourcePlanet.owner
  );
  const incomingEnemyShips = incomingEnemyFleets.reduce(
    (sum, fleet) => sum + fleet.shipCount, 0
  );
  
  // Adjust garrison factor based on incoming fleets
  const adjustedDefense = targetPlanet.garrison + incomingEnemyShips - incomingFriendlyShips;
  const adjustedGarrisonFactor = adjustedDefense > 0 
    ? sourcePlanet.garrison / adjustedDefense 
    : 10;
  
  // Calculate total attack value
  let attackValue = distanceFactor * adjustedGarrisonFactor * productionFactor;
  
  // Adjust attack value based on planet ownership
  if (targetPlanet.owner === PlanetOwner.Neutral) {
    // Neutral planets are high priority, especially if they have high production
    attackValue *= 1.5;
  } else if (targetPlanet.owner === sourcePlanet.owner) {
    // Own planets are only valuable for reinforcement if they're under threat
    const isUnderThreat = incomingEnemyShips > (targetPlanet.garrison + incomingFriendlyShips);
    attackValue = isUnderThreat ? attackValue * 0.8 : 0;
  }
  
  // Check if there are already fleets en route to this target
  const existingFleets = gameState.fleets.filter(
    f => f.targetPlanetId === targetPlanet.id && f.owner === sourcePlanet.owner
  ).length > 0;
  
  if (existingFleets) {
    attackValue *= 0.5; // Reduce attack value if fleets already sent
  }
  
  // Check if there are enemy fleets heading to this target
  const enemyFleets = gameState.fleets.filter(
    f => f.targetPlanetId === targetPlanet.id && f.owner !== sourcePlanet.owner
  ).length > 0;
  
  if (enemyFleets) {
    attackValue *= 1.5; // Increase attack value if we need to defend
  }
  
  return attackValue;
};

// Find best attack move for AI
export const findBestAttackMove = (
  gameState: GameState,
  aiOwner: PlanetOwner
): { sourcePlanet: Planet, targetPlanet: Planet, percentageToSend: number } | null => {
  const aiPlanets = gameState.planets.filter(p => p.owner === aiOwner);
  
  // If AI has no planets, return null
  if (aiPlanets.length === 0) return null;
  
  let bestMove = null;
  let bestMoveValue = -1;
  
  // For each AI planet, evaluate potential targets
  for (const sourcePlanet of aiPlanets) {
    // Skip planets with few ships
    if (sourcePlanet.garrison < 5) continue;
    
    // Evaluate all other planets as potential targets
    for (const targetPlanet of gameState.planets) {
      // Skip if source and target are the same
      if (sourcePlanet.id === targetPlanet.id) continue;
      
      const attackValue = calculateAttackValue(sourcePlanet, targetPlanet, gameState);
      
      if (attackValue > bestMoveValue) {
        // Determine percentage of ships to send based on the situation
        let percentageToSend = 0.5; // Default to 50%
        
        if (targetPlanet.owner !== aiOwner) {
          // Attacking enemy or neutral: send enough to win plus a margin
          const neededShips = targetPlanet.garrison * 1.2; // 20% margin
          percentageToSend = Math.min(neededShips / sourcePlanet.garrison, 0.9);
          
          // If we need more than 90%, just send 90%
          percentageToSend = Math.max(percentageToSend, 0.5); // At least 50%
        } else {
          // Reinforcing: send a smaller percentage
          percentageToSend = 0.3;
        }
        
        bestMove = {
          sourcePlanet,
          targetPlanet,
          percentageToSend
        };
        bestMoveValue = attackValue;
      }
    }
  }
  
  return bestMove;
};

interface AiDecision {
  sourcePlanetId: string;
  targetPlanetId: string;
  percentageToSend: number;
}

// AI difficulty modifiers
const DIFFICULTY_SETTINGS = {
  [AIDifficulty.Easy]: {
    decisionQuality: 0.3, // Lower means worse decisions
    aggressiveness: 0.3,  // Lower means less aggressive
    reinforceChance: 0.2, // Chance to reinforce its planets
    minPercentageToSend: 0.3,
    maxPercentageToSend: 0.6
  },
  [AIDifficulty.Medium]: {
    decisionQuality: 0.6,
    aggressiveness: 0.6,
    reinforceChance: 0.4,
    minPercentageToSend: 0.4,
    maxPercentageToSend: 0.8
  },
  [AIDifficulty.Hard]: {
    decisionQuality: 0.9,
    aggressiveness: 0.9,
    reinforceChance: 0.6,
    minPercentageToSend: 0.5,
    maxPercentageToSend: 1.0
  }
};

// Default to medium if no difficulty is specified
const DEFAULT_DIFFICULTY = AIDifficulty.Medium;

export const makeAiDecision = (gameState: GameState, aiPlayerId: PlanetOwner): AiDecision | null => {
  const { planets } = gameState;
  
  // Get AI difficulty level
  const aiPlayer = gameState.players.find(p => p.id === aiPlayerId);
  const difficulty = aiPlayer?.aiDifficulty || DEFAULT_DIFFICULTY;
  const settings = DIFFICULTY_SETTINGS[difficulty];
  
  // Get AI-owned planets
  const aiPlanets = planets.filter(planet => planet.owner === aiPlayerId);
  
  // No planets, no decision
  if (aiPlanets.length === 0) return null;
  
  // Get potential target planets (enemy and neutral)
  const targetPlanets = planets.filter(planet => planet.owner !== aiPlayerId);
  
  // No targets available
  if (targetPlanets.length === 0) return null;
  
  // Chance for AI to reinforce its own planets based on difficulty
  const shouldReinforce = Math.random() < settings.reinforceChance && aiPlanets.length > 1;
  
  let potentialTargets = shouldReinforce ? [...targetPlanets, ...aiPlanets] : targetPlanets;
  
  // Select a source planet (prefer ones with more garrison)
  const sortedSourcePlanets = [...aiPlanets].sort((a, b) => b.garrison - a.garrison);
  
  // Hard and medium difficulties are more likely to choose strongest planets
  // Easy difficulty sometimes chooses suboptimal planets
  let sourcePlanetIndex = 0;
  if (Math.random() > settings.decisionQuality) {
    sourcePlanetIndex = Math.floor(Math.random() * Math.min(3, sortedSourcePlanets.length));
  }
  
  const sourcePlanet = sortedSourcePlanets[sourcePlanetIndex];
  
  // No source planet with sufficient garrison
  if (sourcePlanet.garrison <= 1) return null;
  
  // Find best target based on difficulty
  let targetPlanet;
  
  // Higher difficulty AI is more strategic
  if (Math.random() < settings.decisionQuality) {
    // Calculate scores for each target planet
    const scoredTargets = potentialTargets.map(target => {
      // Distance factor - closer is better
      const dx = target.x - sourcePlanet.x;
      const dy = target.y - sourcePlanet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const distanceFactor = 1 / (distance + 1);
      
      // Garrison factor - lower is better for conquering
      const garrisonFactor = 1 / (target.garrison + 1);
      
      // Ownership factor - AI planets get lower priority 
      // except when reinforcing weaker planets
      const ownershipFactor = target.owner === aiPlayerId
        ? (shouldReinforce && target.garrison < sourcePlanet.garrison / 2 ? 1.5 : 0.1)
        : (target.owner === PlanetOwner.Neutral ? 1.0 : settings.aggressiveness * 2);
      
      // Final score
      return {
        planet: target,
        score: distanceFactor * garrisonFactor * ownershipFactor
      };
    });
    
    // Sort by score and select the best option
    scoredTargets.sort((a, b) => b.score - a.score);
    targetPlanet = scoredTargets[0].planet;
  } else {
    // Lower difficulty AI sometimes makes random choices
    targetPlanet = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
  }
  
  // Don't target self
  if (targetPlanet.id === sourcePlanet.id) {
    // Try next best target if available
    const otherTargets = potentialTargets.filter(p => p.id !== sourcePlanet.id);
    if (otherTargets.length === 0) return null;
    targetPlanet = otherTargets[Math.floor(Math.random() * otherTargets.length)];
  }
  
  // Decide how many ships to send based on difficulty
  let percentageToSend;
  
  // Higher difficulty AI sends a more appropriate amount
  if (Math.random() < settings.decisionQuality) {
    // If targeting enemy planet, send more ships
    if (targetPlanet.owner !== aiPlayerId && targetPlanet.owner !== PlanetOwner.Neutral) {
      percentageToSend = Math.min(settings.maxPercentageToSend, 
        Math.max(settings.minPercentageToSend, (targetPlanet.garrison + 5) / sourcePlanet.garrison));
    } 
    // If targeting neutral planet, send enough to capture it
    else if (targetPlanet.owner === PlanetOwner.Neutral) {
      percentageToSend = Math.min(settings.maxPercentageToSend, 
        Math.max(settings.minPercentageToSend, (targetPlanet.garrison + 2) / sourcePlanet.garrison));
    }
    // If reinforcing own planet, send a smaller percentage
    else {
      percentageToSend = Math.min(0.5, Math.max(0.2, (targetPlanet.garrison * 0.5) / sourcePlanet.garrison));
    }
  } else {
    // Lower quality decisions just send a random percentage
    percentageToSend = settings.minPercentageToSend + 
      Math.random() * (settings.maxPercentageToSend - settings.minPercentageToSend);
  }
  
  // Ensure we keep at least one ship on the source planet
  const maxPercentage = (sourcePlanet.garrison - 1) / sourcePlanet.garrison;
  percentageToSend = Math.min(percentageToSend, maxPercentage);
  
  return {
    sourcePlanetId: sourcePlanet.id,
    targetPlanetId: targetPlanet.id,
    percentageToSend
  };
}; 