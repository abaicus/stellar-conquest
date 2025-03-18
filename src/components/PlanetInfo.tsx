import React from 'react';
import { Planet, PlanetOwner, PlanetSize } from '../game/types';
import { COLORS } from '../game/constants';
import { Globe, Shield, Zap, ArrowUp, Users, Activity } from 'lucide-react';
import './PlanetInfo.css';

interface PlanetInfoProps {
  planet: Planet;
}

const MAX_GARRISON = {
  [PlanetSize.Small]: 1000,
  [PlanetSize.Medium]: 2000,
  [PlanetSize.Large]: 4000,
};

const PlanetInfo: React.FC<PlanetInfoProps> = ({ planet }) => {
  const getOwnerName = (owner: PlanetOwner): string => {
    switch(owner) {
      case PlanetOwner.Neutral: return 'Neutral';
      case PlanetOwner.Player1: return 'Player 1';
      case PlanetOwner.Player2: return 'Player 2';
      case PlanetOwner.Player3: return 'Player 3';
      default: return 'Unknown';
    }
  };
  
  const sizeText = planet.size.charAt(0).toUpperCase() + planet.size.slice(1);
  
  return (
    <div className="planet-info">
      <div className="planet-info-header" style={{ backgroundColor: COLORS[planet.owner] }}>
        <h3>
          <Users size={14} strokeWidth={2.5} className="icon" />
          {getOwnerName(planet.owner)} Planet
        </h3>
        <span>
          <Globe size={12} strokeWidth={2.5} className="icon" />
          {sizeText}
        </span>
      </div>
      <div className="planet-info-content">
        <div className="info-row">
          <span>
            <Shield size={14} strokeWidth={2.5} className="icon" />
            Garrison:
          </span>
          <span>{planet.garrison} / {MAX_GARRISON[planet.size]}</span>
        </div>
        <div className="info-row">
          <span>
            <Zap size={14} strokeWidth={2.5} className="icon" />
            Production:
          </span>
          <span>{planet.productionRate} ships/s</span>
        </div>
        <div className="info-row">
          <span>
            <Activity size={14} strokeWidth={2.5} className="icon" />
            Level:
          </span>
          <span>
            {planet.level}
            {planet.level < 3 && (
              <ArrowUp size={12} strokeWidth={2.5} className="level-up-icon" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlanetInfo; 