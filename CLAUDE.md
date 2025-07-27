# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Local Development Server:**
- `npm run dev` or `npm start` - Starts Python HTTP server on port 8000
- Open http://localhost:8000 in browser to play the game

**Dependencies:**
- `npm install` - Installs Phaser.js 3.80.1 (only dependency)

## Project Architecture

**Technology Stack:**
- HTML5 Canvas game built with Phaser.js 3.80.1
- Vanilla JavaScript (no build tools or transpilation)
- CSS for responsive layout and styling
- CDN-loaded Phaser library

**Game Structure:**
- `index.html` - Main entry point with responsive styling and script loading order
- `js/main.js` - Game initialization with responsive canvas sizing (`KatanaNinja` class)
- Scene-based architecture with three main scenes:
  - `MenuScene` - Start screen
  - `GameScene` - Main gameplay logic
  - `GameOverScene` - End screen with score display

**Core Systems:**
- **Input Management** (`js/utils/InputManager.js`) - Handles mouse/touch slice interactions
- **Physics** - Phaser Arcade Physics with gravity for fruit/bomb trajectories
- **Collision Detection** - Custom line-to-rectangle intersection for slice mechanics
- **State Management** - Scene transitions with score/high score persistence in localStorage

**Game Mechanics:**
- Fruit slicing with combo system and particle effects
- Bomb avoidance (instant game over)
- Progressive difficulty (spawn rate increases every 10 seconds)
- Lives system (lose life when fruit falls off screen)

**Responsive Design:**
- Dynamic canvas sizing based on viewport
- Mobile-first responsive breakpoints
- Touch and mouse input support
- Orientation change handling

**Script Loading Order (Critical):**
1. Phaser.js (CDN)
2. InputManager utility
3. Scene classes (Menu, Game, GameOver)
4. Main game initialization

The codebase uses a component-based approach with clear separation between game logic, input handling, and UI management. All assets are referenced as sprite keys but actual asset loading code is not visible in the current files.

## Project Memories

### Mobile Development

● Mobile Game Viewport Fix - Project Memory

  The original mobile display issues were caused by conflicting CSS and Phaser scaling logic that prevented proper
  full-screen display. The core problem was flexbox centering (display: flex; justify-content: center; align-items:
   center;) on the body element, which created unwanted vertical empty space by centering the canvas within the
  viewport instead of filling it edge-to-edge.

  The solution required five critical changes: First, enhanced viewport meta tags including viewport-fit=cover for
  edge-to-edge display on devices with notches, along with PWA-ready meta tags for full-screen mobile experience.
  Second, eliminating flexbox centering by changing body to display: block. Third, implementing absolute
  positioning on the game container with position: absolute; top: 0; left: 0; to force it to start at viewport
  origin. Fourth, overriding Phaser's canvas sizing using CSS with position: absolute; width: 100vw !important;
  height: 100vh !important; to force true full-screen coverage. Fifth, configuring Phaser scale mode to
  Phaser.Scale.RESIZE with autoCenter: Phaser.Scale.NO_CENTER to prevent automatic centering.

  The key breakthrough was understanding that modern mobile games need explicit viewport control rather than
  responsive web design patterns. The combination of absolute positioning, viewport units (100vw/100vh), and CSS
  overrides with !important gives complete control over canvas display. This approach ensures the game fills every
  pixel of available screen space across all devices and orientations. Never mix CSS layout centering with
  full-screen game canvases - use absolute positioning and viewport units instead for true full-screen mobile game
  experiences.

### AI Development Guidelines

● Never start a bash/http or Python server without explicit permission, as this wastes tokens and can cause unnecessary computational overhead.