/**
 * Pose Library for Infinite Heroes Comic Creator
 *
 * A collection of common comic poses with detailed AI prompt descriptions
 * for consistent character posing in generated panels.
 */

export type PoseCategory = 'action' | 'dialogue' | 'emotional' | 'dynamic' | 'neutral';

export interface Pose {
  id: string;
  label: string;
  category: PoseCategory;
  promptDescription: string;
}

export const POSE_LIBRARY: Pose[] = [
  // === NEUTRAL POSES ===
  {
    id: 'standing-neutral',
    label: 'Standing Neutral',
    category: 'neutral',
    promptDescription: 'Standing upright in a relaxed neutral pose, arms hanging naturally at sides, weight evenly distributed on both feet, facing forward with a calm expression',
  },
  {
    id: 'arms-crossed-confident',
    label: 'Arms Crossed (Confident)',
    category: 'neutral',
    promptDescription: 'Standing with arms crossed over chest in a confident authoritative stance, chin slightly raised, feet shoulder-width apart, projecting self-assurance',
  },
  {
    id: 'hands-on-hips',
    label: 'Hands on Hips',
    category: 'neutral',
    promptDescription: 'Standing with both hands planted firmly on hips, elbows out, chest forward in a determined assertive pose, conveying confidence and readiness',
  },
  {
    id: 'sitting-relaxed',
    label: 'Sitting Relaxed',
    category: 'neutral',
    promptDescription: 'Seated in a relaxed casual position, leaning back slightly, one arm resting on the armrest or knee, legs uncrossed in a comfortable pose',
  },
  {
    id: 'walking-casual',
    label: 'Walking Casually',
    category: 'neutral',
    promptDescription: 'Mid-stride walking pose with natural arm swing, one foot forward and the other pushing off behind, relaxed shoulders, casual unhurried gait',
  },
  {
    id: 'leaning-against-wall',
    label: 'Leaning Against Wall',
    category: 'neutral',
    promptDescription: 'Leaning casually against a wall or surface with one shoulder, arms crossed or hands in pockets, one leg bent with foot against the wall, cool relaxed attitude',
  },

  // === ACTION POSES ===
  {
    id: 'action-punch',
    label: 'Throwing Punch',
    category: 'action',
    promptDescription: 'Dynamic punching pose with one fist extended forward in a powerful strike, rear arm pulled back, torso twisted for maximum power, intense determined expression, action lines implied',
  },
  {
    id: 'running-mid-stride',
    label: 'Running Mid-Stride',
    category: 'action',
    promptDescription: 'Full sprint running pose captured mid-stride, one leg extended forward and other pushing off behind, arms pumping in opposite motion, body leaning forward, intense focused expression',
  },
  {
    id: 'flying-superman',
    label: 'Flying (Superman Style)',
    category: 'action',
    promptDescription: 'Classic superhero flying pose with one arm extended forward leading the way, other arm at side or slightly back, body horizontal and streamlined, cape flowing behind if applicable, soaring through the air',
  },
  {
    id: 'jumping-leaping',
    label: 'Jumping/Leaping',
    category: 'action',
    promptDescription: 'Dynamic mid-air leap with legs bent beneath, arms raised or extended for balance, body arcing upward at the peak of the jump, conveying powerful momentum and athleticism',
  },
  {
    id: 'fighting-stance',
    label: 'Fighting Stance',
    category: 'action',
    promptDescription: 'Combat-ready fighting stance with fists raised in guard position, knees bent, weight on balls of feet, body turned slightly sideways to present smaller target, alert focused expression',
  },
  {
    id: 'holding-weapon-ready',
    label: 'Holding Weapon Ready',
    category: 'action',
    promptDescription: 'Standing alert with weapon held in ready position (sword raised, gun aimed, staff poised), body tensed and prepared for combat, eyes locked on target, battle-ready stance',
  },
  {
    id: 'dodging-evading',
    label: 'Dodging/Evading',
    category: 'action',
    promptDescription: 'Dynamic evasive maneuver with body twisted and leaning to avoid an attack, one arm raised defensively, legs positioned for quick recovery, expression of concentration and quick reflexes',
  },
  {
    id: 'casting-spell',
    label: 'Casting Spell/Magic',
    category: 'action',
    promptDescription: 'Dramatic spellcasting pose with arms extended, hands positioned in mystical gesture, fingers spread channeling magical energy, eyes glowing or intensely focused, arcane power emanating from hands',
  },

  // === DYNAMIC POSES ===
  {
    id: 'dramatic-hero-pose',
    label: 'Dramatic Hero Pose',
    category: 'dynamic',
    promptDescription: 'Iconic heroic stance with chest out, one fist raised triumphantly or planted on hip, chin lifted, cape billowing dramatically if present, backlit for silhouette effect, radiating power and determination',
  },
  {
    id: 'crouching-defensive',
    label: 'Crouching Defensive',
    category: 'dynamic',
    promptDescription: 'Low defensive crouch with one knee down, arms raised in protective stance, body coiled and ready to spring into action, alert eyes scanning for threats',
  },
  {
    id: 'kneeling',
    label: 'Kneeling',
    category: 'dynamic',
    promptDescription: 'Down on one knee in dramatic kneeling pose, other foot planted forward, head bowed or looking up depending on context, can convey respect, exhaustion, or preparation to rise',
  },
  {
    id: 'falling-stumbling',
    label: 'Falling/Stumbling',
    category: 'dynamic',
    promptDescription: 'Off-balance stumbling or falling pose with arms flailing for stability, body tilted at precarious angle, expression of surprise or distress, conveying loss of control',
  },
  {
    id: 'victory-pose',
    label: 'Victory Pose',
    category: 'dynamic',
    promptDescription: 'Triumphant victory celebration with both arms raised overhead in triumph, head tilted back, expression of joy and relief, body language conveying complete success and elation',
  },
  {
    id: 'looking-over-shoulder',
    label: 'Looking Over Shoulder',
    category: 'dynamic',
    promptDescription: 'Dramatic over-the-shoulder glance with body facing away, head turned back to look at viewer or subject, creates mystery and intrigue, can convey wariness or confident departure',
  },

  // === DIALOGUE POSES ===
  {
    id: 'pointing-accusingly',
    label: 'Pointing Accusingly',
    category: 'dialogue',
    promptDescription: 'Dramatic accusatory pointing with arm fully extended, index finger aimed at target, body leaning forward aggressively, face intense with accusation or confrontation',
  },
  {
    id: 'thinking-contemplating',
    label: 'Thinking/Contemplating',
    category: 'dialogue',
    promptDescription: 'Thoughtful contemplative pose with hand on chin or temple, eyes looking slightly upward or to the side, brow slightly furrowed in concentration, conveying deep thought or consideration',
  },
  {
    id: 'explaining-gesturing',
    label: 'Explaining (Gesturing)',
    category: 'dialogue',
    promptDescription: 'Animated speaking pose with hands gesturing expressively to emphasize points, open palm gestures, engaged expression, body language indicating active explanation or storytelling',
  },
  {
    id: 'listening-attentive',
    label: 'Listening Attentively',
    category: 'dialogue',
    promptDescription: 'Attentive listening pose with body angled toward speaker, head slightly tilted, arms relaxed or one hand near face, expression of interest and engagement, focused eye contact',
  },

  // === EMOTIONAL POSES ===
  {
    id: 'surprised-reaction',
    label: 'Surprised Reaction',
    category: 'emotional',
    promptDescription: 'Dramatic surprise reaction with eyes wide, mouth open in shock, body recoiling slightly backward, hands raised in startled gesture, expressing unexpected revelation or shock',
  },
  {
    id: 'angry-confrontation',
    label: 'Angry Confrontation',
    category: 'emotional',
    promptDescription: 'Intense angry confrontational pose with fists clenched at sides or raised, body leaning forward aggressively, face contorted in rage, teeth possibly visible, veins or tension lines visible',
  },
  {
    id: 'sad-defeated',
    label: 'Sad/Defeated',
    category: 'emotional',
    promptDescription: 'Dejected defeated pose with shoulders slumped, head hanging down, arms limp at sides or wrapped around self, conveying profound sadness, loss, or despair',
  },
  {
    id: 'laughing',
    label: 'Laughing',
    category: 'emotional',
    promptDescription: 'Genuine laughing pose with head tilted back, mouth open in hearty laughter, eyes crinkled with joy, one hand possibly on stomach or slapping knee, body shaking with mirth',
  },
  {
    id: 'exhausted-tired',
    label: 'Exhausted/Tired',
    category: 'emotional',
    promptDescription: 'Worn out exhausted pose with body hunched over, hands on knees or one arm braced against wall, head drooping, heavy breathing implied, sweat visible, conveying physical or emotional depletion',
  },
  {
    id: 'determined-resolute',
    label: 'Determined/Resolute',
    category: 'emotional',
    promptDescription: 'Strong determined stance with jaw set firmly, eyes narrowed with resolve, fists clenched or arms tensed, body squared up and ready, radiating unwavering determination and willpower',
  },
];

/**
 * Get poses filtered by category
 */
export function getPosesByCategory(category: PoseCategory): Pose[] {
  return POSE_LIBRARY.filter(pose => pose.category === category);
}

/**
 * Get a pose by its ID
 */
export function getPoseById(id: string): Pose | undefined {
  return POSE_LIBRARY.find(pose => pose.id === id);
}

/**
 * Get all unique pose categories
 */
export function getPoseCategories(): PoseCategory[] {
  return ['action', 'dialogue', 'emotional', 'dynamic', 'neutral'];
}

/**
 * Get category display labels
 */
export const POSE_CATEGORY_LABELS: Record<PoseCategory, string> = {
  action: 'Action',
  dialogue: 'Dialogue',
  emotional: 'Emotional',
  dynamic: 'Dynamic',
  neutral: 'Neutral',
};
