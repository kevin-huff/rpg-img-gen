/**
 * Parses narrative text to find matching scenes and characters.
 * 
 * @param {string} text - The narrative text to parse.
 * @param {Array} availableScenes - List of available scene objects.
 * @param {Array} availableCharacters - List of available character objects.
 * @param {Array} availableEvents - List of available event objects.
 * @param {Object} styleOptions - Object containing arrays of style strings (moods, lightings, etc.)
 * @returns {Object} - { matchedSceneId, matchedCharacterIds, matchedEventIds, matchedStyles, remainingText }
 */
export const parseNarrative = (text, availableScenes = [], availableCharacters = [], availableEvents = [], styleOptions = {}) => {
    if (!text) return {
        matchedSceneId: null,
        matchedCharacterIds: [],
        matchedEventIds: [],
        matchedStyles: {},
        remainingText: ''
    };

    let remainingText = text;
    let matchedSceneId = null;
    const matchedCharacterIds = new Set();
    const matchedEventIds = new Set();
    const matchedStyles = {};

    // Helper to escape regex special characters
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Helper to create a safe regex with boundaries only where appropriate
    const createSafeRegex = (term) => {
        const escaped = escapeRegExp(term);
        // Check if start/end are word characters to decide on \b
        const startBoundary = /^\w/.test(term) ? '\\b' : '';
        const endBoundary = /\w$/.test(term) ? '\\b' : '';
        return new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'i');
    };

    // Sort items by name length (descending) to match longest phrases first
    const sortedScenes = [...availableScenes].sort((a, b) => b.title.length - a.title.length);
    const sortedCharacters = [...availableCharacters].sort((a, b) => b.name.length - a.name.length);
    const sortedEvents = [...availableEvents].sort((a, b) => b.description.length - a.description.length);

    // Helper for matching simple string arrays (Mood, Lighting, etc.)
    const findStyleMatch = (options, key) => {
        if (!options) return;
        // Sort by length descending
        const sortedOptions = [...options].sort((a, b) => b.length - a.length);
        for (const option of sortedOptions) {
            const regex = createSafeRegex(option);
            if (regex.test(remainingText)) {
                matchedStyles[key] = option;
                break; // Only match one per category for now
            }
        }
    };

    // Helper for matching Presets (Label or Value)
    const findPresetMatch = (presets) => {
        if (!presets) return;
        for (const preset of presets) {
            // Check Label
            let regex = createSafeRegex(preset.label);
            if (regex.test(remainingText)) {
                matchedStyles.stylePreset = preset.value;
                break;
            }
            // Check Value (partial match might be tricky, but let's try exact value match or significant substring?)
            // The user example has the full value string.
            // Let's just check if the text *contains* the preset value.
            if (remainingText.toLowerCase().includes(preset.value.toLowerCase())) {
                matchedStyles.stylePreset = preset.value;
                break;
            }
        }
    };

    // Find Scene
    for (const scene of sortedScenes) {
        const regex = createSafeRegex(scene.title);
        if (regex.test(remainingText)) {
            matchedSceneId = scene.id;
            break;
        }
    }

    // Find Characters
    for (const char of sortedCharacters) {
        const regex = createSafeRegex(char.name);
        if (regex.test(remainingText)) {
            matchedCharacterIds.add(char.id);
        }
    }

    // Find Events
    for (const event of sortedEvents) {
        const regex = createSafeRegex(event.description);
        if (regex.test(remainingText)) {
            matchedEventIds.add(event.id);
        }
    }

    // Find Styles
    findStyleMatch(styleOptions.compositions, 'composition');
    findStyleMatch(styleOptions.lightings, 'lighting');
    findStyleMatch(styleOptions.moods, 'mood');
    findStyleMatch(styleOptions.cameras, 'camera');
    findStyleMatch(styleOptions.postProcessings, 'postProcessing');
    findPresetMatch(styleOptions.presets);

    return {
        matchedSceneId,
        matchedCharacterIds: Array.from(matchedCharacterIds),
        matchedEventIds: Array.from(matchedEventIds),
        matchedStyles,
        remainingText
    };
};
