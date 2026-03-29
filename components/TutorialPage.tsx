/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';

export interface TutorialPageProps {
    show: boolean;
    onBack: () => void;
}

const SECTIONS = [
    { id: 'overview', label: 'App Overview', icon: '🦸' },
    { id: 'setup', label: 'Setup & Cast', icon: '🎭' },
    { id: 'modes', label: 'Generation Modes', icon: '🎲' },
    { id: 'ai', label: 'AI Features', icon: '🤖' },
    { id: 'reroll', label: 'Rerolling', icon: '🔄' },
    { id: 'export', label: 'Export & Gallery', icon: '📤' },
    { id: 'troubleshoot', label: 'Troubleshooting', icon: '🔧' },
];

const SectionHeader: React.FC<{ id: string; icon: string; title: string; color?: string }> = ({
    id, icon, title, color = 'bg-yellow-400'
}) => (
    <div id={id} className={`${color} border-[3px] border-black px-4 py-2 flex items-center gap-3 shadow-[4px_4px_0_rgba(0,0,0,0.4)] scroll-mt-28`}>
        <span className="text-2xl">{icon}</span>
        <h2 className="font-comic text-xl font-bold uppercase tracking-tight">{title}</h2>
    </div>
);

const Tip: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = 'bg-blue-50 border-blue-300', children }) => (
    <div className={`${color} border-l-4 p-3 rounded-r font-comic text-sm`}>{children}</div>
);

