import { parseNarrative } from './narrativeParser.js';

// Mock Data
const mockCharacters = [
    { id: 1, name: 'Abbabox', description: 'Adult male, late-30s...' },
    { id: 2, name: 'Main Character', description: 'Mysterious figure...' }
];

const mockScenes = [
    { id: 10, title: 'Cave', description: 'A dark cave' }
];

const mockEvents = [];
const mockStyles = {
    compositions: ['Foreground occlusion peeking'],
    presets: [{ label: 'Vaporwave', value: 'vaporwave aesthetic' }]
};

// Simulation of LiveDashboard state
let selectedCharacterIds = [];
let selectedEventIds = [];
let selectedStyles = {};

// Simulation of handleGenerate logic
function handleGenerate(narrative, onGenerateMock) {
    console.log('--- Simulating Generate Now Click ---');
    console.log('Narrative:', narrative);

    // 1. Force Parse
    const result = parseNarrative(narrative, mockScenes, mockCharacters, mockEvents, mockStyles);
    console.log('Parse Result:', JSON.stringify(result, null, 2));

    // 2. Construct Overrides
    const overrides = {
        sceneId: result.matchedSceneId,
        characterIds: Array.from(new Set([...selectedCharacterIds, ...result.matchedCharacterIds])),
        eventIds: Array.from(new Set([...selectedEventIds, ...result.matchedEventIds])),
        ...selectedStyles,
        ...result.matchedStyles
    };

    // 3. Call onGenerate
    onGenerateMock(overrides);
}

// Test Case
const narrativeInput = "Abbabox in a Cave with Vaporwave style";
const onGenerateMock = (overrides) => {
    console.log('\n--- onGenerate Called with Overrides ---');
    console.log(JSON.stringify(overrides, null, 2));

    // Verification
    let success = true;
    if (!overrides.characterIds.includes(1)) {
        console.error('FAIL: Missing Abbabox (ID 1)');
        success = false;
    }
    if (overrides.sceneId !== 10) {
        console.error('FAIL: Incorrect Scene ID (Expected 10)');
        success = false;
    }
    if (overrides.stylePreset !== 'vaporwave aesthetic') {
        console.error('FAIL: Incorrect Style Preset');
        success = false;
    }

    if (success) {
        console.log('SUCCESS: All overrides match expected values.');
    } else {
        console.log('FAILURE: Verification failed.');
        process.exit(1);
    }
};

handleGenerate(narrativeInput, onGenerateMock);
