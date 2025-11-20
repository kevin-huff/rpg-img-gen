import React, { useState, useEffect, useMemo, useId } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusCircle, MapPin, Users, Star } from 'lucide-react'

import { scenesAPI, charactersAPI, templatesAPI, eventsAPI } from '../services/api'
import { useTemplateBuilder } from '../contexts/TemplateBuilderContext'
import Modal from './Modal'
import SceneModal from './SceneModal'
import CharacterModal from './CharacterModal'
import ImageDropzone from './ImageDropzone'
import PromptPreview from './PromptPreview'
import ModifierChips from './ModifierChips'
import QuickSelect from './QuickSelect'
import SelectionCard from './SelectionCard'

import {
  STYLE_PRESETS,
  COMPOSITION_OPTIONS,
  LIGHTING_OPTIONS,
  MOOD_OPTIONS,
  CAMERA_OPTIONS,
  POST_PROCESSING_OPTIONS
} from '../constants/options'

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

import LiveDashboard from './LiveDashboard'

export default function TemplateGenerator() {
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [scenes, setScenes] = useState([])
  const [characters, setCharacters] = useState([])
  const [eventLibrary, setEventLibrary] = useState([])

  // Search States
  const [eventSearch, setEventSearch] = useState('')
  const [sceneSearch, setSceneSearch] = useState('')
  const [characterSearch, setCharacterSearch] = useState('')

  // Selection States
  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [characterPositions, setCharacterPositions] = useState({})
  const [selectedEventIds, setSelectedEventIds] = useState([])
  const [customEvents, setCustomEvents] = useState([''])
  const [promptModifiers, setPromptModifiers] = useState([])

  // Preview & Generation
  const [generatedPreview, setGeneratedPreview] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Modals
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

  // Watch all fields for real-time preview
  const watchedValues = watch()
  const watchedSceneId = watchedValues.sceneId
  const watchedStylePreset = watchedValues.stylePreset

  const { prefill, clearPrefill } = useTemplateBuilder()

  // Load Data
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
      if (Array.isArray(response.data)) {
        setCharacters(response.data)
      } else {
        console.error('Invalid characters response:', response.data)
        setCharacters([])
      }
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

  // Handle Prefill
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

    if (prefill.characterPositions) {
      setCharacterPositions(prefill.characterPositions)
    } else {
      setCharacterPositions({})
    }

    setEventSearch('')
    clearPrefill()
  }, [prefill, reset, clearPrefill])

  // Real-time Preview Logic
  useEffect(() => {
    generatePreview()
  }, [
    watchedValues,
    selectedCharacters,
    selectedEventIds,
    customEvents,
    promptModifiers,
    scenes,
    characters,
    eventLibrary,
    characterPositions
  ])

  const generatePreview = () => {
    const {
      sceneId,
      customPrompt,
      composition,
      lighting,
      mood,
      camera,
      postProcessing,
      stylePreset,
      aiStyle
    } = watchedValues

    let text = ''

    // Custom Prompt
    if (customPrompt) text += customPrompt + '\n\n'

    // Modifiers
    if (promptModifiers.length > 0) {
      text += `Modifiers: ${promptModifiers.join(', ')}\n\n`
    }

    // Scene
    if (sceneId) {
      const scene = scenes.find(s => String(s.id) === String(sceneId))
      if (scene) {
        text += `Scene: ${scene.title}\n${scene.description}\n\n`
      }
    }

    // Characters
    if (selectedCharacters.length > 0) {
      const chars = selectedCharacters
        .map(id => characters.find(c => String(c.id) === String(id)))
        .filter(Boolean)

      if (chars.length > 0) {
        text += 'Characters:\n'
        chars.forEach(char => {
          text += `- ${char.name}: ${char.description}`
          if (char.appearance) text += ` (Appearance: ${char.appearance})`

          const position = characterPositions[char.id]
          if (position) text += ` [Position: ${position}]`

          text += '\n'
        })
        text += '\n'
      }
    }

    // Events
    const selectedLibraryEvents = selectedEventIds
      .map(id => eventLibrary.find(e => String(e.id) === String(id)))
      .filter(Boolean)

    const validCustomEvents = customEvents.filter(e => e.trim())

    if (selectedLibraryEvents.length > 0 || validCustomEvents.length > 0) {
      text += 'Events/Actions:\n'
      let counter = 1

      selectedLibraryEvents.forEach(event => {
        text += `${counter}. ${event.description}`
        if (event.tags) text += ` (Tags: ${event.tags})`
        text += '\n'
        counter++
      })

      validCustomEvents.forEach(desc => {
        text += `${counter}. ${desc}\n`
        counter++
      })
      text += '\n'
    }

    // Style Details
    const details = [
      { label: 'Composition', value: composition },
      { label: 'Lighting', value: lighting },
      { label: 'Mood', value: mood },
      { label: 'Camera', value: camera },
      { label: 'Post-Processing', value: postProcessing },
      { label: 'Style Preset', value: stylePreset },
      { label: 'AI Style', value: aiStyle }
    ]

    details.forEach(({ label, value }) => {
      if (value) text += `${label}: ${value}\n`
    })

    setGeneratedPreview(text.trim())
  }

  // Handlers
  const handleCharacterToggle = (characterId) => {
    setSelectedCharacters(prev =>
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    )
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
        characterPositions: characterPositions,
      }

      await templatesAPI.generate(templateData)
      toast.success('Template generated and saved!')
      // Note: We don't need to setGeneratedTemplate here anymore as we rely on preview
      // But we might want to clear the form or keep it for tweaks.
      // For now, let's keep it to allow tweaks.
    } catch (error) {
      console.error('Failed to generate template:', error)
      toast.error('Failed to generate template')
    } finally {
      setIsGenerating(false)
    }
  }

  const clearForm = () => {
    reset()
    setSelectedCharacters([])
    setSelectedEventIds([])
    setCustomEvents([''])
    setPromptModifiers([])
    setEventSearch('')
    setSceneSearch('')
    setCharacterSearch('')
    setGeneratedPreview('') // Clear preview as well
  }

  // Filtering
  const filteredScenes = useMemo(() => {
    const query = sceneSearch.trim().toLowerCase()
    if (!query) return scenes
    return scenes.filter((scene) => {
      const title = scene.title?.toLowerCase() || ''
      const description = scene.description?.toLowerCase() || ''
      const tags = scene.tags?.toLowerCase() || ''
      return title.includes(query) || description.includes(query) || tags.includes(query)
    })
  }, [scenes, sceneSearch])

  const filteredCharacters = useMemo(() => {
    const query = characterSearch.trim().toLowerCase()
    if (!query) return characters
    return characters.filter((char) => {
      const name = char.name?.toLowerCase() || ''
      const description = char.description?.toLowerCase() || ''
      const tags = char.tags?.toLowerCase() || ''
      return name.includes(query) || description.includes(query) || tags.includes(query)
    })
  }, [characters, characterSearch])

  const filteredEvents = useMemo(() => {
    const query = eventSearch.trim().toLowerCase()
    if (!query) return eventLibrary
    return eventLibrary.filter((event) => {
      const description = event.description?.toLowerCase() || ''
      const tags = event.tags?.toLowerCase() || ''
      return description.includes(query) || tags.includes(query)
    })
  }, [eventLibrary, eventSearch])

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 overflow-hidden">
      {/* LEFT COLUMN: Controls (Scrollable) */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-20 lg:pb-0">

        {/* Header & Title */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Template Builder</h2>
            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`
                px-4 py-2 rounded-full text-sm font-bold transition-colors
                ${isLiveMode
                  ? 'bg-indigo-600 text-white shadow-inner'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {isLiveMode ? '⚡ Live Mode ON' : '⚡ Enable Live Mode'}
            </button>
          </div>

          {!isLiveMode && (
            <input
              type="text"
              {...register('title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Template Title (Optional)..."
            />
          )}
        </div>

        {isLiveMode ? (
          <div className="flex-1 min-h-0">
            <LiveDashboard
              scenes={scenes}
              characters={characters}
              events={eventLibrary}
              styleOptions={{
                compositions: COMPOSITION_OPTIONS,
                lightings: LIGHTING_OPTIONS,
                moods: MOOD_OPTIONS,
                cameras: CAMERA_OPTIONS,
                postProcessings: POST_PROCESSING_OPTIONS,
                presets: STYLE_PRESETS
              }}
              currentStyles={{
                composition: watchedValues.composition,
                lighting: watchedValues.lighting,
                mood: watchedValues.mood,
                camera: watchedValues.camera,
                postProcessing: watchedValues.postProcessing,
                stylePreset: watchedValues.stylePreset,
                aiStyle: watchedValues.aiStyle
              }}
              onGenerate={handleSubmit(onSubmit)}
              isGenerating={isGenerating}
              generatedPreview={generatedPreview}
              onPreviewUpdate={(data) => {
                // Update form values from Live Dashboard
                if (data.customPrompt !== undefined) setValue('customPrompt', data.customPrompt)
                if (data.sceneId !== undefined) setValue('sceneId', data.sceneId)
                if (data.characterIds !== undefined) setSelectedCharacters(data.characterIds)
                if (data.eventIds !== undefined) setSelectedEventIds(data.eventIds)

                // Style Updates
                if (data.composition !== undefined) setValue('composition', data.composition)
                if (data.lighting !== undefined) setValue('lighting', data.lighting)
                if (data.mood !== undefined) setValue('mood', data.mood)
                if (data.camera !== undefined) setValue('camera', data.camera)
                if (data.postProcessing !== undefined) setValue('postProcessing', data.postProcessing)
                if (data.stylePreset !== undefined) setValue('stylePreset', data.stylePreset)
              }}
            />
          </div>
        ) : (
          <>

            {/* Custom Prompt */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Custom Prompt</h3>
              <textarea
                {...register('customPrompt')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Add any custom instructions or style notes..."
              />
            </div>

            {/* Prompt Modifiers */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Prompt Modifiers</h3>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Click scene or character tags to add quick modifiers
                </p>
              </div>
              <div className="flex flex-wrap gap-2 border border-gray-200 rounded-md p-3">
                {promptModifiers.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No modifiers yet. Tap any scene or character tag below to build a reusable flavor list.
                  </p>
                ) : (
                  promptModifiers.map((modifier) => (
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
                        <span className="text-sm font-bold">×</span>
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Scene Selection */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Scene</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sceneSearch}
                    onChange={(e) => setSceneSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-32 px-2 py-1 text-sm border rounded"
                  />
                  <button onClick={() => setIsScenesModalOpen(true)} className="text-sm text-blue-600 hover:underline">Manage</button>
                </div>
              </div>

              <QuickSelect
                title="Favorites"
                items={scenes}
                selectedId={watchedSceneId}
                onSelect={(id) => setValue('sceneId', String(id) === String(watchedSceneId) ? '' : String(id))}
                storageKey="fav_scenes"
              />

              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {filteredScenes.length === 0 ? (
                  <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                    {scenes.length === 0
                      ? "No scenes available. Create one to get started!"
                      : "No scenes match your search."}
                  </div>
                ) : (
                  filteredScenes.map(scene => (
                    <SelectionCard
                      key={scene.id}
                      title={scene.title}
                      subtitle={scene.description}
                      tags={parseTags(scene.tags)}
                      isSelected={String(watchedSceneId) === String(scene.id)}
                      onToggle={() => setValue('sceneId', String(watchedSceneId) === String(scene.id) ? '' : String(scene.id))}
                      onTagClick={addModifier}
                      className="py-2"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Character Selection */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-800">Characters</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={characterSearch}
                    onChange={(e) => setCharacterSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-32 px-2 py-1 text-sm border rounded"
                  />
                  <button onClick={() => setIsCharactersModalOpen(true)} className="text-sm text-blue-600 hover:underline">Manage</button>
                </div>
              </div>

              <QuickSelect
                title="Party"
                items={characters}
                selectedId={null} // Quick select for chars just toggles
                onSelect={(id) => handleCharacterToggle(id)}
                storageKey="fav_characters"
                renderItem={(c) => c.name}
              />

              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {filteredCharacters.length === 0 ? (
                  <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                    {characters.length === 0
                      ? "No characters available. Create one to get started!"
                      : "No characters match your search."}
                  </div>
                ) : (
                  filteredCharacters.map(char => (
                    <SelectionCard
                      key={char.id}
                      title={char.name}
                      subtitle={char.description}
                      tags={parseTags(char.tags)}
                      isSelected={selectedCharacters.includes(char.id)}
                      onToggle={() => handleCharacterToggle(char.id)}
                      onTagClick={addModifier}
                      position={characterPositions[char.id]}
                      onPositionChange={(pos) => setCharacterPositions(prev => ({ ...prev, [char.id]: pos }))}
                      className="py-2"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Events */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Events & Actions</h3>

              {/* Custom Events */}
              <div className="space-y-2 mb-4">
                {customEvents.map((event, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={event}
                      onChange={(e) => {
                        const newEvents = [...customEvents]
                        newEvents[index] = e.target.value
                        setCustomEvents(newEvents)
                      }}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                      placeholder="Describe an action..."
                    />
                    {index === customEvents.length - 1 ? (
                      <button
                        onClick={() => setCustomEvents([...customEvents, ''])}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                      >
                        <PlusCircle className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setCustomEvents(customEvents.filter((_, i) => i !== index))}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <span className="text-xl font-bold">×</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Library Events */}
              <div className="border-t pt-3">
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search event library..."
                  className="w-full px-3 py-2 border rounded-md text-sm mb-2"
                />
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {filteredEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No events match your search yet.
                    </p>
                  ) : (
                    filteredEvents.map(event => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => toggleEventSelection(event.id)}
                        className={`px-3 py-1 text-xs rounded-full border ${selectedEventIds.includes(event.id)
                          ? 'bg-orange-100 border-orange-300 text-orange-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                      >
                        {event.description}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Style & Modifiers */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Style & Atmosphere</h3>

              <ModifierChips
                label="Composition"
                options={COMPOSITION_OPTIONS}
                value={watch('composition')}
                onChange={(val) => setValue('composition', val)}
              />

              <ModifierChips
                label="Lighting"
                options={LIGHTING_OPTIONS}
                value={watch('lighting')}
                onChange={(val) => setValue('lighting', val)}
              />

              <ModifierChips
                label="Mood"
                options={MOOD_OPTIONS}
                value={watch('mood')}
                onChange={(val) => setValue('mood', val)}
              />

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Camera</label>
                  <input
                    type="text"
                    list="camera-options"
                    {...register('camera')}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                  <datalist id="camera-options">
                    {CAMERA_OPTIONS.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post-Processing</label>
                  <input
                    type="text"
                    list="pp-options"
                    {...register('postProcessing')}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                  <datalist id="pp-options">
                    {POST_PROCESSING_OPTIONS.map(opt => <option key={opt} value={opt} />)}
                  </datalist>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Style Preset</label>
                <select
                  {...register('stylePreset')}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">None</option>
                  {STYLE_PRESETS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">AI Style Adjustments</label>
                <input
                  type="text"
                  {...register('aiStyle')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Add tweaks or stack additional style cues..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  The preset feeds structure; use this box for per-shot adjustments.
                </p>
              </div>
            </div>

            {/* Clear Form Button */}
            <div className="bg-white rounded-lg shadow p-4">
              <button
                type="button"
                onClick={clearForm}
                className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Clear Form
              </button>
            </div>
          </>
        )}
      </div>

      {/* RIGHT COLUMN: Preview (Fixed) - Hidden in Live Mode */}
      {!isLiveMode && (
        <div className="lg:w-[450px] flex-shrink-0 flex flex-col gap-4 h-full pb-20 lg:pb-0">
          <div className="bg-white rounded-lg shadow p-4 flex-1 flex flex-col min-h-0">
            <PromptPreview
              promptText={generatedPreview}
              onGenerate={handleSubmit(onSubmit)}
              isGenerating={isGenerating}
              className="flex-1"
            />
          </div>

          {/* Quick Uploader for convenience */}
          <div className="bg-white rounded-lg shadow p-4 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Reference Image</h3>
            <ImageDropzone />
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        title="Manage Scenes"
        isOpen={isScenesModalOpen}
        onClose={() => setIsScenesModalOpen(false)}
        widthClass="max-w-4xl"
      >
        <SceneModal
          onClose={() => { setIsScenesModalOpen(false); loadScenes(); }}
          onSaved={loadScenes}
        />
      </Modal>

      <Modal
        title="Manage Characters"
        isOpen={isCharactersModalOpen}
        onClose={() => setIsCharactersModalOpen(false)}
        widthClass="max-w-4xl"
      >
        <CharacterModal
          onClose={() => { setIsCharactersModalOpen(false); loadCharacters(); }}
          onSaved={loadCharacters}
        />
      </Modal>
    </div>
  )
}
