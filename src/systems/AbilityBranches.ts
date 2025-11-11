import { AbilityBranch } from '../types';

export const AbilityBranchConfig: Record<string, Record<number, AbilityBranch[]>> = {
  breathe: {
    3: [
      {
        id: 'breathe_focused',
        name: 'Focused',
        description: '+50% damage, -20% radius',
        effects: [
          { type: 'damage', modifier: 1.5, description: '+50% damage' },
          { type: 'radius', modifier: 0.8, description: '-20% radius' }
        ]
      },
      {
        id: 'breathe_expansive',
        name: 'Expansive',
        description: '+30% radius, -15% damage',
        effects: [
          { type: 'radius', modifier: 1.3, description: '+30% radius' },
          { type: 'damage', modifier: 0.85, description: '-15% damage' }
        ]
      },
      {
        id: 'breathe_balanced',
        name: 'Balanced',
        description: '+20% damage, +15% radius',
        effects: [
          { type: 'damage', modifier: 1.2, description: '+20% damage' },
          { type: 'radius', modifier: 1.15, description: '+15% radius' }
        ]
      }
    ],
    6: [
      {
        id: 'breathe_penetrating',
        name: 'Penetrating',
        description: 'Ignores 30% stressor resistance',
        effects: [
          { type: 'special', modifier: 0.3, description: 'Ignores 30% stressor resistance' }
        ]
      },
      {
        id: 'breathe_lingering',
        name: 'Lingering',
        description: 'Damage persists 2s after leaving aura',
        effects: [
          { type: 'duration', modifier: 2, description: 'Damage persists 2s after leaving aura' }
        ]
      },
      {
        id: 'breathe_rhythmic',
        name: 'Rhythmic',
        description: 'Pulses every 1s for 150% damage',
        effects: [
          { type: 'damage', modifier: 1.5, description: 'Pulses every 1s for 150% damage' },
          { type: 'cooldown', modifier: 1, description: '1s pulse interval' }
        ]
      }
    ],
    9: [
      {
        id: 'breathe_transcendent',
        name: 'Transcendent',
        description: 'Restores 1 Serenity/sec per stressor in range',
        effects: [
          { type: 'special', modifier: 1, description: 'Restores 1 Serenity/sec per stressor in range' }
        ]
      },
      {
        id: 'breathe_overwhelming',
        name: 'Overwhelming',
        description: '20% chance to execute stressors below 30% health',
        effects: [
          { type: 'special', modifier: 0.2, description: '20% chance to execute stressors below 30% health' }
        ]
      }
    ]
  },
  recenter: {
    3: [
      {
        id: 'recenter_wide',
        name: 'Wide',
        description: '+40% radius, -25% slow strength',
        effects: [
          { type: 'radius', modifier: 1.4, description: '+40% radius' },
          { type: 'special', modifier: 0.75, description: '-25% slow strength' }
        ]
      },
      {
        id: 'recenter_intense',
        name: 'Intense',
        description: '+50% slow strength, -20% radius',
        effects: [
          { type: 'special', modifier: 1.5, description: '+50% slow strength' },
          { type: 'radius', modifier: 0.8, description: '-20% radius' }
        ]
      }
    ],
    6: [
      {
        id: 'recenter_rapid',
        name: 'Rapid',
        description: '-30% cooldown, -20% slow duration',
        effects: [
          { type: 'cooldown', modifier: 0.7, description: '-30% cooldown' },
          { type: 'duration', modifier: 0.8, description: '-20% slow duration' }
        ]
      },
      {
        id: 'recenter_persistent',
        name: 'Persistent',
        description: '+100% slow duration, +20% cooldown',
        effects: [
          { type: 'duration', modifier: 2.0, description: '+100% slow duration' },
          { type: 'cooldown', modifier: 1.2, description: '+20% cooldown' }
        ]
      }
    ],
    9: [
      {
        id: 'recenter_cascading',
        name: 'Cascading',
        description: 'Pulse chains to nearby stressors',
        effects: [
          { type: 'special', modifier: 1, description: 'Pulse chains to nearby stressors' }
        ]
      },
      {
        id: 'recenter_resonant',
        name: 'Resonant',
        description: 'Each pulse increases next pulse radius by 10%',
        effects: [
          { type: 'special', modifier: 0.1, description: 'Each pulse increases next pulse radius by 10%' }
        ]
      }
    ]
  },
  // Placeholder configurations for other abilities - will be fully implemented in later phases
  affirm: {
    3: [],
    6: [],
    9: []
  },
  exhale: {
    3: [],
    6: [],
    9: []
  },
  reflect: {
    3: [],
    6: [],
    9: []
  },
  mantra: {
    3: [],
    6: [],
    9: []
  },
  ground: {
    3: [],
    6: [],
    9: []
  },
  release: {
    3: [],
    6: [],
    9: []
  },
  align: {
    3: [],
    6: [],
    9: []
  }
};

