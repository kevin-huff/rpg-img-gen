import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusCircle, Sparkles, Copy, Users, MapPin, X } from 'lucide-react'

import { scenesAPI, charactersAPI, templatesAPI, eventsAPI } from '../services/api'
import { useTemplateBuilder } from '../contexts/TemplateBuilderContext'
import Modal from './Modal'
import SceneModal from './SceneModal'
import CharacterModal from './CharacterModal'
import ImageDropzone from './ImageDropzone'

const STYLE_PRESETS = [
  {
    label: 'Cinematic',
    value: 'cinematic film still, dramatic lighting, rich depth of field'
  },
  {
    label: 'Silver Age Comic',
    value: 'silver age comic panel, ben-day dots, bold black inking, flat CMYK palette'
  },
  {
    label: 'Modern Graphic Novel',
    value: 'modern graphic novel spread, layered digital shading, textured gradients, moody rim light'
  },
  {
    label: 'Superhero Splash Page',
    value: 'dynamic superhero splash page, exaggerated foreshortening, kinetic speed lines, explosive impact bursts'
  },
  {
    label: 'Noir Comic',
    value: 'noir graphic novel styling, heavy chiaroscuro, rain-soaked alley light, selective spot color'
  },
  {
    label: 'Kirby Cosmic',
    value: 'jack kirby-inspired cosmic comic art, thick contour lines, kirby crackle energy bubbles, high-saturation hues'
  },
  {
    label: 'Manga Inked',
    value: 'shonen manga double spread, crisp screentones, dynamic speed lines, expressive ink wash shadows'
  },
  {
    label: 'Neon Cyberpunk Comic',
    value: 'cyberpunk comic panel, neon rim lights, holographic signage, wet asphalt reflections'
  },
  {
    label: 'Painterly',
    value: 'painterly illustration, expressive brushstrokes, layered pigments'
  },
  {
    label: 'Dark Fantasy',
    value: 'dark fantasy concept art, moody atmosphere, intricate gothic detail'
  },
  {
    label: 'Retro Sci-Fi',
    value: 'retro sci-fi pulp cover, neon gradients, chrome highlights'
  },
  {
    label: 'Western Splash',
    value: 'western comic splash page, sun-bleached palette, dusty motion trails, cinematic lens flare'
  },
  {
    label: 'Indie Risograph',
    value: 'indie risograph comic aesthetic, duotone ink, grainy halftones, off-register charm'
  }
]

