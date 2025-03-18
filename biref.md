# Stellar Conquest: A Real-Time Strategy Game

## Game Overview
Stellar Conquest is a fast-paced real-time strategy game where players compete to conquer a galaxy by capturing planets and deploying fleets. The game focuses on quick decision-making, resource management, and territorial control.

## Core Mechanics

### Planets
- Each planet has three key attributes:
  - Size (small, medium, large) determines maximum garrison capacity
  - Production rate determines how quickly it generates new ships
  - Current garrison count shows available ships for deployment
- Neutral planets (gray) start with randomized garrisons
- Player-controlled planets (color-coded by player) continuously produce new ships

### Ships & Fleets
- Ships are the basic unit of combat and conquest
- Players create fleets by selecting a source planet and dragging to a target planet
- Fleet size can be adjusted (25%, 50%, 75%, or 100% of source planet's garrison)
- Fleets travel at constant speed across space
- Travel time depends on distance between planets

### Combat
- When a fleet reaches a planet:
  - If the planet belongs to the same player, ships are added to the garrison
  - If the planet is neutral or enemy-controlled, ships attack the garrison
  - Each attacking and defending ship has equal strength (1:1 elimination)
  - If attackers eliminate all defenders, the planet changes ownership

## Game Flow
1. Game starts with randomly generated map of 15-30 planets
2. Each player begins with one large planet; remaining planets are neutral
3. Players simultaneously send fleets to capture neutral planets and attack opponents
4. Victory achieved when a player controls all planets or all opponents are eliminated

## Visual Style
- Simple, clean 2D graphics with minimalist design
- Planets represented as circles with size indicating planet class
- Ships represented as small triangles moving in formations
- Color-coding to clearly distinguish ownership (Player 1: Blue, Player 2: Red, etc.)

## UI Elements
- Planet information display (size, production rate, garrison) on hover
- Fleet controls (adjustable deployment percentage)
- Minimap showing overall territory control
- Simple stats panel (planets owned, total ships, production rate)

## Optional Features
- Special planet types with unique properties (fortress planets, production boosters)
- Wormholes that create shortcuts across the map
- Fog of war that reveals only areas around controlled planets
- Multiple victory conditions (time limit, specific conquest targets)
- Power-ups that temporarily boost production or ship speed

## Technical Requirements
- 2D rendering with simple physics for movement
- Pathfinding for ship movement
- AI opponents with adjustable difficulty levels
- Touch/mouse input handling for fleet deployment