/**
 * Location/Background Library for Infinite Heroes Comic Creator
 *
 * This file contains pre-defined location presets for comic panel backgrounds.
 * Each location includes detailed prompt descriptions for AI image generation.
 */

// Location category types
export type LocationCategory = 'urban' | 'nature' | 'interior' | 'fantasy' | 'scifi' | 'generic';

// Location structure interface
export interface Location {
  id: string;
  name: string;
  category: LocationCategory;
  promptDescription: string;
  variants: string[];
}

// Main location library
export const LOCATION_LIBRARY: Location[] = [
  // ==================== URBAN ====================
  {
    id: 'city-rooftop-night',
    name: 'City Rooftop at Night',
    category: 'urban',
    promptDescription: 'A high-rise rooftop in a sprawling city at night, with the skyline glittering in the background, water towers and air conditioning units nearby, concrete ledge with city lights reflecting off the surface, distant skyscrapers with lit windows',
    variants: ['dusk/sunset', 'midnight with full moon', 'stormy night with lightning', 'foggy night', 'neon-lit cyberpunk style']
  },
  {
    id: 'busy-street-corner',
    name: 'Busy Street Corner',
    category: 'urban',
    promptDescription: 'A bustling urban street corner with pedestrian crosswalk, traffic lights, storefronts with awnings, parked cars along the curb, crowds of people walking by, newspaper stands and street signs',
    variants: ['morning rush hour', 'sunny afternoon', 'rainy day with umbrellas', 'nighttime with street lights', 'winter with snow']
  },
  {
    id: 'dark-alley',
    name: 'Dark Alley',
    category: 'urban',
    promptDescription: 'A narrow, shadowy alley between tall brick buildings, dumpsters and trash bags, fire escape ladders, steam rising from vents, graffiti on walls, flickering light from a single overhead lamp',
    variants: ['night with moonlight', 'rainy with puddles', 'foggy and mysterious', 'daytime with harsh shadows', 'neon signs reflecting']
  },
  {
    id: 'police-station',
    name: 'Police Station',
    category: 'urban',
    promptDescription: 'Interior or exterior of a metropolitan police station, badge emblems on walls, officers at desks, holding cells visible, fluorescent lighting, bulletproof glass windows, wanted posters on bulletin boards',
    variants: ['exterior with patrol cars', 'busy interior bullpen', 'interrogation room', 'evidence room', 'night shift quiet']
  },
  {
    id: 'hospital-room',
    name: 'Hospital Room',
    category: 'urban',
    promptDescription: 'A sterile hospital patient room with adjustable bed, IV drip stand, heart monitor equipment, white walls and curtains, large window with blinds, visitor chairs, medical charts on the wall',
    variants: ['daytime with sunlight', 'nighttime with dim lighting', 'ICU with more equipment', 'empty and abandoned', 'busy with medical staff']
  },
  {
    id: 'office-building-lobby',
    name: 'Office Building Lobby',
    category: 'urban',
    promptDescription: 'A modern corporate office lobby with marble floors, reception desk, elevators with brass doors, potted plants, security turnstiles, large windows with city view, contemporary art on walls',
    variants: ['morning with employees arriving', 'empty after hours', 'busy midday', 'emergency evacuation', 'holiday decorated']
  },
  {
    id: 'subway-station',
    name: 'Subway Station',
    category: 'urban',
    promptDescription: 'An underground subway platform with tiled walls, tracks below, arrival/departure board, yellow safety line, benches, vending machines, tunnel darkness on either end, fluorescent lighting overhead',
    variants: ['crowded rush hour', 'empty late night', 'train arriving', 'abandoned/derelict', 'under construction']
  },
  {
    id: 'bridge',
    name: 'Bridge',
    category: 'urban',
    promptDescription: 'A large suspension or cable-stayed bridge spanning a river or harbor, steel cables and support towers, multiple lanes of traffic, pedestrian walkway, water below reflecting lights',
    variants: ['golden hour sunset', 'nighttime with lights', 'foggy morning', 'during traffic jam', 'abandoned/destroyed']
  },
  {
    id: 'parking-garage',
    name: 'Parking Garage',
    category: 'urban',
    promptDescription: 'A multi-level concrete parking structure with painted lines, numbered columns, fluorescent lights, parked vehicles, exit signs, ramps between levels, oil stains on the floor',
    variants: ['underground dark level', 'rooftop open air', 'nearly empty at night', 'busy shopping hours', 'crime scene with police tape']
  },

  // ==================== NATURE ====================
  {
    id: 'forest-clearing',
    name: 'Forest Clearing',
    category: 'nature',
    promptDescription: 'A peaceful circular clearing in a dense forest, tall trees surrounding the edges, soft grass and wildflowers, dappled sunlight filtering through leaves, fallen logs, birdsong atmosphere',
    variants: ['sunny afternoon', 'misty morning', 'autumn with fallen leaves', 'moonlit night', 'magical with fireflies']
  },
  {
    id: 'mountain-peak',
    name: 'Mountain Peak',
    category: 'nature',
    promptDescription: 'A dramatic rocky mountain summit above the clouds, snow-capped peaks in the distance, thin air atmosphere, panoramic vista, wind-swept rocks, possible flag or cairn marker',
    variants: ['sunrise golden hour', 'stormy with dark clouds', 'clear blue sky day', 'sunset with orange sky', 'blizzard conditions']
  },
  {
    id: 'beach-shoreline',
    name: 'Beach Shoreline',
    category: 'nature',
    promptDescription: 'A sandy beach at the water edge, waves gently rolling in, seashells scattered on sand, distant horizon where ocean meets sky, foam patterns in the shallow water, possible rocks or driftwood',
    variants: ['tropical sunny day', 'dramatic stormy weather', 'sunset with orange reflections', 'moonlit night', 'foggy mysterious']
  },
  {
    id: 'desert-landscape',
    name: 'Desert Landscape',
    category: 'nature',
    promptDescription: 'A vast arid desert with rolling sand dunes, scattered rocks and boulders, distant mesas or rock formations, heat shimmer in the air, sparse vegetation, endless horizon',
    variants: ['blazing midday sun', 'sunset with long shadows', 'starry night with milky way', 'sandstorm approaching', 'oasis with palm trees']
  },
  {
    id: 'cave-entrance',
    name: 'Cave Entrance',
    category: 'nature',
    promptDescription: 'The mouth of a natural cave in a rocky hillside, darkness receding into the depths, moss and vegetation around the entrance, stalactites visible, light streaming in from outside',
    variants: ['bright exterior daylight', 'torch-lit interior', 'mysterious glowing depths', 'icy with frozen formations', 'underwater cave entrance']
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    category: 'nature',
    promptDescription: 'A majestic waterfall cascading down rocky cliffs, mist rising from the pool below, lush vegetation on either side, rainbow in the spray, moss-covered rocks, serene pool at the base',
    variants: ['bright sunny day', 'moonlit night', 'frozen in winter', 'tropical jungle setting', 'hidden behind vines']
  },
  {
    id: 'open-field',
    name: 'Open Field',
    category: 'nature',
    promptDescription: 'A wide open grassy meadow stretching to the horizon, rolling gentle hills, wildflowers dotted throughout, big open sky above, possible lone tree or fence in the distance',
    variants: ['sunny summer day', 'golden wheat field', 'stormy sky approaching', 'covered in morning dew', 'winter with snow cover']
  },
  {
    id: 'snowy-tundra',
    name: 'Snowy Tundra',
    category: 'nature',
    promptDescription: 'A frozen arctic landscape with endless snow and ice, sparse vegetation poking through, distant frozen mountains, harsh cold atmosphere, overcast sky, wind-blown snow drifts',
    variants: ['aurora borealis night', 'blinding blizzard', 'clear cold day', 'polar sunset', 'spring thaw with puddles']
  },

  // ==================== INTERIOR ====================
  {
    id: 'living-room',
    name: 'Living Room',
    category: 'interior',
    promptDescription: 'A comfortable residential living room with sofa and armchairs, coffee table, bookshelves, TV or fireplace, family photos on walls, soft carpet, warm homey atmosphere, windows with curtains',
    variants: ['cozy evening with lamp light', 'bright morning sunlight', 'holiday decorated', 'ransacked/destroyed', 'luxurious mansion style']
  },
  {
    id: 'laboratory',
    name: 'Laboratory',
    category: 'interior',
    promptDescription: 'A scientific research laboratory with lab benches covered in equipment, beakers and test tubes, computer monitors displaying data, microscopes, chemical storage, bright fluorescent lighting, safety equipment',
    variants: ['active experiment in progress', 'abandoned/destroyed', 'secret underground lab', 'futuristic high-tech', 'mad scientist chaos']
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    category: 'interior',
    promptDescription: 'A large industrial warehouse space with high ceilings, stacked crates and pallets, forklift vehicles, loading dock doors, metal support beams, overhead lighting with shadows',
    variants: ['abandoned and dusty', 'active shipping operation', 'converted to villain lair', 'fight scene damaged', 'nighttime with flashlights']
  },
  {
    id: 'throne-room',
    name: 'Throne Room',
    category: 'interior',
    promptDescription: 'A grand royal throne room with ornate elevated throne, red carpet leading to steps, tall columns, banners and tapestries on walls, stained glass windows, guards stationed at doors',
    variants: ['grand ceremony gathering', 'empty and imposing', 'dark and menacing', 'destroyed after battle', 'medieval vs futuristic style']
  },
  {
    id: 'prison-cell',
    name: 'Prison Cell',
    category: 'interior',
    promptDescription: 'A small confined prison cell with metal bars or reinforced door, simple cot bed, toilet and sink, scratched walls with tally marks, harsh overhead light, concrete floors',
    variants: ['high security supermax', 'old dungeon style', 'futuristic containment', 'cell door open/broken', 'multiple cells visible']
  },
  {
    id: 'bar-tavern',
    name: 'Bar/Tavern',
    category: 'interior',
    promptDescription: 'A rustic bar or tavern interior with wooden bar counter, shelves of bottles, bar stools, dim ambient lighting, pool table or dartboard, booths along the walls, neon beer signs',
    variants: ['busy night crowd', 'empty afternoon', 'brawl in progress', 'upscale cocktail lounge', 'fantasy medieval tavern']
  },
  {
    id: 'library-study',
    name: 'Library/Study',
    category: 'interior',
    promptDescription: 'A scholarly library or private study with floor-to-ceiling bookshelves, leather armchair, wooden desk with lamp, rolling ladder, antique globe, warm reading light atmosphere',
    variants: ['grand public library', 'cozy private study', 'secret hidden room', 'ancient magical archive', 'modern sleek design']
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    category: 'interior',
    promptDescription: 'A residential or commercial kitchen with countertops, stove and oven, refrigerator, hanging pots and pans, sink with window above, cooking utensils, possibly food preparation in progress',
    variants: ['homey family kitchen', 'professional restaurant kitchen', 'messy after cooking', 'abandoned and dirty', 'futuristic smart kitchen']
  },

  // ==================== FANTASY ====================
  {
    id: 'castle-exterior',
    name: 'Castle Exterior',
    category: 'fantasy',
    promptDescription: 'A magnificent medieval castle with tall stone towers, crenellated walls, drawbridge over moat, banners flying from parapets, courtyard visible, mountains or forest in background',
    variants: ['sunny fairy tale style', 'dark and foreboding', 'under siege with fire', 'ruined and overgrown', 'floating in the sky']
  },
  {
    id: 'dragons-lair',
    name: "Dragon's Lair",
    category: 'fantasy',
    promptDescription: 'A vast cavern serving as a dragon dwelling, piles of gold coins and treasure, scattered bones, scorch marks on walls, massive nest area, eerie glow from crystals or lava',
    variants: ['dragon present sleeping', 'empty lair with treasure', 'volcanic with lava pools', 'icy frozen cavern', 'ancient with cobwebs']
  },
  {
    id: 'enchanted-forest',
    name: 'Enchanted Forest',
    category: 'fantasy',
    promptDescription: 'A magical forest with bioluminescent plants and flowers, twisted ancient trees with faces, floating sparkles and fairy lights, mushroom rings, ethereal mist, otherworldly colors',
    variants: ['bright and whimsical', 'dark and corrupted', 'autumn fairy realm', 'underwater-like atmosphere', 'covered in magical snow']
  },
  {
    id: 'floating-island',
    name: 'Floating Island',
    category: 'fantasy',
    promptDescription: 'A landmass suspended in the sky defying gravity, waterfalls cascading off edges into clouds below, buildings or vegetation on top, chains or magical energy keeping it aloft, other islands visible in distance',
    variants: ['tropical paradise', 'rocky barren', 'ancient civilization ruins', 'connected by bridges', 'breaking apart/falling']
  },
  {
    id: 'ancient-temple',
    name: 'Ancient Temple',
    category: 'fantasy',
    promptDescription: 'A weathered stone temple from a lost civilization, towering columns, intricate carvings and hieroglyphics, altar at center, overgrown with vines, shafts of light through ceiling gaps',
    variants: ['jungle temple Mayan style', 'Greek/Roman ruins', 'Egyptian with hieroglyphics', 'underwater submerged', 'still active with worshippers']
  },
  {
    id: 'magical-portal',
    name: 'Magical Portal',
    category: 'fantasy',
    promptDescription: 'A mystical gateway to another dimension, swirling energy within the frame, ornate archway with runes, reality bending around edges, glimpse of other world through the opening, magical particles emanating',
    variants: ['stable and inviting', 'unstable and dangerous', 'ancient stone archway', 'modern tech-magic hybrid', 'mirror-like surface']
  },

  // ==================== SCIFI ====================
  {
    id: 'spaceship-bridge',
    name: 'Spaceship Bridge',
    category: 'scifi',
    promptDescription: 'The command center of a spacecraft with captain chair, multiple control stations, large viewport showing stars or planet, holographic displays, crew positions, sleek futuristic design',
    variants: ['calm cruising', 'red alert battle stations', 'damaged and sparking', 'abandoned derelict', 'alien design aesthetic']
  },
  {
    id: 'space-station',
    name: 'Space Station',
    category: 'scifi',
    promptDescription: 'An orbital space station interior or exterior, modular sections connected by corridors, docking bays, observation windows showing Earth or stars, artificial gravity indicators, airlock doors',
    variants: ['exterior full view', 'interior corridor', 'docking bay', 'damaged/decompressing', 'luxury civilian station']
  },
  {
    id: 'alien-planet-surface',
    name: 'Alien Planet Surface',
    category: 'scifi',
    promptDescription: 'The surface of an extraterrestrial world with alien sky colors, strange rock formations, unusual vegetation, multiple moons or suns visible, otherworldly atmosphere, unfamiliar terrain',
    variants: ['barren rocky', 'lush alien jungle', 'toxic atmosphere', 'crystalline formations', 'alien civilization visible']
  },
  {
    id: 'cyberpunk-street',
    name: 'Cyberpunk Street',
    category: 'scifi',
    promptDescription: 'A neon-drenched urban street in a dystopian future, holographic advertisements, rain-slicked pavement reflecting lights, flying vehicles overhead, augmented humans, towering megastructures',
    variants: ['rainy neon night', 'crowded market', 'abandoned sector', 'corporate district', 'underground black market']
  },
  {
    id: 'robot-factory',
    name: 'Robot Factory',
    category: 'scifi',
    promptDescription: 'An automated manufacturing facility producing robots or androids, assembly line with robotic arms, partially assembled units, quality control stations, industrial lighting, conveyor systems',
    variants: ['active production', 'abandoned/shut down', 'robot uprising scene', 'secret military facility', 'organic-machine hybrid']
  },
  {
    id: 'virtual-reality-grid',
    name: 'Virtual Reality Grid',
    category: 'scifi',
    promptDescription: 'A digital cyberspace environment with geometric grid lines extending to infinity, floating data constructs, glowing wireframe objects, abstract digital landscape, code or symbols visible',
    variants: ['clean blue grid', 'corrupted glitching', 'neon city construct', 'abstract data visualization', 'breaking down/collapsing']
  },

  // ==================== GENERIC ====================
  {
    id: 'plain-background',
    name: 'Plain Background',
    category: 'generic',
    promptDescription: 'A simple solid color or subtle gradient background with no distinct environment, neutral tones allowing character focus, soft lighting with no harsh shadows',
    variants: ['white/light gray', 'dark/black', 'warm sepia tones', 'cool blue tones', 'character color coordinated']
  },
  {
    id: 'dramatic-sky',
    name: 'Dramatic Sky',
    category: 'generic',
    promptDescription: 'An expressive sky backdrop with dramatic cloud formations, intense lighting, character silhouetted or floating, sense of epic scale, horizon barely visible or not present',
    variants: ['golden sunset clouds', 'stormy dark thunderheads', 'peaceful blue with wisps', 'apocalyptic red/orange', 'starfield space view']
  },
  {
    id: 'abstract-energy',
    name: 'Abstract Energy',
    category: 'generic',
    promptDescription: 'An abstract background of swirling energy and power, radiating lines and particles, no defined environment, explosive or implosive motion, character power manifestation',
    variants: ['fire/orange energy', 'electric/blue lightning', 'dark/purple corruption', 'golden/white holy power', 'green/nature energy']
  }
];

// Helper function to get locations by category
export function getLocationsByCategory(category: LocationCategory): Location[] {
  return LOCATION_LIBRARY.filter(loc => loc.category === category);
}

// Helper function to get a location by ID
export function getLocationById(id: string): Location | undefined {
  return LOCATION_LIBRARY.find(loc => loc.id === id);
}

// Get all unique categories
export function getAllCategories(): LocationCategory[] {
  return ['urban', 'nature', 'interior', 'fantasy', 'scifi', 'generic'];
}

// Category display names for UI
export const CATEGORY_DISPLAY_NAMES: Record<LocationCategory, string> = {
  urban: 'Urban',
  nature: 'Nature',
  interior: 'Interior',
  fantasy: 'Fantasy',
  scifi: 'Sci-Fi',
  generic: 'Generic'
};
