/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comic Preset interface for built-in story templates
 * These presets provide starting configurations for different comic genres and styles
 */
export interface ComicPreset {
  /** Unique identifier for the preset */
  id: string;
  /** Display name for the preset */
  name: string;
  /** Brief description of the comic type */
  description: string;
  /** Thumbnail image URL (placeholder for now) */
  thumbnail?: string;
  /** Genre from GENRES constant in types.ts */
  genre: string;
  /** Art style from ART_STYLES constant in types.ts */
  artStyle: string;
  /** Tone from TONES constant in types.ts */
  tone: string;
  /** Page count (3, 6, or 9) */
  pageLength: number;
  /** Suggested character roles with backstory hints */
  characterRoles: { role: string; backstoryHint: string }[];
  /** Story description hint to guide the user */
  storyHint: string;
  /** Optional outline template for Outline Mode */
  outlineTemplate?: string;
}

/**
 * Built-in comic presets for the Infinite Heroes Comic Creator
 */
export const COMIC_PRESETS: ComicPreset[] = [
  // ============================================================================
  // SUPERHERO ORIGIN
  // ============================================================================
  {
    id: 'superhero-origin',
    name: 'Superhero Origin',
    description: 'Classic hero discovers powers and faces their first villain. Perfect for introducing a new superhero to the world.',
    genre: 'Superhero Action',
    artStyle: 'Classic 90s Marvel',
    tone: 'ACTION-HEAVY (Short, punchy dialogue. Focus on kinetics.)',
    pageLength: 6,
    characterRoles: [
      {
        role: 'Hero',
        backstoryHint: 'An ordinary person whose life is about to change forever. Consider: What makes them relatable? What personal tragedy or accident triggers their transformation? What moral code will guide them?'
      },
      {
        role: 'Villain',
        backstoryHint: 'The first true test for our hero. Consider: Are they a mirror of the hero (similar powers, opposite choices)? What drove them to villainy? Do they have a personal connection to the hero?'
      }
    ],
    storyHint: 'Tell the story of how your hero discovers their powers and faces their first real challenge. Include: the inciting incident (accident, experiment, cosmic event), the initial struggle to control/understand new abilities, and a confrontation that forces them to choose heroism.',
    outlineTemplate: `Page 1: Establish the hero in their ordinary life. Show what they care about and who they are before everything changes.

Page 2: The transformation event occurs. Something extraordinary happens that grants powers or reveals a hidden destiny.

Page 3: Confusion and discovery. The hero struggles with new abilities, makes mistakes, and begins to understand what they can do.

Page 4: The threat emerges. Introduce the villain and show the danger they pose to innocents or to something the hero cares about.

Page 5: First confrontation. Hero and villain clash. The hero is outmatched or makes critical errors but learns something important.

Page 6: The choice and victory. Hero makes a defining moral choice, overcomes the villain through cleverness or sacrifice, and accepts their new responsibility.`
  },

  // ============================================================================
  // MYSTERY DETECTIVE
  // ============================================================================
  {
    id: 'mystery-detective',
    name: 'Mystery Detective',
    description: 'Noir investigation with shadowy clues and a twist ending. Follow a detective through a web of deception.',
    genre: 'Neon Noir Detective',
    artStyle: 'Gritty Noir Horror',
    tone: 'INNER-MONOLOGUE (Heavy captions revealing thoughts.)',
    pageLength: 9,
    characterRoles: [
      {
        role: 'Hero',
        backstoryHint: 'A detective with a haunted past. Consider: What case still keeps them up at night? Do they have a code they follow? What vice or flaw makes them human?'
      },
      {
        role: 'Sidekick',
        backstoryHint: 'An assistant, informant, or partner. Consider: Do they provide comic relief or emotional support? Are they hiding something? How do they complement the detective\'s methods?'
      }
    ],
    storyHint: 'A classic whodunit in a rain-soaked city. Include: a compelling mystery (murder, theft, disappearance), red herrings and false leads, interrogation scenes, and a twist that recontextualizes earlier clues.',
    outlineTemplate: `Page 1: The case begins. Detective receives a new case or stumbles onto a crime scene. Establish the noir atmosphere and the detective's voice.

Page 2: Initial investigation. Examine evidence, interview the first witness or suspect. Plant the first clue and the first red herring.

Page 3: The plot thickens. A new piece of information contradicts initial assumptions. The sidekick offers insight or an alternative theory.

Page 4: Following leads. Detective tracks down a key witness or location. Tension and danger increase.

Page 5: Confrontation with a suspect. Interrogation or confrontation scene reveals more information but also more questions.

Page 6: The twist. Something the detective believed is proven false. A new suspect emerges or a trusted ally is implicated.

Page 7: Racing against time. The stakes increase dramatically. Someone is in danger or the culprit is about to escape.

Page 8: Revelation. The detective pieces together the truth. Show the mental breakthrough and the realization of who is responsible.

Page 9: Resolution. Confrontation with the true culprit. Justice (or noir's version of it) is served. End with the detective's reflection on the case.`
  },

  // ============================================================================
  // FANTASY QUEST
  // ============================================================================
  {
    id: 'fantasy-quest',
    name: 'Fantasy Quest',
    description: 'Epic journey through magical lands with companions, challenges, and destiny. Classic high fantasy adventure.',
    genre: 'High Fantasy',
    artStyle: 'Watercolor Fantasy',
    tone: 'OPERATIC (Grand, dramatic declarations and high stakes.)',
    pageLength: 9,
    characterRoles: [
      {
        role: 'Hero',
        backstoryHint: 'The chosen one or reluctant hero. Consider: What prophecy or calling draws them into adventure? What do they leave behind? What inner doubt must they overcome?'
      },
      {
        role: 'Sidekick',
        backstoryHint: 'A loyal companion on the journey. Consider: Are they a magical creature, a wise mentor figure, or a fellow adventurer? What do they add to the hero that they lack?'
      },
      {
        role: 'Villain',
        backstoryHint: 'The dark lord, corrupted wizard, or ancient evil. Consider: What is their ultimate goal? Were they once good? What makes them a credible threat to the entire realm?'
      }
    ],
    storyHint: 'An epic quest across magical landscapes. Include: the call to adventure, gathering companions, facing magical trials, and a climactic confrontation with ultimate evil. Emphasize themes of courage, friendship, and sacrifice.',
    outlineTemplate: `Page 1: The peaceful beginning. Show the hero in their homeland before the call to adventure arrives.

Page 2: The call and departure. A messenger, vision, or disaster forces the hero to leave on their quest. They gain their first companion.

Page 3: Into the unknown. The party enters dangerous territory. Establish the magical world and its wonders.

Page 4: First trial. A challenge tests the hero's resolve. They learn something about themselves or their quest.

Page 5: Gathering strength. The party gains a crucial ally, weapon, or knowledge needed for the final confrontation.

Page 6: The dark revelation. The true scope of the villain's plan is revealed. The stakes become personal.

Page 7: Darkest hour. The party faces a devastating setback. Hope seems lost, but bonds of friendship endure.

Page 8: The final approach. Armed with new determination, the heroes infiltrate the villain's domain.

Page 9: Climactic battle and resolution. The hero confronts the villain in an epic showdown. Victory comes through sacrifice, and the realm is saved.`
  },

  // ============================================================================
  // SCI-FI ADVENTURE
  // ============================================================================
  {
    id: 'scifi-adventure',
    name: 'Sci-Fi Adventure',
    description: 'Space exploration and alien encounters. Navigate the cosmos, uncover ancient mysteries, and face the unknown.',
    genre: 'Dark Sci-Fi',
    artStyle: 'Cinematic 3D Render',
    tone: 'QUIPPY (Characters use humor as a defense mechanism.)',
    pageLength: 6,
    characterRoles: [
      {
        role: 'Hero',
        backstoryHint: 'A spacer, pilot, or explorer. Consider: Are they running from something in their past? What drives them to explore the unknown? What skills make them suited for the dangers of space?'
      },
      {
        role: 'Sidekick',
        backstoryHint: 'An AI companion, robot, or alien ally. Consider: Are they logical or emotional? Do they have their own goals? What unique perspective do they bring to human problems?'
      }
    ],
    storyHint: 'A journey through the cosmos. Include: an intriguing discovery or distress signal, exploration of alien environments, encounters with strange life forms or ancient technology, and a revelation that challenges understanding of the universe.',
    outlineTemplate: `Page 1: Deep space. Establish the ship, the crew dynamic, and the hero's relationship with their AI/robot companion. Something unusual appears on sensors.

Page 2: First contact. The crew investigates an anomaly, derelict ship, or alien signal. Tension builds as they realize they're not alone.

Page 3: Into the unknown. Exploration of alien environment or technology. Wonder mixed with danger. The companion provides crucial assistance.

Page 4: Crisis point. Something goes wrong. The hero and companion are separated or face a life-threatening situation.

Page 5: Discovery. A major revelation about the alien presence, ancient civilization, or cosmic mystery. The true nature of the threat or opportunity becomes clear.

Page 6: Resolution. The hero makes a critical decision about their discovery. They escape, make contact, or sacrifice something to save others. End with implications for the future.`
  },

  // ============================================================================
  // TEEN DRAMA
  // ============================================================================
  {
    id: 'teen-drama',
    name: 'Teen Drama',
    description: 'High school drama with friendship challenges, personal growth, and the intensity of youth. Coming-of-age story.',
    genre: 'Teen Drama / Slice of Life',
    artStyle: 'Modern American Comic',
    tone: 'CASUAL (Natural dialogue, focus on relationships/gossip.)',
    pageLength: 6,
    characterRoles: [
      {
        role: 'Hero',
        backstoryHint: 'A teenager navigating high school life. Consider: What social circle do they belong to (or wish they belonged to)? What insecurity drives them? What do they want more than anything?'
      },
      {
        role: 'Family/Friend',
        backstoryHint: 'The best friend who knows all secrets. Consider: How long have they been friends? What tension exists in the friendship? Do they have their own struggles that mirror or contrast the hero\'s?'
      }
    ],
    storyHint: 'A story about growing up and finding yourself. Include: social pressures (popularity, fitting in, standing out), a friendship tested by circumstances, a moment of vulnerability, and a realization about what truly matters.',
    outlineTemplate: `Page 1: School day begins. Establish the hero, their best friend, and their place in the social hierarchy. Hint at an upcoming challenge or event.

Page 2: The inciting incident. Something disrupts the status quo - a rumor, a new student, a competition, or a revelation about someone close.

Page 3: Rising tension. The hero faces pressure from multiple directions. Their friendship is strained as they make choices.

Page 4: The confrontation. A public argument, a betrayal revealed, or a moment where the hero must choose between popularity and loyalty.

Page 5: Reflection and reconciliation. The hero processes what happened. A heart-to-heart conversation begins healing the rift.

Page 6: Growth and resolution. The hero emerges with new understanding. The friendship is restored or transformed. Life goes on, but everyone has changed.`
  },

  // ============================================================================
  // HORROR SURVIVAL
  // ============================================================================
  {
    id: 'horror-survival',
    name: 'Horror Survival',
    description: 'Escape from terror in a psychological horror experience. Face your fears and fight to survive the night.',
    genre: 'Classic Horror',
    artStyle: 'Gritty Noir Horror',
    tone: 'INNER-MONOLOGUE (Heavy captions revealing thoughts.)',
    pageLength: 6,
    characterRoles: [
      {
        role: 'Hero',
        backstoryHint: 'A survivor facing unimaginable horror. Consider: What past trauma makes this situation resonate? What gives them the will to survive? What weakness might the horror exploit?'
      }
    ],
    storyHint: 'A descent into terror. Include: an isolated setting (haunted house, abandoned hospital, remote cabin), escalating dread with each page, glimpses of the horror before the full reveal, and a desperate escape or confrontation. Focus on atmosphere and psychological terror over gore.',
    outlineTemplate: `Page 1: Arrival. The hero enters the location with a reason (investigation, shelter, searching for someone). Establish isolation and first hints of wrongness.

Page 2: Something is wrong. Small signs of danger accumulate. The hero realizes they may not be alone. Tension builds with shadows and sounds.

Page 3: First encounter. A glimpse of the horror - just enough to terrify but not fully reveal. The hero's fear becomes real and immediate.

Page 4: Trapped. Escape routes are cut off. The hero must navigate deeper into danger. Show the psychological toll through internal monologue.

Page 5: Revelation and chase. The true nature of the horror is revealed. A desperate flight for survival through the location.

Page 6: Climax. The hero either escapes (perhaps scarred), defeats the horror (at great cost), or faces an ambiguous fate. End with lingering dread.`
  },

  // ============================================================================
  // COMEDY CAPER
  // ============================================================================
  {
    id: 'comedy-caper',
    name: 'Comedy Caper',
    description: 'A heist or prank gone hilariously wrong. Laughs, mishaps, and somehow pulling it off in the end.',
    genre: 'Lighthearted Comedy',
    artStyle: 'Modern American Comic',
    tone: 'QUIPPY (Characters use humor as a defense mechanism.)',
    pageLength: 3,
    characterRoles: [
      {
        role: 'Hero',
        backstoryHint: 'The mastermind with more confidence than competence. Consider: Why are they doing this (money, revenge, proving themselves)? What makes them think they can pull it off? What obvious flaw will sabotage them?'
      },
      {
        role: 'Sidekick',
        backstoryHint: 'The reluctant partner in crime. Consider: How did they get roped into this? Are they the voice of reason or equally chaotic? What skill do they bring that\'s completely useless (or unexpectedly vital)?'
      }
    ],
    storyHint: 'A comedic scheme that spirals out of control. Include: an overly complicated plan, everything going wrong in unexpected ways, improvisation and panic, and a resolution that somehow works despite (or because of) the chaos.',
    outlineTemplate: `Page 1: The plan. Our heroes lay out their scheme with misplaced confidence. Show their dynamic and set up what can go wrong.

Page 2: Everything goes wrong. The plan immediately falls apart in spectacular fashion. Each attempt to fix things makes it worse. Physical comedy and rapid-fire dialogue.

Page 3: Chaotic victory. Through pure luck, quick thinking, or the unexpected consequences of their failures, the heroes achieve something (maybe not what they intended). End on a laugh.`
  },

  // ============================================================================
  // APOCALYPSE STORY
  // ============================================================================
  {
    id: 'apocalypse-story',
    name: 'Apocalypse Story',
    description: 'Survival in a devastated wasteland. Find hope in hopelessness, form bonds with fellow survivors, and face harsh realities.',
    genre: 'Wasteland Apocalypse',
    artStyle: 'Gritty Noir Horror',
    tone: 'OPERATIC (Grand, dramatic declarations and high stakes.)',
    pageLength: 9,
    characterRoles: [
      {
        role: 'Hero',
        backstoryHint: 'A survivor hardened by the apocalypse. Consider: What did they lose when the world ended? What code do they live by in this lawless world? What keeps them human when humanity seems lost?'
      },
      {
        role: 'Sidekick',
        backstoryHint: 'A companion found in the wasteland. Consider: Do they remember the old world? Are they a source of hope or a reminder of what\'s lost? What do they need that the hero can provide?'
      }
    ],
    storyHint: 'A journey through the ruins of civilization. Include: the harsh beauty of the destroyed world, encounters with other survivors (friendly and hostile), moral dilemmas about survival, and a destination that represents hope (rumored sanctuary, cure, safe zone).',
    outlineTemplate: `Page 1: The wasteland. Establish the post-apocalyptic setting and the hero surviving alone. Show what destroyed the world and how people cope.

Page 2: An encounter. The hero meets their companion under tense circumstances. Trust must be earned in this new world.

Page 3: Forming an alliance. The two decide to travel together toward a common goal. Share backstories and establish their dynamic.

Page 4: The journey. Travel through dangerous territory. Show the wonders and horrors of the changed world.

Page 5: Hostile survivors. Encounter with raiders, a cult, or desperate people. A confrontation tests the heroes' principles.

Page 6: Loss and reflection. Something precious is lost - supplies, trust, or hope itself. The companions must decide whether to continue.

Page 7: Renewed purpose. A discovery or encounter reignites hope. The destination seems achievable.

Page 8: The final obstacle. The greatest challenge yet stands between the heroes and their goal. Everything they've learned is tested.

Page 9: Arrival and new beginning. The heroes reach their destination, but it's not what they expected. They find a different kind of hope and face a new chapter in the wasteland.`
  },

  // ============================================================================
  // ROMANCE ADVENTURE
  // ============================================================================
  {
    id: 'romance-adventure',
    name: 'Romance Adventure',
    description: 'Love blooms amid action and danger. Two hearts find each other while facing external threats together.',
    genre: 'Superhero Action',
    artStyle: 'Modern American Comic',
    tone: 'WHOLESOME (Warm, gentle, optimistic.)',
    pageLength: 6,
    characterRoles: [
      {
        role: 'Hero',
        backstoryHint: 'Someone whose heart is guarded. Consider: What past relationship or loss made them cautious? What do they secretly long for? What strength do they show to the world?'
      },
      {
        role: 'Family/Friend',
        backstoryHint: 'The love interest who breaks through. Consider: What makes them different from anyone the hero has met? Do they share a passion or goal? What vulnerability do they show that mirrors the hero\'s?'
      }
    ],
    storyHint: 'A love story wrapped in adventure. Include: a memorable first meeting, obstacles that keep them apart, moments of connection and vulnerability, danger that reveals true feelings, and a declaration that changes everything.',
    outlineTemplate: `Page 1: The meeting. Two people cross paths in an unexpected way. First impressions are complicated by circumstances. Establish what draws them to each other.

Page 2: Thrown together. Circumstances force them to work together or spend time in close proximity. Tension between attraction and resistance.

Page 3: Growing closer. A moment of genuine connection breaks through defenses. They share something personal or face a challenge together.

Page 4: The complication. An external threat, misunderstanding, or prior commitment threatens to separate them. Stakes become clear.

Page 5: The crisis. Everything comes to a head. In a moment of danger or truth, real feelings are revealed (or nearly are).

Page 6: Resolution. The obstacle is overcome, feelings are confessed, and a new chapter begins. End with hope and warmth.`
  },

  // ============================================================================
  // MARTIAL ARTS SHOWDOWN
  // ============================================================================
  {
    id: 'martial-arts-showdown',
    name: 'Martial Arts Showdown',
    description: 'Honor, discipline, and spectacular combat. A warrior faces their ultimate test in a tournament or duel.',
    genre: 'Superhero Action',
    artStyle: 'Black & White Manga',
    tone: 'ACTION-HEAVY (Short, punchy dialogue. Focus on kinetics.)',
    pageLength: 6,
    characterRoles: [
      {
        role: 'Hero',
        backstoryHint: 'A martial artist with something to prove. Consider: What style do they practice? Who was their master? What drives them - vengeance, honor, protection of the weak, or personal excellence?'
      },
      {
        role: 'Antagonist',
        backstoryHint: 'The rival or enemy who must be defeated. Consider: Do they share history with the hero? What makes their fighting style a challenge? Are they truly evil or simply an obstacle to overcome?'
      }
    ],
    storyHint: 'A story told through combat. Include: training or preparation, the weight of the coming battle, the fight itself with shifting momentum, a moment when defeat seems certain, and victory through determination and skill.',
    outlineTemplate: `Page 1: The warrior. Introduce the hero in training or meditation. Show their discipline and hint at the coming challenge. Establish their fighting style visually.

Page 2: The challenge. The opponent is introduced and the stakes are set. A tournament begins, a duel is called, or a threat emerges that can only be resolved through combat.

Page 3: First clash. The fight begins. Both fighters test each other, displaying their skills. The hero gains early advantage but learns not to underestimate their foe.

Page 4: Turning tide. The opponent reveals hidden technique or strength. The hero is pushed to their limits, taking damage. The philosophy of their fighting is tested.

Page 5: The breakthrough. In a moment of clarity, the hero finds their center. They recall their training, their purpose. A counter-attack begins.

Page 6: Final blow. The decisive moment. Through perfect technique and indomitable will, the hero achieves victory. Honor is satisfied, and the warrior has grown.`
  }
];

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): ComicPreset | undefined {
  return COMIC_PRESETS.find(preset => preset.id === id);
}

/**
 * Get presets filtered by genre
 */
export function getPresetsByGenre(genre: string): ComicPreset[] {
  return COMIC_PRESETS.filter(preset => preset.genre === genre);
}

/**
 * Get presets filtered by page length
 */
export function getPresetsByLength(pageLength: number): ComicPreset[] {
  return COMIC_PRESETS.filter(preset => preset.pageLength === pageLength);
}
