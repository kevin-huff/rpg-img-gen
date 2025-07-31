import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusCircle, Sparkles, Copy, Save } from 'lucide-react'

import { scenesAPI, charactersAPI, templatesAPI } from '../services/api'

export default function TemplateGenerator() {
  const [scenes, setScenes] = useState([])
  const [characters, setCharacters] = useState([])
  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [events, setEvents] = useState([''])
  const [generatedTemplate, setGeneratedTemplate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      title: '',
      sceneId: '',
      aiStyle: '',
      customPrompt: '',
    }
  })

  // Load scenes and characters on mount
  useEffect(() => {
    loadScenes()
    loadCharacters()
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

  const handleCharacterToggle = (characterId) => {
    setSelectedCharacters(prev => 
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    )
  }

  const addEvent = () => {
    setEvents(prev => [...prev, ''])
  }

  const updateEvent = (index, value) => {
    setEvents(prev => prev.map((event, i) => i === index ? value : event))
  }

  const removeEvent = (index) => {
    setEvents(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    setIsGenerating(true)
    
    try {
      const templateData = {
        title: data.title,
        sceneId: data.sceneId ? parseInt(data.sceneId) : null,
        characterIds: selectedCharacters,
        eventDescriptions: events.filter(event => event.trim()),
        aiStyle: data.aiStyle,
        customPrompt: data.customPrompt,
      }

      const response = await templatesAPI.generate(templateData)
      setGeneratedTemplate(response.data.templateText)
      toast.success('Template generated successfully!')
      
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
    setEvents([''])
    setGeneratedTemplate('')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          AI Image Template Generator
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Scene Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scene
            </label>
            <select
              {...register('sceneId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a scene...</option>
              {scenes.map(scene => (
                <option key={scene.id} value={scene.id}>
                  {scene.title}
                </option>
              ))}
            </select>
          </div>

          {/* Character Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Characters
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
              {characters.map(character => (
                <label key={character.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedCharacters.includes(character.id)}
                    onChange={() => handleCharacterToggle(character.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{character.name}</span>
                </label>
              ))}
            </div>
            {characters.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No characters available. Create some characters first.
              </p>
            )}
          </div>

          {/* Events/Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Events/Actions
              </label>
              <button
                type="button"
                onClick={addEvent}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Event</span>
              </button>
            </div>
            <div className="space-y-2">
              {events.map((event, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={event}
                    onChange={(e) => updateEvent(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Event ${index + 1}...`}
                  />
                  {events.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEvent(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
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
            <input
              type="text"
              {...register('aiStyle')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., digital art, photorealistic, fantasy art, anime style..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Generated Template */}
      {generatedTemplate && (
        <div className="bg-white rounded-lg shadow p-6">
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
    </div>
  )
}
