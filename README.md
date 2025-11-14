# Meditative Idle Defense

A web-first, continuously flowing idle defense experience that explores the balance between calm and chaos. The player's psyche is represented as a luminous center of awareness resisting encroaching stressors.

## Features

- **Continuous Flow**: Seamless wave transitions with no interruptions
- **Three Core Abilities**: All abilities (Breathe, Recenter, and Affirm) are automatic
- **Progressive Difficulty**: Exponential scaling that guarantees challenge by wave 15
- **Procedural Visuals**: Liquid watermedia aesthetics with dynamic color palettes
- **Dynamic Audio**: Harmonic audio that responds to game state
- **Accessibility**: Reduced motion and high contrast modes

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The game will open in your browser at `http://localhost:3000`

### Build

```bash
npm run build
```

## Controls

- **[ / ]** or **- / =**: Decrease/Increase game pace
- **T**: Toggle statistics table
- **Click**: Upgrade abilities when affordable (in the HUD menu)

## Game Systems

- **Serenity**: Your emotional equilibrium (decreases when stressors reach center)
- **Focus**: Energy reserve that regenerates and is spent on abilities
- **Insight**: Temporary currency gained from resolving stressors, spent on upgrades
- **Pace**: Adjustable simulation speed for accessibility

## Testing

Run the test harness to validate game balance:

```bash
# Open game with test parameter
# Or set MODE=test in environment
```

The test harness validates:
- Serenity collapses by wave 15
- No interludes between waves
- Performance targets (58+ FPS)
- Duration within expected range (15-20 minutes at normal pace)

## License

MIT
