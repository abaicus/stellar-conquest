import { PlanetOwner, PlanetSize, PlanetLevel } from './types';

export const COLORS = {
  [PlanetOwner.Neutral]: '#888888',
  [PlanetOwner.Player1]: '#3498db',
  [PlanetOwner.Player2]: '#e74c3c',
  [PlanetOwner.Player3]: '#2ecc71',
};

export const PLANET_RADIUS = {
  [PlanetSize.Small]: 20,
  [PlanetSize.Medium]: 30,
  [PlanetSize.Large]: 40,
};

export const BASE_PRODUCTION_RATE = {
  [PlanetSize.Small]: 0.5,
  [PlanetSize.Medium]: 1,
  [PlanetSize.Large]: 1.5,
};

export const LEVEL_PRODUCTION_MULTIPLIER = {
  [PlanetLevel.One]: 1,
  [PlanetLevel.Two]: 3,
  [PlanetLevel.Three]: 6,
};

export const PRODUCTION_INTERVAL = 1000;

export const MAX_GARRISON = 4000;

export const SHIP_SPEED = 0.15;

export const AI_DECISION_INTERVAL = 1500;

export const MIN_PLANETS = 16;
export const MAX_PLANETS = 30;
export const MIN_PLANET_DISTANCE = 100;
export const MAX_PLANET_PLACEMENT_ATTEMPTS = 50;

export const FLEET_SPEED = 112.5; // pixels per second (decreased by 25% from 150)
export const CANVAS_PADDING = 100; // padding from canvas edges 