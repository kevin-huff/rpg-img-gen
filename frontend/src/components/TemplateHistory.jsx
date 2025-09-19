import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { FileImage, Copy, Trash2, Clock, Eye, MoveRight } from 'lucide-react'

import { templatesAPI } from '../services/api'
import { useTemplateBuilder } from '../contexts/TemplateBuilderContext'

export default function TemplateHistory() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const { requestPrefill } = useTemplateBuilder()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await templatesAPI.getAll({ limit: 50 })
      setTemplates(response.data)
    } catch (error) {
      console.error('Failed to load templates:', error)
      toast.error('Failed to load template history')
    } finally {
      setLoading(false)
    }
  }

  const copyTemplate = async (templateText) => {
    try {
      await navigator.clipboard.writeText(templateText)
      toast.success('Template copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy template')
    }
  }

  const deleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      await templatesAPI.delete(id)
      setTemplates(prev => prev.filter(template => template.id !== id))
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null)
      }
      toast.success('Template deleted successfully!')
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error('Failed to delete template')
    }
  }

  const handleLoadInBuilder = (template) => {
    if (!template) return

    const snapshot = template.input_snapshot || {}
    const toNumber = (value) => {
      if (value === null || value === undefined || value === '') return null
      const parsed = typeof value === 'string' ? parseInt(value, 10) : value
      return Number.isFinite(parsed) ? parsed : null
    }

    const arrayOrEmpty = (value) => (Array.isArray(value) ? [...value] : [])

    const payload = {
      title: snapshot.title ?? template.title ?? '',
      sceneId: toNumber(snapshot.sceneId ?? template.scene_id ?? null),
      characterIds: arrayOrEmpty(snapshot.characterIds ?? template.character_ids),
      eventIds: arrayOrEmpty(snapshot.eventIds ?? template.event_ids),
      eventDescriptions: arrayOrEmpty(snapshot.eventDescriptions),
      aiStyle: snapshot.aiStyle ?? template.ai_style ?? '',
      stylePreset: snapshot.stylePreset ?? '',
      customPrompt: snapshot.customPrompt ?? '',
      composition: snapshot.composition ?? '',
      lighting: snapshot.lighting ?? '',
      mood: snapshot.mood ?? '',
      camera: snapshot.camera ?? '',
      postProcessing: snapshot.postProcessing ?? '',
      modifiers: arrayOrEmpty(snapshot.modifiers),
    }

    requestPrefill(payload)
    toast.success('Template loaded into builder')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading templates...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Template History</h2>

        {templates.length === 0 ? (
          <div className="text-center py-8">
            <FileImage className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No templates generated yet</p>
            <p className="text-sm text-gray-400">Generated templates will appear here</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Templates List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Generated Templates</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {template.title || `Template ${template.id}`}
                        </h4>
                        {template.scene_title && (
                          <p className="text-sm text-blue-600 mb-1">
                            Scene: {template.scene_title}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(template.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLoadInBuilder(template)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Load in Builder"
                        >
                          <MoveRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyTemplate(template.template_text)
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Copy Template"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTemplate(template.id)
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Preview */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                {selectedTemplate ? 'Template Preview' : 'Select a template to view'}
              </h3>
              
              {selectedTemplate ? (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {selectedTemplate.title || `Template ${selectedTemplate.id}`}
                    </h4>
                    
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <div className="text-sm text-gray-500">
                        <p>Created: {formatDate(selectedTemplate.created_at)}</p>
                        {selectedTemplate.scene_title && (
                          <p>Scene: {selectedTemplate.scene_title}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadInBuilder(selectedTemplate)}
                          className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          <MoveRight className="h-3 w-3" />
                          <span>Load in Builder</span>
                        </button>
                        <button
                          onClick={() => copyTemplate(selectedTemplate.template_text)}
                          className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Generated Template:</h5>
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {selectedTemplate.template_text}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-8 text-center">
                  <Eye className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">Select a template from the list to view its contents</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
