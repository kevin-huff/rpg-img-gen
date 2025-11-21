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

    // --- Fuzzy Matching Helpers ---

    // Calculate Levenshtein distance between two strings
    const levenshtein = (a, b) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1 // deletion
                        )
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    // Check if 'text' contains 'pattern' with a certain fuzziness
    const fuzzyContains = (text, pattern, threshold = 2) => {
        const lowerText = text.toLowerCase();
        const lowerPattern = pattern.toLowerCase().trim();

        // 1. Exact match check (fast path)
        if (lowerText.includes(lowerPattern)) return true;

        // 2. Fuzzy match
        // We scan the text with a window roughly the size of the pattern
        // We allow the window to vary in size slightly to account for insertions/deletions
        const patLen = lowerPattern.length;
        if (patLen < 3) return false; // Don't fuzzy match very short words to avoid false positives

        // Dynamic threshold based on length if not provided? 
        // Let's stick to a max threshold, but also cap it by length.
        // e.g. "cat" (len 3) shouldn't match "bat" if threshold is 2 (66% diff).
        // Rule of thumb: max 20-30% error?
        const maxErrors = Math.min(threshold, Math.floor(patLen * 0.3));

        // Scan
        // We only check word boundaries to improve performance and accuracy?
        // Or just scan every char? For short narrative text (<500 chars), scanning every char is fine.

        // Optimization: Only check substrings that start with the same letter? 
        // No, that breaks if the first letter is the typo.

        for (let i = 0; i <= lowerText.length - patLen + maxErrors; i++) {
            // Check windows of size patLen, patLen-1, patLen+1, etc.
            // We only check range [patLen - 1, patLen + 1] usually sufficient for simple typos
            for (let lenOffset = -1; lenOffset <= 1; lenOffset++) {
                const currentLen = patLen + lenOffset;
                if (i + currentLen > lowerText.length) continue;

                const sub = lowerText.substr(i, currentLen);
                const dist = levenshtein(lowerPattern, sub);

                if (dist <= maxErrors) {
                    return true;
                }
            }
        }
        return false;
    };

    // --- Matching Logic ---

    // Sort items by name length (descending) to match longest phrases first
    // Safety check: ensure items have the required properties
    const sortedScenes = [...availableScenes]
        .filter(s => s && typeof s.title === 'string')
        .sort((a, b) => b.title.length - a.title.length);

    const sortedCharacters = [...availableCharacters]
        .filter(c => c && typeof c.name === 'string')
        .sort((a, b) => b.name.length - a.name.length);

    const sortedEvents = [...availableEvents]
        .filter(e => e && typeof e.description === 'string')
        .sort((a, b) => b.description.length - a.description.length);

    // Helper for matching simple string arrays (Mood, Lighting, etc.)
    const findStyleMatch = (options, key) => {
        if (!Array.isArray(options)) return;
        // Sort by length descending
        const sortedOptions = [...options]
            .filter(opt => typeof opt === 'string')
            .sort((a, b) => b.length - a.length);

        for (const option of sortedOptions) {
            if (fuzzyContains(remainingText, option)) {
                matchedStyles[key] = option;
                break; // Only match one per category for now
            }
        }
    };

    // Helper for matching Presets (Label or Value)
    const findPresetMatch = (presets) => {
        if (!Array.isArray(presets)) return;
        for (const preset of presets) {
            if (!preset || !preset.label || !preset.value) continue;

            // Check Label
            if (fuzzyContains(remainingText, preset.label)) {
                matchedStyles.stylePreset = preset.value;
                break;
            }
            // Check Value
            if (remainingText.toLowerCase().includes(preset.value.toLowerCase())) {
                matchedStyles.stylePreset = preset.value;
                break;
            }
        }
    };

    // Find Scene
    for (const scene of sortedScenes) {
        if (fuzzyContains(remainingText, scene.title)) {
            matchedSceneId = scene.id;
            break;
        }
    }

    // Find Characters
    for (const char of sortedCharacters) {
        if (fuzzyContains(remainingText, char.name)) {
            matchedCharacterIds.add(char.id);
        }
    }

    // Find Events
    for (const event of sortedEvents) {
        if (fuzzyContains(remainingText, event.description)) {
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
