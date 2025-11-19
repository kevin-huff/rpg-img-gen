import { parseNarrative } from './narrativeParser.js';

const mockScenes = [
    { id: 1, title: 'Tavern' },
    { id: 2, title: 'Dark Forest' },
    { id: 3, title: 'Forest' }
];

const mockCharacters = [
    { id: 101, name: 'Orc' },
    { id: 102, name: 'Elf Ranger' },
    { id: 103, name: 'Elf' },
    { id: 104, name: 'Bartender' }
];

const mockEvents = [
    { id: 201, description: 'attacks' },
    { id: 202, description: 'Fireball' },
    { id: 203, description: 'runs away' }
];

const mockStyles = {
    moods: ['Righteous fury', 'Eerie suspense'],
    lightings: ['Volumetric god rays'],
    presets: [{ label: 'Vaporwave', value: 'vaporwave aesthetic' }]
};

const runTest = (name, input, expected) => {
    const result = parseNarrative(input, mockScenes, mockCharacters, mockEvents, mockStyles);

    const sceneMatch = result.matchedSceneId === expected.matchedSceneId;
    const charMatch = JSON.stringify(result.matchedCharacterIds.sort()) === JSON.stringify(expected.matchedCharacterIds.sort());
    const eventMatch = JSON.stringify(result.matchedEventIds.sort()) === JSON.stringify(expected.matchedEventIds.sort());

    // Check styles if expected
    let styleMatch = true;
    if (expected.matchedStyles) {
        styleMatch = JSON.stringify(result.matchedStyles) === JSON.stringify(expected.matchedStyles);
    }

    if (sceneMatch && charMatch && eventMatch && styleMatch) {
        console.log(`✅ ${name}`);
    } else {
        console.error(`❌ ${name}`);
        console.error('Expected:', expected);
        console.error('Received:', result);
    }
};

console.log('Running Narrative Parser Tests...');

runTest(
    'Basic Match',
    'The Orc attacks the Elf in the Tavern',
    { matchedSceneId: 1, matchedCharacterIds: [101, 103], matchedEventIds: [201], matchedStyles: {} }
);

runTest(
    'Event Match (Fireball)',
    'The Elf casts Fireball',
    { matchedSceneId: null, matchedCharacterIds: [103], matchedEventIds: [202], matchedStyles: {} }
);

runTest(
    'Style Match (Mood & Lighting)',
    'The Orc attacks with Righteous fury under Volumetric god rays',
    {
        matchedSceneId: null,
        matchedCharacterIds: [101],
        matchedEventIds: [201],
        matchedStyles: { mood: 'Righteous fury', lighting: 'Volumetric god rays' }
    }
);

runTest(
    'Style Preset Match',
    'Use Vaporwave style',
    {
        matchedSceneId: null,
        matchedCharacterIds: [],
        matchedEventIds: [],
        matchedStyles: { stylePreset: 'vaporwave aesthetic' }
    }
);

runTest(
    'Longer Name Priority (Scene)',
    'They enter the Dark Forest',
    { matchedSceneId: 2, matchedCharacterIds: [], matchedEventIds: [], matchedStyles: {} }
);

runTest(
    'Longer Name Priority (Character)',
    'The Elf Ranger shoots',
    { matchedSceneId: null, matchedCharacterIds: [102, 103], matchedEventIds: [] }
);

runTest(
    'Case Insensitivity',
    'the orc is angry',
    { matchedSceneId: null, matchedCharacterIds: [101], matchedEventIds: [] }
);

runTest(
    'No Matches',
    'A random guy walks by',
    { matchedSceneId: null, matchedCharacterIds: [], matchedEventIds: [] }
);
