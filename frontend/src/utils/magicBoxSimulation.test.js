import { parseNarrative } from './narrativeParser.js';

// Mock Data based on User Example
const mockCharacters = [
    { id: 1, name: 'Abbabox', description: 'Adult male, late-30s...' },
    { id: 2, name: 'Main Character', description: 'Mysterious figure...' }
];

const mockEvents = [
    { id: 101, description: 'Abbabox ready to start stream' },
    { id: 102, description: 'Main Character busts into the room' },
    { id: 103, description: 'Main character yells "Let\'s RPG BITCHES!"' }
];

const mockStyles = {
    compositions: ['Foreground occlusion peeking', 'Comic panel breakout'],
    lightings: ['Volumetric god rays', 'Smartphone face glow'],
    moods: ['Righteous fury', 'Coffee shop chill'],
    cameras: ['Static tripod tableau', 'Dashcam perspective'],
    postProcessings: ['Glitch art artifacts', 'Ben-Day dots overlay'],
    presets: [
        { label: 'Vaporwave', value: 'vaporwave aesthetic, glitch art, pastel gradients, greek statues, grid backgrounds' },
        { label: '90s Anti-Hero Comic', value: '90s comic book style, excessive cross-hatching, extreme musculature, pouches, grit, dynamic posing' }
    ]
};

console.log('--- Magic Box Simulation ---');

// Scenario 1: Natural Language Story
const storyInput = `
Abbabox ready to start stream. 
Suddenly, Main Character busts into the room.
Main character yells "Let's RPG BITCHES!"
The scene has Volumetric god rays and a Righteous fury mood.
Shot with a Static tripod tableau and Glitch art artifacts.
Style is vaporwave aesthetic.
`;

console.log('\nScenario 1: Natural Language Input');
console.log('Input:', storyInput.trim());
const result1 = parseNarrative(storyInput, [], mockCharacters, mockEvents, mockStyles);
console.log('Result:', JSON.stringify(result1, null, 2));


// Scenario 3: New Options Test
const newOptionsInput = `
Just chilling in a Coffee shop chill vibe.
Lighting is Smartphone face glow.
Shot from a Dashcam perspective with Ben-Day dots overlay.
Style is 90s Anti-Hero Comic.
Composition is Comic panel breakout.
`;

console.log('\nScenario 3: New Options Test');
console.log('Input:', newOptionsInput.trim());
const result3 = parseNarrative(newOptionsInput, [], mockCharacters, mockEvents, mockStyles);
console.log('Result:', JSON.stringify(result3, null, 2));
