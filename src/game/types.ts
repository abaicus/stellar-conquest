export enum PlanetSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export enum PlanetLevel {
  One = 1,
  Two = 2,
  Three = 3
}

export const LEVEL_UPGRADE_COSTS = {
  [PlanetLevel.One]: 50, // Cost to upgrade from level 1 to 2
  [PlanetLevel.Two]: 150 // Cost to upgrade from level 2 to 3
};

export enum PlanetOwner {
  Neutral = 'neutral',
  Player1 = 'player1',
  Player2 = 'player2',
  Player3 = 'player3',
}

export enum PlayerType {
  Human = 'human',
  AI = 'ai'
}

export enum AIDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard'
}

export interface Planet {
  id: string;
  x: number;
  y: number;
  size: PlanetSize;
  level: PlanetLevel;
  owner: PlanetOwner;
  garrison: number;
  productionRate: number;
  radius: number;
}

export interface Fleet {
  id: string;
  owner: PlanetOwner;
  ships: Array<{
    x: number;
    y: number;
    angle: number;
    targetX: number;
    targetY: number;
  }>;
  shipCount: number;
  sourcePlanetId: string;
  targetPlanetId: string;
  position: { x: number; y: number };
  direction: { x: number; y: number };
}

export interface Player {
  id: PlanetOwner;
  color: string;
  type: PlayerType;
  aiDifficulty?: AIDifficulty;
}

export interface GameState {
  planets: Planet[];
  fleets: Fleet[];
  players: Player[];
  selectedPlanet: string | null;
  gameOver: boolean;
  winner: PlanetOwner | null;
  secondAI?: boolean;
  numAIOpponents?: number;
}

// Define last action type
export interface LastAction {
  type: 'sendFleet' | 'upgradePlanet';
  sourcePlanetId: string;
  targetPlanetId?: string;
  percentageToSend?: number;
  upgradeLevel?: PlanetLevel;
} 