const parseTags = (tagString) => {
  if (!tagString) return []
  return tagString
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

const normalizeIdArray = (values) => {
  if (!Array.isArray(values)) return []
  return Array.from(new Set(values
    .map(value => {
      const parsed = typeof value === 'string' ? parseInt(value, 10) : value
      return Number.isFinite(parsed) ? parsed : null
    })
    .filter((value) => value !== null)
  ))
}

const normalizeStringArray = (values) => {
  if (!Array.isArray(values)) return []
  return values
    .map(value => (typeof value === 'string' ? value : String(value || '')))
    .map(str => str.trim())
    .filter(Boolean)
}

export default function TemplateGenerator() {
  const [scenes, setScenes] = useState([])
  const [characters, setCharacters] = useState([])
  const [eventLibrary, setEventLibrary] = useState([])
  const [eventSearch, setEventSearch] = useState('')
  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [selectedEventIds, setSelectedEventIds] = useState([])
  const [customEvents, setCustomEvents] = useState([''])
  const [promptModifiers, setPromptModifiers] = useState([])
  const [generatedTemplate, setGeneratedTemplate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScenesModalOpen, setIsScenesModalOpen] = useState(false)
  const [isCharactersModalOpen, setIsCharactersModalOpen] = useState(false)

  const { register, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: {
      title: '',
      sceneId: '',
      stylePreset: '',
      aiStyle: '',
      customPrompt: '',
      composition: '',
      lighting: '',
      mood: '',
      camera: '',
      postProcessing: '',
    }
  })
  const watchedSceneId = watch('sceneId')
  const watchedStylePreset = watch('stylePreset')
  const { prefill, clearPrefill } = useTemplateBuilder()

  // Load scenes and characters on mount
  useEffect(() => {
    loadScenes()
    loadCharacters()
    loadEvents()
  }, [])

  const loadScenes = async () => {
    try {
      const response = await scenesAPI.getAll({ limit: 100 })
      setScenes(response.data)
    } catch (error) {
      console.error('Failed to load scenes:', error)
      toast.error('Failed to load scenes')
    }
  }

  const loadCharacters = async () => {
    try {
      const response = await charactersAPI.getAll({ limit: 100 })
      setCharacters(response.data)
    } catch (error) {
      console.error('Failed to load characters:', error)
      toast.error('Failed to load characters')
    }
  }

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAll({ limit: 200 })
      setEventLibrary(response.data)
    } catch (error) {
      console.error('Failed to load events:', error)
      toast.error('Failed to load events')
    }
  }

  const refreshLists = async () => {
    // Reload scenes and characters without altering form state
    await Promise.all([loadScenes(), loadCharacters(), loadEvents()])
  }

  // Keep selections valid if items were deleted while managing in modals
  useEffect(() => {
    if (!characters?.length) return
    setSelectedCharacters(prev => prev.filter(id => characters.some(c => c.id === id)))
  }, [characters])

  useEffect(() => {
    if (!watchedSceneId) return
    const exists = scenes.some(s => String(s.id) === String(watchedSceneId))
    if (!exists) setValue('sceneId', '')
  }, [scenes, watchedSceneId, setValue])

  useEffect(() => {
    if (!eventLibrary?.length) return
    setSelectedEventIds(prev => prev.filter(id => eventLibrary.some(event => event.id === id)))
  }, [eventLibrary])

  useEffect(() => {
    if (!prefill) return

    reset({
      title: prefill.title || '',
      sceneId: prefill.sceneId ? String(prefill.sceneId) : '',
      stylePreset: prefill.stylePreset || '',
      aiStyle: prefill.aiStyle || '',
      customPrompt: prefill.customPrompt || '',
      composition: prefill.composition || '',
      lighting: prefill.lighting || '',
      mood: prefill.mood || '',
      camera: prefill.camera || '',
      postProcessing: prefill.postProcessing || '',
    })

    setSelectedCharacters(normalizeIdArray(prefill.characterIds))
    setSelectedEventIds(normalizeIdArray(prefill.eventIds))

    const restoredEvents = normalizeStringArray(prefill.eventDescriptions)
    setCustomEvents(restoredEvents.length ? restoredEvents : [''])

    const restoredModifiers = normalizeStringArray(prefill.modifiers)
    setPromptModifiers(restoredModifiers)

    setGeneratedTemplate('')
    setEventSearch('')

    clearPrefill()
  }, [prefill, reset, clearPrefill])

  const handleCharacterToggle = (characterId) => {
    setSelectedCharacters(prev => 
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    )
  }

  const addEvent = () => {
    setCustomEvents(prev => [...prev, ''])
  }

  const updateEvent = (index, value) => {
    setCustomEvents(prev => prev.map((event, i) => i === index ? value : event))
  }

  const removeEvent = (index) => {
    setCustomEvents(prev => prev.filter((_, i) => i !== index))
  }

  const toggleEventSelection = (eventId) => {
    setSelectedEventIds(prev => 
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  const addModifier = (tag) => {
    const cleaned = tag.trim()
    if (!cleaned) return
    setPromptModifiers(prev => prev.includes(cleaned) ? prev : [...prev, cleaned])
  }

  const removeModifier = (tag) => {
    setPromptModifiers(prev => prev.filter(item => item !== tag))
  }

  const selectedScene = useMemo(() => {
    if (!watchedSceneId) return null
    return scenes.find(scene => String(scene.id) === String(watchedSceneId)) || null
  }, [scenes, watchedSceneId])

  const selectedSceneTags = useMemo(() => parseTags(selectedScene?.tags), [selectedScene])

  const selectedEvents = useMemo(() => {
    if (!selectedEventIds.length) return []
    return selectedEventIds
      .map(eventId => eventLibrary.find(event => event.id === eventId))
      .filter(Boolean)
  }, [selectedEventIds, eventLibrary])

  const filteredEventLibrary = useMemo(() => {
    const query = eventSearch.trim().toLowerCase()
    if (!query) return eventLibrary
    return eventLibrary.filter((event) => {
      const description = event.description?.toLowerCase() || ''
      const tags = event.tags?.toLowerCase() || ''
      return description.includes(query) || tags.includes(query)
    })
  }, [eventLibrary, eventSearch])

  const selectedPresetDetails = useMemo(() => {
    if (!watchedStylePreset) return null
    return STYLE_PRESETS.find((preset) => preset.value === watchedStylePreset) || null
  }, [watchedStylePreset])

  const onSubmit = async (data) => {
    setIsGenerating(true)
    
    try {
      const templateData = {
        title: data.title,
        sceneId: data.sceneId ? parseInt(data.sceneId) : null,
        characterIds: selectedCharacters,
        eventIds: selectedEventIds,
        eventDescriptions: customEvents.filter(event => event.trim()),
        aiStyle: data.aiStyle,
        stylePreset: data.stylePreset,
        customPrompt: data.customPrompt,
        composition: data.composition,
        lighting: data.lighting,
        mood: data.mood,
        camera: data.camera,
        postProcessing: data.postProcessing,
        modifiers: promptModifiers,
      }

      const response = await templatesAPI.generate(templateData)
      const templateText = response?.data?.templateText || ''
      setGeneratedTemplate(templateText)

      // Attempt to copy to clipboard automatically after generation
      if (templateText) {
        try {
          await navigator.clipboard.writeText(templateText)
          toast.success('Template generated and copied to clipboard!')
        } catch (copyErr) {
          console.error('Clipboard copy failed:', copyErr)
          toast.success('Template generated. Click Copy to copy it.')
        }
      } else {
        toast.error('No template text returned')
      }
      
    } catch (error) {
      console.error('Failed to generate template:', error)
      toast.error('Failed to generate template')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedTemplate)
      toast.success('Template copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy template')
    }
  }

  const clearForm = () => {
    reset()
    setSelectedCharacters([])
    setSelectedEventIds([])
    setCustomEvents([''])
    setPromptModifiers([])
    setEventSearch('')
    setGeneratedTemplate('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          AI Image Template Generator
        </h2>

        <form id="template-generator-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Template Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Title (Optional)
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a title for this template..."
            />
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Prompt (Optional)
            </label>
            <textarea
              {...register('customPrompt')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any custom instructions or style notes..."
            />
          </div>

          {/* Prompt Modifiers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Prompt Modifiers
              </label>
              <p className="text-xs text-gray-500 hidden sm:block">
                Click scene or character tags to add quick modifiers
              </p>
            </div>
            {promptModifiers.length === 0 ? (
              <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-md p-3">
                No modifiers yet. Tap any scene or character tag below to build a reusable flavor list.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 border border-gray-200 rounded-md p-3">
                {promptModifiers.map((modifier) => (
                  <span
                    key={modifier}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
                  >
                    {modifier}
                    <button
                      type="button"
                      onClick={() => removeModifier(modifier)}
                      className="text-blue-700 hover:text-blue-900"
                      title="Remove modifier"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Prompt Structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Composition
              </label>
              <textarea
                {...register('composition')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Frame the scene – e.g., wide establishing shot, intimate portrait, over-the-shoulder action..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lighting
              </label>
              <input
                type="text"
                {...register('lighting')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Golden hour rim light, torchlit gloom, neon highlights..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood
              </label>
              <input
                type="text"
                {...register('mood')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Triumphant, eerie suspense, solemn aftermath..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Camera
              </label>
              <input
                type="text"
                {...register('camera')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="35mm lens close-up, drone top-down, cinematic dolly shot..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post-Processing
              </label>
              <input
                type="text"
                {...register('postProcessing')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="High-contrast grading, painterly brushwork, film grain overlay..."
              />
            </div>
          </div>

          {/* Scene Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scene
            </label>
            <div className="flex gap-2">
              <select
                {...register('sceneId')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a scene...</option>
                {scenes.map(scene => (
                  <option key={scene.id} value={scene.id}>
                    {scene.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsScenesModalOpen(true)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-1"
                title="Manage Scenes"
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Manage</span>
              </button>
            </div>
            {selectedSceneTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedSceneTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addModifier(tag)}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full border border-purple-200 hover:bg-purple-200 transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Character Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Characters
            </label>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Select one or more characters</p>
              <button
                type="button"
                onClick={() => setIsCharactersModalOpen(true)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-1 text-sm"
                title="Manage Characters"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Manage</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-gray-200 rounded-md p-3">
              {characters.map((character) => {
                const characterTags = parseTags(character.tags)
                const isSelected = selectedCharacters.includes(character.id)
                return (
                  <div
                    key={character.id}
                    className={`rounded-md border p-2 transition ${
                      isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <label
                      htmlFor={`character-${character.id}`}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        id={`character-${character.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCharacterToggle(character.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 font-medium">{character.name}</span>
                    </label>
                    {characterTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {characterTags.map((tag) => (
                          <button
                            key={`${character.id}-${tag}`}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              addModifier(tag)
                            }}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-200 hover:bg-green-200"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {characters.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No characters available. Create some characters first.
              </p>
            )}
          </div>

          {/* Events/Actions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Events & Actions
              </label>
              <button
                type="button"
                onClick={addEvent}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Custom Event</span>
              </button>
            </div>

            {selectedEvents.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Selected library events</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEvents.map((event) => (
                    <span
                      key={event.id}
                      className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full"
                    >
                      {event.description}
                      <button
                        type="button"
                        onClick={() => toggleEventSelection(event.id)}
                        className="text-orange-700 hover:text-orange-900"
                        title="Remove event"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Event Library
                </p>
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search events by keyword or tag..."
                  className="w-full sm:w-60 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {filteredEventLibrary.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No events match your search yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredEventLibrary.map((event) => {
                    const isSelected = selectedEventIds.includes(event.id)
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => toggleEventSelection(event.id)}
                        className={`text-left px-3 py-2 rounded-md border transition ${
                          isSelected
                            ? 'border-orange-400 bg-orange-50 text-orange-800'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="block text-sm font-medium">
                          {event.description}
                        </span>
                        {event.tags && (
                          <span className="block text-xs text-gray-500 mt-1">
                            Tags: {event.tags}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {customEvents.map((event, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={event}
                    onChange={(e) => updateEvent(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Custom event ${index + 1}...`}
                  />
                  {customEvents.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEvent(index)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove custom event"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Style (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  {...register('stylePreset')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a style preset...</option>
                  {STYLE_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                {selectedPresetDetails && (
                  <p className="mt-2 text-xs text-gray-500">
                    {selectedPresetDetails.value}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  {...register('aiStyle')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add tweaks or stack additional style cues..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  The preset feeds structure; use this box for per-shot adjustments.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed lg:hidden"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate Template'}</span>
            </button>
            
            <button
              type="button"
              onClick={clearForm}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* Quick uploader for small screens */}
      <div className="lg:hidden space-y-6">
        <ImageDropzone />
      </div>

      {/* Generated Template */}
      {generatedTemplate && (
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Generated Template
            </h3>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-md p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {generatedTemplate}
            </pre>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Copy this template and paste it into your AI image generator (DALL-E, Midjourney, Stable Diffusion, etc.)</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        title="Manage Scenes"
        isOpen={isScenesModalOpen}
        onClose={async () => { setIsScenesModalOpen(false); await refreshLists(); }}
        widthClass="max-w-4xl"
      >
        <SceneModal
          onClose={() => setIsScenesModalOpen(false)}
          onSaved={refreshLists}
        />
      </Modal>

      <Modal
        title="Manage Characters"
        isOpen={isCharactersModalOpen}
        onClose={async () => { setIsCharactersModalOpen(false); await refreshLists(); }}
        widthClass="max-w-4xl"
      >
        <CharacterModal
          onClose={() => setIsCharactersModalOpen(false)}
          onSaved={refreshLists}
        />
      </Modal>
    </div>
  )
}
