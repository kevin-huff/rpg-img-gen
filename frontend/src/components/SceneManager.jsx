import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusCircle, Edit, Trash2, MapPin, Save, X } from 'lucide-react'

import { scenesAPI } from '../services/api'

export default function SceneManager() {
  const [scenes, setScenes] = useState([])
  const [editingScene, setEditingScene] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    loadScenes()
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

  const onSubmit = async (data) => {
    try {
      if (editingScene) {
        const response = await scenesAPI.update(editingScene.id, data)
        setScenes(prev => prev.map(scene => 
          scene.id === editingScene.id ? response.data : scene
        ))
        toast.success('Scene updated successfully!')
      } else {
        const response = await scenesAPI.create(data)
        setScenes(prev => [response.data, ...prev])
        toast.success('Scene created successfully!')
      }
      
      handleCancel()
    } catch (error) {
      console.error('Failed to save scene:', error)
      toast.error('Failed to save scene')
    }
  }

  const handleEdit = (scene) => {
    setEditingScene(scene)
    setShowForm(true)
    reset({
      title: scene.title,
      description: scene.description,
      tags: scene.tags || ''
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this scene?')) {
      return
    }

    try {
      await scenesAPI.delete(id)
      setScenes(prev => prev.filter(scene => scene.id !== id))
      toast.success('Scene deleted successfully!')
    } catch (error) {
      console.error('Failed to delete scene:', error)
      toast.error('Failed to delete scene')
    }
  }

  const handleCancel = () => {
    setEditingScene(null)
    setShowForm(false)
    reset()
  }

  const handleNewScene = () => {
    setEditingScene(null)
    setShowForm(true)
    reset()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Scene Manager</h2>
          <button
            onClick={handleNewScene}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Scene</span>
          </button>
        </div>

        {/* Scene Form */}
        {showForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingScene ? 'Edit Scene' : 'Create New Scene'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter scene title..."
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the scene in detail..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  {...register('tags')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tags separated by commas..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use tags to organize and search scenes (e.g., outdoor, dungeon, tavern)
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingScene ? 'Update' : 'Create'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scenes List */}
        {scenes.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No scenes created yet</p>
            <p className="text-sm text-gray-400">Create your first scene to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {scenes.map((scene) => (
              <div
                key={scene.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {scene.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {scene.description}
                    </p>
                    {scene.tags && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {scene.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      Created {new Date(scene.created_at).toLocaleDateString()}
                      {scene.updated_at !== scene.created_at && (
                        <span> • Updated {new Date(scene.updated_at).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(scene)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Edit Scene"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(scene.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete Scene"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
