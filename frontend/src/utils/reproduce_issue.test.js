import { parseNarrative } from './narrativeParser.js';

const mockCharacters = [
    { id: 1, name: 'Abbabox', description: '...' },
    { id: 2, name: 'Main Character', description: '...' }
];

const mockScenes = [
    { id: 10, title: 'Cave ', description: 'A dark cave' }
];

const mockEvents = [];
const mockStyles = {};

const userInput = `Abbabox and Main Character in a cave, Abbaox is tossing a coin in the air and it hit the ceiling and Main Character dives for it.`;

console.log('--- Reproduction Test ---');
console.log('Input:', userInput);

const result = parseNarrative(userInput, mockScenes, mockCharacters, mockEvents, mockStyles);

console.log('Result:', JSON.stringify(result, null, 2));

if (result.matchedCharacterIds.includes(1) && result.matchedCharacterIds.includes(2) && result.matchedSceneId === 10) {
    console.log('SUCCESS: All items matched.');
} else {
    console.log('FAILURE: Missing matches.');
    if (!result.matchedCharacterIds.includes(1)) console.log('- Failed to match Abbabox');
    if (!result.matchedCharacterIds.includes(2)) console.log('- Failed to match Main Character');
    if (result.matchedSceneId !== 10) console.log('- Failed to match Cave');
}
