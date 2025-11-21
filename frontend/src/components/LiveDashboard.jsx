import React, { useState, useEffect } from 'react';
import { Copy, Zap, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import NarrativeInput from './NarrativeInput';
import QuickSelect from './QuickSelect';
import PromptPreview from './PromptPreview';

export default function LiveDashboard({
    scenes,
    characters,
    events = [],
    styleOptions = {},
    currentStyles = {},
    onGenerate,
    isGenerating,
    generatedPreview,
    onPreviewUpdate
}) {
    const [narrative, setNarrative] = useState('');
    const [selectedSceneId, setSelectedSceneId] = useState(null);
    const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);
    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [selectedStyles, setSelectedStyles] = useState({});
    const [autoCopy, setAutoCopy] = useState(false);

    // Handle Narrative Parsing
    const handleParse = (result) => {
        console.log('Magic Box Parse Result:', result);
        console.log('Available Scenes:', scenes.length);
        console.log('Available Characters:', characters.length);

        if (result.matchedSceneId) {
            console.log('Setting Scene ID:', result.matchedSceneId);
            setSelectedSceneId(result.matchedSceneId);
        }

        if (result.matchedCharacterIds.length > 0) {
            console.log('Setting Character IDs:', result.matchedCharacterIds);
            // Merge with existing selections or replace?
            // For "Magic Box" feel, maybe add them?
            // Let's add them for now, avoiding duplicates
            setSelectedCharacterIds(prev => {
                const newIds = new Set([...prev, ...result.matchedCharacterIds]);
                return Array.from(newIds);
            });
        }

        if (result.matchedEventIds.length > 0) {
            setSelectedEventIds(prev => {
                const newIds = new Set([...prev, ...result.matchedEventIds]);
                return Array.from(newIds);
            });
        }

        if (result.matchedStyles && Object.keys(result.matchedStyles).length > 0) {
            setSelectedStyles(prev => ({ ...prev, ...result.matchedStyles }));
        }
    };

    // Update parent with current state for preview generation
    useEffect(() => {
        onPreviewUpdate({
            customPrompt: narrative,
            sceneId: selectedSceneId,
            characterIds: selectedCharacterIds,
            eventIds: selectedEventIds,
            ...selectedStyles
        });
    }, [narrative, selectedSceneId, selectedCharacterIds, selectedEventIds, selectedStyles, onPreviewUpdate]);

    const handleCharacterToggle = (id) => {
        setSelectedCharacterIds(prev =>
            prev.includes(id)
                ? prev.filter(cid => cid !== id)
                : [...prev, id]
        );
    };

    const copyToClipboard = () => {
        if (!generatedPreview) return;
        navigator.clipboard.writeText(generatedPreview);
        toast.success('Prompt copied to clipboard!');
    };

    const handleGenerate = () => {
        if (autoCopy) {
            copyToClipboard();
        }
        onGenerate();
    };

    return (
        <div className="flex flex-col h-full gap-4 p-4 bg-slate-50">
            {/* Top Bar: Party & Scene */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                    <QuickSelect
                        title="Party"
                        items={characters}
                        selectedId={selectedCharacterIds}
                        onSelect={handleCharacterToggle}
                        storageKey="fav_characters"
                        renderItem={(c) => c.name}
                    />
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm">
                    <QuickSelect
                        title="Locations"
                        items={scenes}
                        selectedId={selectedSceneId}
                        onSelect={(id) => setSelectedSceneId(id === selectedSceneId ? null : id)}
                        storageKey="fav_scenes"
                    />
                </div>
            </div>

            {/* Center: Magic Box */}
            <div className="flex-shrink-0">
                <div className="text-xs text-gray-400 mb-1">
                    Debug: Scenes: {scenes.length}, Chars: {characters.length} ({characters[0]?.name}), Events: {events.length}
                    <button
                        onClick={() => {
                            console.log('Manual Parse Triggered');
                            const result = parseNarrative(narrative, scenes, characters, events, styleOptions);
                            console.log('Manual Result:', result);
                            alert(`Parsed: Chars=${result.matchedCharacterIds.length}, Scenes=${result.matchedSceneId ? 1 : 0}`);
                            handleParse(result);
                        }}
                        className="ml-2 text-blue-500 hover:underline"
                    >
                        [Test Parse]
                    </button>
                </div>
                <NarrativeInput
                    value={narrative}
                    onChange={setNarrative}
                    onParse={handleParse}
                    scenes={scenes}
                    characters={characters}
                    events={events}
                    styleOptions={styleOptions}
                />
            </div>

            {/* Bottom: Controls & Preview */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                {/* Controls */}
                <div className="flex-1 bg-white p-4 rounded-xl shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-700">Live Controls</h3>
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoCopy}
                                onChange={(e) => setAutoCopy(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            Auto-copy on Generate
                        </label>
                    </div>
                    {/* Active Styles Bar */}
                    <div className="flex flex-wrap gap-2 items-center min-h-[32px]">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Styles:</span>
                        {Object.entries(currentStyles).every(([_, val]) => !val) ? (
                            <span className="text-xs text-gray-400 italic">None set (Type to add)</span>
                        ) : (
                            Object.entries(currentStyles).map(([key, value]) => {
                                if (!value) return null;
                                return (
                                    <span key={key} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full border border-purple-200">
                                        <span className="opacity-50 uppercase text-[10px]">{key}:</span>
                                        <span className="font-medium">{value}</span>
                                        <button
                                            onClick={() => onPreviewUpdate({ [key]: '' })}
                                            className="ml-1 hover:text-purple-900"
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })
                        )}
                        {/* Clear Styles Button */}
                        {!Object.entries(currentStyles).every(([_, val]) => !val) && (
                            <button
                                onClick={() => {
                                    onPreviewUpdate({
                                        composition: '',
                                        lighting: '',
                                        mood: '',
                                        camera: '',
                                        postProcessing: '',
                                        stylePreset: '',
                                        aiStyle: ''
                                    });
                                    setSelectedStyles({});
                                }}
                                className="text-xs text-red-500 hover:text-red-700 underline ml-auto"
                            >
                                Clear Styles
                            </button>
                        )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <button
                                onClick={() => {
                                    setNarrative('');
                                    setSelectedSceneId(null);
                                    setSelectedCharacterIds([]);
                                    setSelectedEventIds([]);
                                    // NOTE: We intentionally DO NOT clear styles here to allow them to persist.
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors w-full"
                            >
                                <span className="text-xl">↺</span>
                                Reset Story
                            </button>
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center justify-center gap-2 px-4 py-3 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 text-blue-700 font-medium transition-colors"
                        >
                            <Copy className="h-5 w-5" />
                            Copy Prompt
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`
                            flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold text-lg shadow-md transition-all transform active:scale-95
                            ${isGenerating
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                            }
                        `}
                    >
                        <Zap className={`h-6 w-6 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'Generating...' : 'GENERATE NOW'}
                    </button>
                </div>

                {/* Preview (Compact) */}
                <div className="flex-1 bg-white p-4 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <h3 className="font-bold text-gray-700 mb-2">Preview</h3>
                    <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-3 text-sm font-mono whitespace-pre-wrap border border-gray-200">
                        {generatedPreview || <span className="text-gray-400 italic">Prompt will appear here...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
