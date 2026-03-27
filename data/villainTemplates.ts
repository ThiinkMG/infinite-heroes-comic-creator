/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VillainRelationship, ThreatLevel } from '../types';

/**
 * Villain archetype for quick character creation
 */
export interface VillainArchetype {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Brief description of the archetype */
  description: string;
  /** Icon/emoji for UI display */
  icon: string;
  /** Suggested relationship to the hero */
  suggestedRelationship: VillainRelationship;
  /** Suggested threat level */
  suggestedThreatLevel: ThreatLevel;
  /** Pre-filled backstory template */
  backstoryTemplate: string;
  /** Common motivations for this archetype */
  commonMotivations: string[];
  /** Common weaknesses for this archetype */
  commonWeaknesses: string[];
  /** Typical powers/abilities for this archetype */
  typicalPowers: string[];
  /** Visual style suggestions */
  visualStyle: string;
}

/**
 * Motivation suggestions based on relationship type
 */
export const MOTIVATION_BY_RELATIONSHIP: Record<VillainRelationship, string[]> = {
  'rival': [
    'Prove they are superior to the hero in every way',
    'Claim a prize or position the hero also wants',
    'Show the world their methods are better than the hero\'s',
    'Settle an old score from their shared past',
    'Win the respect of a mentor or authority figure'
  ],
  'nemesis': [
    'Destroy everything the hero loves and stands for',
    'Prove the hero\'s philosophy is fundamentally flawed',
    'Revenge for a past wrong (real or perceived)',
    'Eliminate the only obstacle to their grand plan',
    'Force the hero to break their moral code'
  ],
  'former-ally': [
    'Make the hero understand why they changed sides',
    'Prove the hero betrayed them first',
    'Show the hero that their cause was always futile',
    'Reclaim what was taken when they were allies',
    'Convert the hero to their new worldview'
  ],
  'mirror': [
    'Prove that power should be used for personal gain',
    'Show the hero what they could become without restraint',
    'Demonstrate that their shared origin makes them destined enemies',
    'Prove that the hero\'s moral choices are weakness, not strength',
    'Claim the destiny the hero rejected'
  ],
  'oppressor': [
    'Maintain absolute control over their domain',
    'Crush any symbol of hope or resistance',
    'Expand their power to new territories',
    'Eliminate the hero as an example to others',
    'Preserve a system that benefits them at others\' expense'
  ]
};

/**
 * Weakness suggestions based on threat level
 */
export const WEAKNESS_BY_THREAT_LEVEL: Record<ThreatLevel, string[]> = {
  'minion': [
    'Easily intimidated or persuaded to switch sides',
    'Lacks confidence without their leader\'s guidance',
    'Underestimates the hero due to arrogance',
    'Poor combat skills compared to their bravado',
    'Loyalty can be bought or manipulated'
  ],
  'lieutenant': [
    'Ambition causes conflict with their own boss',
    'Needs approval from authority figures',
    'Operates poorly when plans go awry',
    'Has a secret they can be blackmailed with',
    'Underestimates subordinates who might betray them'
  ],
  'boss': [
    'Overconfidence in their elaborate plans',
    'A loved one who could be used against them',
    'A specific vulnerability in their powers',
    'Pride that prevents them from retreating',
    'Past trauma that can be exploited emotionally'
  ],
  'arch-nemesis': [
    'An obsession that blinds them to other threats',
    'A deeply buried sense of guilt or doubt',
    'A specific condition or substance that weakens them',
    'Inability to let go of the past',
    'Underestimation of non-powered allies of the hero'
  ]
};

/**
 * Pre-built villain archetypes for quick character creation
 */
