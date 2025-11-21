import React, { useEffect, useState } from 'react';
import { parseNarrative } from '../utils/narrativeParser';

export default function NarrativeInput({
    value,
    onChange,
    onParse,
    scenes = [],
    characters = [],
    events = [],
    styleOptions = {},
    className = ''
}) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    // Handle local change immediately
    const handleChange = (e) => {
        const text = e.target.value;
        onChange(text);
        setDebouncedValue(text);
    };

    // Debounce the parsing to avoid too many updates
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('NarrativeInput: Parsing...', {
                text: debouncedValue,
                scenesCount: scenes.length,
                charactersCount: characters.length,
                eventsCount: events.length,
                styleOptionsKeys: Object.keys(styleOptions)
            });
            const result = parseNarrative(debouncedValue, scenes, characters, events, styleOptions);
            console.log('NarrativeInput: Result', result);
            onParse(result);
        }, 500);

        return () => clearTimeout(timer);
    }, [debouncedValue, scenes, characters, events, styleOptions, onParse]);

    return (
        <div className={`relative ${className}`}>
            <textarea
                value={value}
                onChange={handleChange}
                placeholder="Describe the scene... (e.g. 'The Orc attacks the Elf in the Tavern')"
                className="w-full h-32 p-4 text-lg border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none shadow-sm"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
                Magic Box
            </div>
        </div>
    );
}
