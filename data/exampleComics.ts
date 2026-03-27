/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Example Comic interface for showcasing pre-generated comic examples.
 * These serve as inspiration and demonstration for new users.
 */
export interface ExampleComic {
  /** Unique identifier for the example */
  id: string;
  /** Display title of the comic */
  title: string;
  /** Brief compelling description of the story */
  description: string;
  /** Genre category (should match GENRES from types.ts) */
  genre: string;
  /** Number of pages in the comic */
  pageCount: number;
  /** Thumbnail URL or placeholder gradient */
  thumbnailUrl: string;
  /** Name of the main hero character */
  heroName: string;
  /** Art style used (should match ART_STYLES from types.ts) */
  artStyle: string;
  /** Creation date in ISO format */
  createdAt: string;
  /** Optional tagline for marketing appeal */
  tagline?: string;
  /** Key themes explored in the story */
  themes?: string[];
}

/**
 * Placeholder gradient thumbnails using CSS gradients as data URIs.
 * These provide visual variety without needing actual images.
 */
const PLACEHOLDER_THUMBNAILS = {
  superhero: 'linear-gradient(135deg, #DC2626 0%, #7C3AED 50%, #2563EB 100%)',
  scifi: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 50%, #8B5CF6 100%)',
  horror: 'linear-gradient(135deg, #1F2937 0%, #4B5563 30%, #DC2626 100%)',
  drama: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EC4899 100%)',
} as const;

/**
 * Pre-configured example comics showcasing the app's capabilities.
 * Each example demonstrates a different genre and art style combination.
 */
export const EXAMPLE_COMICS: ExampleComic[] = [
  // ============================================================================
  // THE CRIMSON GUARDIAN - Superhero Action
  // ============================================================================
  {
    id: 'crimson-guardian',
    title: 'The Crimson Guardian',
    description: 'When scientist Maya Chen gains incredible powers from a lab accident, she must choose between a life of safety and becoming the hero Metro City desperately needs. As the villainous Shadowmind threatens to plunge the city into chaos, Maya discovers that true courage means standing up even when you are afraid.',
    genre: 'Superhero Action',
    pageCount: 6,
    thumbnailUrl: PLACEHOLDER_THUMBNAILS.superhero,
    heroName: 'Maya Chen / Crimson Guardian',
    artStyle: 'Classic 90s Marvel',
    createdAt: '2026-02-15',
    tagline: 'One accident. Infinite potential. Unlimited responsibility.',
    themes: ['responsibility', 'courage', 'self-discovery'],
  },

  // ============================================================================
  // SHADOWS OF TOMORROW - Sci-Fi Adventure
  // ============================================================================
  {
    id: 'shadows-of-tomorrow',
    title: 'Shadows of Tomorrow',
    description: 'Captain Zara Okonkwo and her AI companion NOVA intercept a distress signal from the edge of known space. What they discover in the derelict alien station will challenge everything humanity believes about their place in the universe - and force Zara to make an impossible choice between duty and destiny.',
    genre: 'Dark Sci-Fi',
    pageCount: 9,
    thumbnailUrl: PLACEHOLDER_THUMBNAILS.scifi,
    heroName: 'Captain Zara Okonkwo',
    artStyle: 'Cinematic 3D Render',
    createdAt: '2026-02-20',
    tagline: 'In the void between stars, she found humanity\'s future.',
    themes: ['exploration', 'first contact', 'sacrifice'],
  },

  // ============================================================================
  // MIDNIGHT MYSTERY - Classic Horror
  // ============================================================================
  {
    id: 'midnight-mystery',
    title: 'Midnight Mystery',
    description: 'Paranormal investigator Dr. James Holloway takes on his most terrifying case yet: Blackwood Manor, where seven guests vanished without a trace forty years ago. As midnight approaches and the house reveals its secrets, James realizes the true horror isn\'t what haunts the halls - it\'s what lurks within the human heart.',
    genre: 'Classic Horror',
    pageCount: 6,
    thumbnailUrl: PLACEHOLDER_THUMBNAILS.horror,
    heroName: 'Dr. James Holloway',
    artStyle: 'Gritty Noir Horror',
    createdAt: '2026-03-01',
    tagline: 'Some doors should never be opened. Some secrets should stay buried.',
    themes: ['mystery', 'psychological horror', 'redemption'],
  },

  // ============================================================================
  // SUMMER DAYS - Teen Drama / Slice of Life
  // ============================================================================
  {
    id: 'summer-days',
    title: 'Summer Days',
    description: 'Best friends Emma and Luis have one last summer before college tears them apart. When a misunderstanding threatens their decade-long friendship, they must navigate jealousy, change, and growing up to discover that the strongest bonds are the ones worth fighting for.',
    genre: 'Teen Drama / Slice of Life',
    pageCount: 6,
    thumbnailUrl: PLACEHOLDER_THUMBNAILS.drama,
    heroName: 'Emma Rodriguez',
    artStyle: 'Modern American Comic',
    createdAt: '2026-03-10',
    tagline: 'Growing up doesn\'t mean growing apart.',
    themes: ['friendship', 'change', 'coming-of-age'],
  },
];

/**
 * Get an example comic by ID
 */
export function getExampleById(id: string): ExampleComic | undefined {
  return EXAMPLE_COMICS.find(comic => comic.id === id);
}

/**
 * Get examples filtered by genre
 */
export function getExamplesByGenre(genre: string): ExampleComic[] {
  return EXAMPLE_COMICS.filter(comic => comic.genre === genre);
}

/**
 * Get examples filtered by page count
 */
export function getExamplesByPageCount(pageCount: number): ExampleComic[] {
  return EXAMPLE_COMICS.filter(comic => comic.pageCount === pageCount);
}

/**
 * Get settings that can pre-fill the Setup form from an example
 */
export function getSettingsFromExample(example: ExampleComic): {
  genre: string;
  artStyle: string;
  pageLength: number;
  storyHint: string;
} {
  return {
    genre: example.genre,
    artStyle: example.artStyle,
    pageLength: example.pageCount,
    storyHint: `Create a story similar to "${example.title}": ${example.description.substring(0, 150)}...`,
  };
}