export const VILLAIN_ARCHETYPES: VillainArchetype[] = [
  {
    id: 'tech-villain',
    name: 'Tech Mastermind',
    description: 'A genius inventor who uses technology for domination',
    icon: '🤖',
    suggestedRelationship: 'rival',
    suggestedThreatLevel: 'boss',
    backstoryTemplate: 'Once a brilliant scientist or tech entrepreneur, they became disillusioned with society\'s rejection of their vision. Now they use their inventions to reshape the world according to their design.',
    commonMotivations: [
      'Create a "perfect" world through technological control',
      'Prove their genius to those who doubted them',
      'Revenge against the industry that stole their ideas',
      'Transcend human limitations through technology'
    ],
    commonWeaknesses: [
      'Reliance on technology can be exploited with EMP or hacking',
      'Social isolation makes them vulnerable to manipulation',
      'Overconfidence in their intellect',
      'Physical weakness without their inventions'
    ],
    typicalPowers: [
      'Advanced armor suits',
      'Robot armies',
      'Mind-control devices',
      'Holographic illusions',
      'Devastating energy weapons'
    ],
    visualStyle: 'Sleek metallic armor or high-tech suit, glowing elements, holographic displays, robotic enhancements'
  },
  {
    id: 'mystical-foe',
    name: 'Mystical Foe',
    description: 'A sorcerer or demon wielding dark magical powers',
    icon: '🧙',
    suggestedRelationship: 'nemesis',
    suggestedThreatLevel: 'arch-nemesis',
    backstoryTemplate: 'An ancient being awakened or a mortal who bargained with dark forces, they command powers beyond human understanding. Their goals often involve bringing about prophecy or claiming ultimate magical power.',
    commonMotivations: [
      'Fulfill an ancient prophecy',
      'Claim a mystical artifact of ultimate power',
      'Break free from dimensional imprisonment',
      'Spread darkness/corruption across the realm',
      'Achieve immortality or godhood'
    ],
    commonWeaknesses: [
      'Specific magical artifacts can harm them',
      'Bound by ancient rules or prophecies',
      'Arrogance about mortal "weakness"',
      'A piece of their power is hidden in a phylactery',
      'Sunlight or holy symbols cause pain'
    ],
    typicalPowers: [
      'Dark magic and curses',
      'Summoning demons or undead',
      'Reality manipulation',
      'Mind control and illusions',
      'Energy blasts and teleportation'
    ],
    visualStyle: 'Flowing dark robes, glowing eyes, mystical symbols, shadowy aura, ancient runes, demonic features'
  },
  {
    id: 'rival-hero',
    name: 'Fallen Hero',
    description: 'A former hero who has become the villain',
    icon: '🦸',
    suggestedRelationship: 'former-ally',
    suggestedThreatLevel: 'boss',
    backstoryTemplate: 'Once celebrated as a hero, tragedy, corruption, or disillusionment transformed them. They believe they\'re still doing what\'s right, but their methods have become extreme or their goals twisted.',
    commonMotivations: [
      'Prove their way of protecting people is better',
      'Punish the system that failed them',
      'Save someone at any cost',
      'Show the hero the "truth" about heroism',
      'Finish a mission using any means necessary'
    ],
    commonWeaknesses: [
      'Lingering heroic instincts in crisis moments',
      'Memories of their former allies',
      'The person or cause they originally fought for',
      'Guilt that can be awakened with the right words',
      'Predictable because the hero knows their fighting style'
    ],
    typicalPowers: [
      'Powers similar to the hero (mirror)',
      'Combat skills honed from years of heroism',
      'Knowledge of hero community weaknesses',
      'Former allies who might still help them',
      'Enhanced abilities from new dark source'
    ],
    visualStyle: 'Corrupted version of heroic costume, darker color scheme, same symbols twisted or inverted'
  },
  {
    id: 'crime-lord',
    name: 'Crime Lord',
    description: 'A criminal mastermind who rules the underworld',
    icon: '🎩',
    suggestedRelationship: 'oppressor',
    suggestedThreatLevel: 'boss',
    backstoryTemplate: 'Rising from humble or brutal beginnings, they built a criminal empire through cunning, ruthlessness, and strategic brilliance. They see themselves as a businessperson, and the city as their territory.',
    commonMotivations: [
      'Expand their criminal empire',
      'Eliminate all competition and threats',
      'Achieve "legitimate" power and respect',
      'Revenge against those who wronged them in the past',
      'Control the city completely from the shadows'
    ],
    commonWeaknesses: [
      'Loyalty from subordinates is based on fear',
      'Criminal operations leave evidence',
      'Family or loved ones can be threatened',
      'Ego demands recognition',
      'Old rivals or enemies seeking revenge'
    ],
    typicalPowers: [
      'Vast criminal network and resources',
      'Skilled in manipulation and negotiation',
      'Armed bodyguards and assassins',
      'Political and police corruption',
      'Sometimes enhanced by serums or cybernetics'
    ],
    visualStyle: 'Expensive suits, intimidating presence, scars from past battles, luxury items, surrounded by henchmen'
  },
  {
    id: 'alien-invader',
    name: 'Alien Invader',
    description: 'An extraterrestrial conqueror or scout',
    icon: '👽',
    suggestedRelationship: 'oppressor',
    suggestedThreatLevel: 'arch-nemesis',
    backstoryTemplate: 'From a distant world or dimension, they have come to Earth with conquest in mind. They may see humans as inferior beings to be subjugated, resources to harvest, or obstacles to eliminate.',
    commonMotivations: [
      'Conquer Earth for their species',
      'Harvest Earth\'s resources or inhabitants',
      'Establish a beachhead for a larger invasion',
      'Prove their worth to their alien rulers',
      'Find a new home after their world was destroyed'
    ],
    commonWeaknesses: [
      'Unfamiliar with Earth culture and tactics',
      'Specific Earth elements or conditions harm them',
      'Dependent on technology from their homeworld',
      'Cut off from their people and reinforcements',
      'Underestimate human determination'
    ],
    typicalPowers: [
      'Advanced alien technology',
      'Natural alien abilities (strength, telepathy)',
      'Energy manipulation',
      'Shapeshifting or disguise technology',
      'Command of alien soldiers or creatures'
    ],
    visualStyle: 'Alien physiology, advanced armor, unusual skin colors, non-human features, biomechanical elements'
  },
  {
    id: 'monster',
    name: 'Monster/Beast',
    description: 'A creature of destruction, natural or created',
    icon: '🐲',
    suggestedRelationship: 'nemesis',
    suggestedThreatLevel: 'boss',
    backstoryTemplate: 'Whether born of science gone wrong, ancient magic, or natural evolution, this creature represents raw destructive power. It may be mindless or possess cunning intelligence.',
    commonMotivations: [
      'Survival and territorial dominance',
      'Feeding on fear, energy, or victims',
      'Revenge for its creation or imprisonment',
      'Following the commands of a master',
      'Instinctual drive to destroy'
    ],
    commonWeaknesses: [
      'Specific element or substance causes harm',
      'Predictable behavior patterns',
      'Dependence on a master or creator',
      'Vulnerability when feeding or resting',
      'Emotional connection to something from its origin'
    ],
    typicalPowers: [
      'Immense physical strength',
      'Natural weapons (claws, teeth, tail)',
      'Elemental breath or projection',
      'Regeneration or adaptation',
      'Fear-inducing presence'
    ],
    visualStyle: 'Massive size, natural armor or scales, glowing eyes, visible power, environmental destruction in wake'
  },
  {
    id: 'mastermind',
    name: 'Mastermind',
    description: 'A genius strategist who plans elaborate schemes',
    icon: '🧠',
    suggestedRelationship: 'rival',
    suggestedThreatLevel: 'arch-nemesis',
    backstoryTemplate: 'Possessing an intellect far beyond normal humans, they see the world as a chess game. They rarely engage directly, preferring to manipulate events and people from the shadows.',
    commonMotivations: [
      'Prove their intellectual superiority',
      'Reshape society according to their vision',
      'Solve the "problem" of human chaos',
      'The intellectual challenge of defeating the hero',
      'Control all variables in their environment'
    ],
    commonWeaknesses: [
      'Underestimate emotional or irrational actions',
      'Physical confrontation is their weakness',
      'Plans fail when unexpected variables appear',
      'Arrogance about their infallibility',
      'Need to explain their genius undermines them'
    ],
    typicalPowers: [
      'Superhuman intelligence and prediction',
      'Vast resources and loyal minions',
      'Elaborate traps and contingencies',
      'Social engineering and manipulation',
      'Technology beyond current science'
    ],
    visualStyle: 'Distinguished appearance, symbols of intelligence, always in control of environment, observing rather than acting'
  },
  {
    id: 'corrupted-innocent',
    name: 'Corrupted Innocent',
    description: 'Someone twisted by trauma or outside forces',
    icon: '💔',
    suggestedRelationship: 'mirror',
    suggestedThreatLevel: 'lieutenant',
    backstoryTemplate: 'Once innocent or even heroic, terrible circumstances or malevolent forces corrupted them. There may still be good inside, making them a tragic figure as much as a threat.',
    commonMotivations: [
      'Make others feel their pain',
      'Serve the dark power that corrupted them',
      'Protect themselves from further harm',
      'Destroy reminders of their former life',
      'Spread the corruption that changed them'
    ],
    commonWeaknesses: [
      'Memories of who they used to be',
      'Someone they still love or care about',
      'The source of corruption can be attacked',
      'Inner conflict makes them hesitate',
      'Overwhelming power is unstable'
    ],
    typicalPowers: [
      'Powers granted by dark corruption',
      'Abilities twisted from their original form',
      'Emotional manipulation through their tragedy',
      'Connection to corrupting force for power',
      'Unpredictable surges of ability'
    ],
    visualStyle: 'Visual elements of corruption (veins, shadows, distortion), remnants of former innocent appearance, tragic expression'
  }
];

/**
 * Get an archetype by ID
 */
export function getArchetypeById(id: string): VillainArchetype | undefined {
  return VILLAIN_ARCHETYPES.find(a => a.id === id);
}

/**
 * Get motivations for a specific relationship type
 */
export function getMotivationsForRelationship(relationship: VillainRelationship): string[] {
  return MOTIVATION_BY_RELATIONSHIP[relationship] || [];
}

/**
 * Get weaknesses for a specific threat level
 */
export function getWeaknessesForThreatLevel(threatLevel: ThreatLevel): string[] {
  return WEAKNESS_BY_THREAT_LEVEL[threatLevel] || [];
}

/**
 * Get a random motivation for a relationship type
 */
export function getRandomMotivation(relationship: VillainRelationship): string {
  const motivations = MOTIVATION_BY_RELATIONSHIP[relationship];
  return motivations[Math.floor(Math.random() * motivations.length)];
}

/**
 * Get a random weakness for a threat level
 */
export function getRandomWeakness(threatLevel: ThreatLevel): string {
  const weaknesses = WEAKNESS_BY_THREAT_LEVEL[threatLevel];
  return weaknesses[Math.floor(Math.random() * weaknesses.length)];
}