const Table: React.FC<{ headers: string[]; rows: string[][] }> = ({ headers, rows }) => (
    <div className="overflow-x-auto">
        <table className="w-full border-[2px] border-black font-comic text-sm">
            <thead>
                <tr className="bg-black text-white">
                    {headers.map(h => <th key={h} className="px-3 py-2 text-left font-bold">{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell, j) => <td key={j} className="px-3 py-2 border-t border-gray-200">{cell}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const TutorialPage: React.FC<TutorialPageProps> = ({ show, onBack }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    if (!show) return null;

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="fixed inset-0 z-[620] bg-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-black text-white px-4 py-3 flex items-center gap-4 border-b-4 border-black flex-shrink-0">
                <button
                    onClick={onBack}
                    className="comic-btn bg-yellow-400 text-black px-3 py-1.5 text-sm border-2 border-yellow-600 hover:bg-yellow-300 font-bold font-comic flex items-center gap-1"
                    aria-label="Go back"
                >
                    ← Go Back
                </button>
                <div>
                    <h1 className="font-comic text-xl md:text-2xl font-bold uppercase tracking-tight">
                        📖 Complete Guide — Infinite Heroes
                    </h1>
                    <p className="font-comic text-gray-400 text-xs mt-0.5">Everything you need to create amazing comics with AI</p>
                </div>
            </div>

            {/* Sticky section nav */}
            <div className="flex-shrink-0 bg-gray-100 border-b-4 border-black overflow-x-auto">
                <div className="flex gap-1 p-2 min-w-max">
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => scrollTo(s.id)}
                            className="px-3 py-1.5 font-comic text-xs font-bold border-2 border-black bg-white hover:bg-yellow-100 transition-colors whitespace-nowrap"
                        >
                            {s.icon} {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 pb-16">

                    {/* ── 1. APP OVERVIEW ── */}
                    <section className="space-y-3">
                        <SectionHeader id="overview" icon="🦸" title="App Overview" color="bg-yellow-400" />
                        <p className="font-comic text-sm text-gray-700">
                            <strong>Infinite Heroes</strong> is an AI-powered comic book creator. Upload your character photos, describe your story, and the AI generates a complete illustrated comic — cover, pages, and back cover — in your chosen art style.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { term: 'Persona', def: 'Your character definition — portrait photos, backstory, emblem, and weapon references you upload.' },
                                { term: 'Character Profile', def: 'AI-generated visual description of your character (face, clothing, colors) used to keep them consistent across all panels.' },
                                { term: 'Beat', def: 'A single comic panel\'s narrative: caption, dialogue, scene description, and which characters appear.' },
                            ].map(({ term, def }) => (
                                <div key={term} className="bg-white border-[2px] border-black p-3 shadow-[3px_3px_0_rgba(0,0,0,0.3)]">
                                    <p className="font-comic font-bold text-sm text-blue-700 uppercase">{term}</p>
                                    <p className="font-comic text-xs text-gray-600 mt-1">{def}</p>
                                </div>
                            ))}
                        </div>
                        <Tip color="bg-amber-50 border-amber-400">
                            <strong>How it all fits together:</strong> You provide Personas (photos + descriptions) → AI creates Character Profiles → AI writes Beats (story panels) → AI generates panel images using both your photos and profiles for consistency.
                        </Tip>
                    </section>

                    {/* ── 2. SETUP & CAST ── */}
                    <section className="space-y-3">
                        <SectionHeader id="setup" icon="🎭" title="Setup & Cast" color="bg-blue-400" />

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Characters</h3>
                                <div className="space-y-2 font-comic text-sm">
                                    <p><strong>Hero</strong> — Required. Your main protagonist. Upload a clear portrait (front-facing face shot works best).</p>
                                    <p><strong>Co-Star</strong> — Optional but recommended. A sidekick, villain, or love interest. Same portrait rules apply.</p>
                                    <p><strong>Additional Characters</strong> — Add up to 4 more supporting characters.</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Reference Images (per character)</h3>
                                <Table
                                    headers={['Type', 'Purpose', 'Tips']}
                                    rows={[
                                        ['Portrait (required)', 'Main face reference for AI generation', 'Front-facing, well-lit, unobstructed face'],
                                        ['Extra refs', 'Multiple angles improve consistency', 'Add 2–3 shots: side profile, 3/4 view'],
                                        ['Emblem', 'Logo/symbol on costume (like Superman\'s S)', 'PNG with transparent bg works best'],
                                        ['Weapon', 'Signature weapon or equipment', 'Clear isolated shot of the weapon'],
                                    ]}
                                />
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Backstory & Details</h3>
                                <p className="font-comic text-sm text-gray-700">Write detailed character descriptions in the Backstory field. The AI uses this to write in-character dialogue and describe costumes. More detail = better results.</p>
                                <div className="mt-2 bg-green-50 border-l-4 border-green-400 p-3 font-comic text-sm">
                                    <strong>Good backstory example:</strong> "Aria Chen, 28, a biochemist by day and tech-powered hero by night. Wears a sleek black bodysuit with neon-blue circuit patterns. Powers: electromagnetic field manipulation. Determined, witty, driven by justice after her lab was destroyed by corporate saboteurs."
                                </div>
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Story Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-comic text-sm">
                                    {[
                                        ['Genre / Tone', 'Sets the narrative style — Superhero, Horror, Romance, Sci-Fi, Fantasy, etc.'],
                                        ['Art Style', 'Visual aesthetic for all panels — Manga, Golden Age, Modern Comic, Painted, etc.'],
                                        ['Page Length', 'Short (8–12 pages), Standard (16–20 pages), Long (24–32 pages)'],
                                        ['Story Premise', 'Describe your story setup in detail. This is the most impactful field — be specific!'],
                                        ['Publisher Info', 'Appears on the cover — your publisher name, issue number, price, date'],
                                        ['Language', 'Dialogue and captions are generated in the selected language'],
                                    ].map(([label, desc]) => (
                                        <div key={label} className="bg-white border border-gray-300 p-2 rounded">
                                            <p className="font-bold text-xs text-gray-800">{label}</p>
                                            <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Presets</h3>
                                <p className="font-comic text-sm text-gray-700">Save your genre, art style, page length, and story premise as a preset. Load it later to quickly start a new story with the same settings. Use the Preset Editor to manage saved presets.</p>
                            </div>
                        </div>
                    </section>

                    {/* ── 3. GENERATION MODES ── */}
                    <section className="space-y-3">
                        <SectionHeader id="modes" icon="🎲" title="Generation Modes" color="bg-purple-400" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border-[3px] border-black p-4 bg-purple-50 shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                                <p className="font-comic font-bold text-lg text-purple-800 uppercase">🎲 Novel Mode</p>
                                <p className="font-comic text-xs text-purple-600 mb-2">Interactive, choice-driven storytelling</p>
                                <ol className="font-comic text-sm space-y-1 list-decimal list-inside text-gray-700">
                                    <li>Cover generates first</li>
                                    <li>First batch of story pages generates</li>
                                    <li>Story pauses — you pick a narrative choice (A or B)</li>
                                    <li>Next batch generates based on your choice</li>
                                    <li>Continues until the story concludes</li>
                                </ol>
                                <div className="mt-3 bg-purple-100 p-2 rounded font-comic text-xs text-purple-800">
                                    <strong>Best for:</strong> Exploring "what if" scenarios, branching stories, interactive sessions
                                </div>
                            </div>
                            <div className="border-[3px] border-black p-4 bg-amber-50 shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                                <p className="font-comic font-bold text-lg text-amber-800 uppercase">📖 Outline Mode</p>
                                <p className="font-comic text-xs text-amber-600 mb-2">Fully planned, automated generation</p>
                                <ol className="font-comic text-sm space-y-1 list-decimal list-inside text-gray-700">
                                    <li>AI generates a complete story outline</li>
                                    <li>You review and edit the outline</li>
                                    <li>Click Confirm to start generation</li>
                                    <li>Cover + all pages generate automatically</li>
                                    <li>Back cover generates last</li>
                                </ol>
                                <div className="mt-3 bg-amber-100 p-2 rounded font-comic text-xs text-amber-800">
                                    <strong>Best for:</strong> Planned stories with a defined arc, hands-off generation, longer comics
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Mode Comparison</h3>
                            <Table
                                headers={['Feature', 'Novel Mode', 'Outline Mode']}
                                rows={[
                                    ['User involvement', 'High — makes choices', 'Low — set and wait'],
                                    ['Story control', 'Narrative branches', 'Full outline upfront'],
                                    ['Generation speed', 'Batch-by-batch', 'All at once'],
                                    ['Best page length', 'Any', 'Standard or Long'],
                                    ['Outline step', 'No', 'Yes — review & edit'],
                                ]}
                            />
                        </div>

                        <Tip color="bg-blue-50 border-blue-400">
                            <strong>Use Saved Profiles:</strong> If you have previously generated character profiles, check "Use Saved Profiles" before launching. This skips the profile generation step and speeds up startup significantly.
                        </Tip>
                    </section>

                    {/* ── 4. AI FEATURES ── */}
                    <section className="space-y-3">
                        <SectionHeader id="ai" icon="🤖" title="AI Features" color="bg-green-400" />

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Character Profiles</h3>
                                <p className="font-comic text-sm text-gray-700">After launching, the AI analyzes each character's portrait and generates a detailed visual profile describing face shape, skin tone, hair, eye color, clothing, and distinctive features. This profile is injected into every panel prompt to maintain visual consistency.</p>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <Tip color="bg-green-50 border-green-400">
                                        <strong>Edit profiles</strong> in the Profiles dialog if the AI misidentifies features (wrong hair color, missed glasses, etc.). Edits apply to all subsequent generations.
                                    </Tip>
                                    <Tip color="bg-red-50 border-red-400">
                                        <strong>Hard Negatives</strong> — list things to NEVER include: "beard, glasses, grey hair". These are forbidden in every image prompt for that character.
                                    </Tip>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">AI Improve</h3>
                                <p className="font-comic text-sm text-gray-700">Available in Setup (for story description) and per character (for backstory). Click "AI Improve" and the AI rewrites your text to be richer, more detailed, and better suited for comic generation. You can undo with the Undo button.</p>
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Surprise Me</h3>
                                <p className="font-comic text-sm text-gray-700">The "Surprise Me" button in Setup lets the AI generate a complete story premise for you. You can choose whether to base it on your current characters' backstories and whether to keep existing settings (genre, art style). Add extra context in the input field to guide the AI.</p>
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Outline Generation (Outline Mode)</h3>
                                <p className="font-comic text-sm text-gray-700">In Outline Mode, the AI creates a beat-by-beat story outline covering every page. The outline editor lets you:</p>
                                <ul className="font-comic text-sm list-disc list-inside text-gray-700 mt-1 space-y-1">
                                    <li>Read and edit each beat before generation starts</li>
                                    <li>Add, remove, or reorder story beats</li>
                                    <li>Regenerate specific beats or the entire outline</li>
                                    <li>Confirm when you're happy to start full generation</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Single Image Generator</h3>
                                <p className="font-comic text-sm text-gray-700">Access from the toolbar (camera icon). Generates standalone images outside the comic flow — 4 modes:</p>
                                <Table
                                    headers={['Tab', 'What it generates']}
                                    rows={[
                                        ['Main Image', 'Any character or scene illustration'],
                                        ['Emblem', 'Logo or symbol design'],
                                        ['Weapon', 'Weapon or equipment asset'],
                                        ['Reference Sheet', 'Character in a specific pose (Front, Side, Back, 3/4, Iconic)'],
                                    ]}
                                />
                                <p className="font-comic text-xs text-gray-500 mt-1">All single images are saved to your Global Gallery.</p>
                            </div>
                        </div>
                    </section>

                    {/* ── 5. REROLLING ── */}
                    <section className="space-y-3">
                        <SectionHeader id="reroll" icon="🔄" title="Rerolling & Refinement" color="bg-red-400" />

                        <p className="font-comic text-sm text-gray-700">Click any panel in the comic reader to open the Reroll panel. You can regenerate any page with different modes, instructions, and visual style overrides.</p>

                        <div>
                            <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Quick Presets — Pick Your Mode</h3>
                            <p className="font-comic text-sm text-gray-700 mb-2">The top row of the Reroll panel has one-click presets. Each preset selects the right regeneration mode and pre-fills an instruction for you.</p>
                            <Table
                                headers={['Preset', 'Mode used', 'What it does']}
                                rows={[
                                    ['Full Reroll', 'Full', 'Regenerates everything — characters, scene, composition'],
                                    ['Fix Character', 'Characters Only', 'Keeps background, fixes character appearance'],
                                    ['Fix Expression', 'Expression Only', 'Fixes facial expressions only'],
                                    ['Fix Outfit', 'Outfit Only', 'Fixes costumes and clothing only'],
                                    ['Fix Emblem', 'Emblem Only', 'Corrects the logo or emblem on the costume'],
                                    ['Fix Weapon', 'Weapon Only', 'Corrects the weapon or equipment'],
                                ]}
                            />
                            <Tip color="bg-yellow-50 border-yellow-400">
                                <strong>Tip:</strong> Tap a preset to apply it instantly. Tap it again to deselect and go back to Full Reroll. You can still edit the instruction text after selecting a preset.
                            </Tip>
                        </div>

                        <div>
                            <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Instructions & Negative Prompt</h3>
                            <p className="font-comic text-sm text-gray-700">Write specific instructions telling the AI what to change. The more specific, the better results.</p>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="bg-red-50 border border-red-200 p-2 rounded font-comic text-xs">
                                    <p className="font-bold text-red-700 mb-1">Vague (less effective):</p>
                                    <p className="text-gray-700">"Make it better" / "Fix the character"</p>
                                </div>
                                <div className="bg-green-50 border border-green-200 p-2 rounded font-comic text-xs">
                                    <p className="font-bold text-green-700 mb-1">Specific (more effective):</p>
                                    <p className="text-gray-700">"Hero landing on rooftop, cape billowing, city skyline visible, dramatic low-angle shot"</p>
                                </div>
                            </div>
                            <div className="mt-2 space-y-2">
                                <Tip color="bg-purple-50 border-purple-400">
                                    <strong>AI Improve:</strong> Type a rough idea and click "AI Improve" — the AI expands it into a detailed, production-ready instruction.
                                </Tip>
                                <Tip color="bg-red-50 border-red-400">
                                    <strong>Exclude from Image:</strong> Use the red "Exclude" field to list things you don't want — e.g. "no mask, no helmet, no cape". Applied on top of your instructions.
                                </Tip>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Strength Slider</h3>
                            <p className="font-comic text-sm text-gray-700">Controls how aggressively the AI changes the panel. Lower strength = subtle adjustments (good for minor fixes). Full strength = complete regeneration.</p>
                        </div>

                        <div>
                            <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Expert Mode — Visual Style Overrides</h3>
                            <p className="font-comic text-sm text-gray-700 mb-2">Toggle Expert Mode (🔧 button in the header) to access visual style controls and character profile editing.</p>
                            <Table
                                headers={['Control', 'What it does']}
                                rows={[
                                    ['📷 Camera Shot', 'Override the panel framing — XCU, Close-up, Medium, Full, Wide, Establishing'],
                                    ['💬 Dialogue Style', 'Change speech balloon shape — Normal, Shouting, Whisper, Radio, Robot, etc.'],
                                    ['📜 Flashback Styling', 'Apply sepia tones and soft vignette for memory/flashback scenes'],
                                    ['Character Profiles', 'Edit the AI\'s visual description of each character directly in the reroll panel'],
                                ]}
                            />
                            <Tip color="bg-blue-50 border-blue-400">
                                <strong>Pose & Location:</strong> Inside the instruction area, expand "Pose & Location" to pick from a library of predefined character poses and scene locations. Selecting one appends the prompt text automatically.
                            </Tip>
                        </div>

                        <div>
                            <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Version History</h3>
                            <p className="font-comic text-sm text-gray-700">Every reroll creates a new version. Each panel stores up to 10 versions. Click 📜 History in the header to browse previous versions and revert to any of them.</p>
                        </div>

                        <div>
                            <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Quick Reroll (🎲 button)</h3>
                            <p className="font-comic text-sm text-gray-700">Each panel has a 🎲 button in the corner. Tap it for a one-click Full Reroll with no configuration needed. On mobile it shows at reduced opacity — tap the panel area to open the full Reroll panel instead.</p>
                        </div>
                    </section>

                    {/* ── 6. EXPORT & GALLERY ── */}
                    <section className="space-y-3">
                        <SectionHeader id="export" icon="📤" title="Export & Gallery" color="bg-cyan-400" />

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Comic Gallery (Page View)</h3>
                                <p className="font-comic text-sm text-gray-700">Click Gallery in the toolbar to view all generated pages in a grid. You can:</p>
                                <ul className="font-comic text-sm list-disc list-inside text-gray-700 mt-1 space-y-1">
                                    <li><strong>Drag to reorder</strong> pages — changes reading order instantly</li>
                                    <li><strong>Replace a page</strong> with your own artwork by clicking the upload icon</li>
                                    <li><strong>Delete pages</strong> you don't want</li>
                                    <li>Mix AI-generated and hand-drawn pages freely</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Global Gallery</h3>
                                <p className="font-comic text-sm text-gray-700">A persistent image library that stores all generated images across sessions. Access it from the toolbar. Useful for:</p>
                                <ul className="font-comic text-sm list-disc list-inside text-gray-700 mt-1 space-y-1">
                                    <li>Browsing all previously generated images</li>
                                    <li>Downloading individual images</li>
                                    <li>Images from the Single Image Generator are stored here automatically</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Export PDF</h3>
                                <p className="font-comic text-sm text-gray-700">Export your full comic as a print-ready PDF. Options include:</p>
                                <Table
                                    headers={['Option', 'Details']}
                                    rows={[
                                        ['Page size', 'US Comic (6.625" × 10.25"), A4, Letter, or Square'],
                                        ['Resolution', '150 DPI (web), 200 DPI (standard), 300 DPI (print quality)'],
                                        ['Page range', 'All pages or a custom range'],
                                        ['Margins', 'Include bleed margins for professional printing'],
                                    ]}
                                />
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Export Images</h3>
                                <p className="font-comic text-sm text-gray-700">Export individual pages as PNG, WEBP, or JPEG. Choose quality, page range, and resolution. Each page is exported as a separate image file.</p>
                            </div>

                            <div>
                                <h3 className="font-comic font-bold text-base uppercase border-b-2 border-black pb-1 mb-2">Save & Load Draft</h3>
                                <p className="font-comic text-sm text-gray-700">Save your entire project — characters, story settings, generated pages, and profiles — as a <code>.json</code> draft file. Load it later to continue exactly where you left off. Draft files can be large if you have many pages (each page image is embedded).</p>
                                <Tip color="bg-amber-50 border-amber-400">
                                    <strong>Save often!</strong> The app stores cast data in your browser, but generated pages are only preserved if you save a draft or keep the tab open.
                                </Tip>
                            </div>
                        </div>
                    </section>

                    {/* ── 7. TROUBLESHOOTING ── */}
                    <section className="space-y-3">
                        <SectionHeader id="troubleshoot" icon="🔧" title="Troubleshooting" color="bg-gray-400" />

                        <div className="space-y-2">
                            {[
                                {
                                    q: 'Image generation fails with a safety error',
                                    a: 'The AI image model sometimes refuses prompts it considers unsafe. Try a Full Reroll with different instructions, or edit the story premise to remove potentially triggering content (violence descriptions, specific real-world references, etc.).',
                                },
                                {
                                    q: 'Character looks different on every page',
                                    a: 'Edit the Character Profile (before generation via the Profiles dialog, or during reroll via the Profile tab). Add distinctive features like "bright red hair, always wears blue costume with yellow star" and use Hard Negatives to forbid wrong features. Upload 2–3 reference photos from different angles.',
                                },
                                {
                                    q: 'Generation stops mid-comic',
                                    a: 'This can happen if the API rate limit is reached or a timeout occurs. Click the Resume button (if shown) or try reloading — your progress is preserved. Check your API key usage in Google AI Studio.',
                                },
                                {
                                    q: 'Outline Mode skips the outline step',
                                    a: 'Make sure you select "Outline Mode" on the mode selection screen. If using "Use Saved Profiles", the outline still appears before generation begins. If it still skips, try clearing the story outline via Settings and restarting.',
                                },
                                {
                                    q: 'The reroll button is not visible on mobile',
                                    a: 'The 🎲 button appears at reduced opacity on mobile (it\'s hover-only on desktop). Tap directly on the panel image area to open the full Reroll panel instead.',
                                },
                                {
                                    q: 'API key errors / quota exceeded',
                                    a: 'Go to Settings (gear icon) and verify your Gemini API key is correct. Free-tier keys have usage limits — check your quota at Google AI Studio. The app shows cost estimates in the toolbar to help you track usage.',
                                },
                                {
                                    q: 'Comic generates with Option A / Option B instead of real choices',
                                    a: 'This is a fallback when the AI can\'t generate contextual choices. It typically happens with very short or generic story premises. Add more detail to your story premise and character backstories.',
                                },
                            ].map(({ q, a }) => (
                                <div key={q} className="border-[2px] border-gray-300 rounded overflow-hidden">
                                    <div className="bg-gray-100 px-4 py-2 font-comic font-bold text-sm border-b border-gray-300">
                                        ❓ {q}
                                    </div>
                                    <div className="px-4 py-3 font-comic text-sm text-gray-700">
                                        {a}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Resources */}
                        <div className="border-[3px] border-black p-4 bg-blue-50 shadow-[4px_4px_0_rgba(0,0,0,0.3)] mt-4">
                            <p className="font-comic font-bold text-base uppercase mb-2">📎 Resources & Links</p>
                            <div className="space-y-2 font-comic text-sm">
                                <p>
                                    <strong>GitHub Repository:</strong>{' '}
                                    <a
                                        href="https://github.com/ThiinkMG/infinite-heroes-comic-creator"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline hover:text-blue-800"
                                    >
                                        github.com/ThiinkMG/infinite-heroes-comic-creator
                                    </a>
                                    {' '}— Source code, issues, and updates
                                </p>
                                <p>
                                    <strong>Google AI Studio:</strong>{' '}
                                    <a
                                        href="https://aistudio.google.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline hover:text-blue-800"
                                    >
                                        aistudio.google.com
                                    </a>
                                    {' '}— Get your free Gemini API key, monitor usage and quotas
                                </p>
                            </div>
                        </div>
                    </section>

                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 bg-black text-gray-400 text-center py-2 border-t-4 border-black font-comic text-xs">
                Infinite Heroes Comic Creator —{' '}
                <a
                    href="https://github.com/ThiinkMG/infinite-heroes-comic-creator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 hover:text-yellow-300 underline"
                >
                    View on GitHub
                </a>
            </div>
        </div>
    );
};

export default TutorialPage;
