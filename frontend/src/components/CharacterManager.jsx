import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusCircle, Edit, Trash2, Users, Save, X } from 'lucide-react'

import { charactersAPI } from '../services/api'

export default function CharacterManager() {
  const [characters, setCharacters] = useState([])
  const [editingCharacter, setEditingCharacter] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    try {
      const response = await charactersAPI.getAll({ limit: 100 })
      setCharacters(response.data)
    } catch (error) {
      console.error('Failed to load characters:', error)
      toast.error('Failed to load characters')
    }
  }

  const onSubmit = async (data) => {
    try {
      if (editingCharacter) {
        const response = await charactersAPI.update(editingCharacter.id, data)
        setCharacters(prev => prev.map(character => 
          character.id === editingCharacter.id ? response.data : character
        ))
        toast.success('Character updated successfully!')
      } else {
        const response = await charactersAPI.create(data)
        setCharacters(prev => [response.data, ...prev])
        toast.success('Character created successfully!')
      }
      
      handleCancel()
    } catch (error) {
      console.error('Failed to save character:', error)
      toast.error('Failed to save character')
    }
  }

  const handleEdit = (character) => {
    setEditingCharacter(character)
    setShowForm(true)
    reset({
      name: character.name,
      description: character.description,
      appearance: character.appearance || '',
      tags: character.tags || ''
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this character?')) {
      return
    }

    try {
      await charactersAPI.delete(id)
      setCharacters(prev => prev.filter(character => character.id !== id))
      toast.success('Character deleted successfully!')
    } catch (error) {
      console.error('Failed to delete character:', error)
      toast.error('Failed to delete character')
    }
  }

  const handleCancel = () => {
    setEditingCharacter(null)
    setShowForm(false)
    reset()
  }

  const handleNewCharacter = () => {
    setEditingCharacter(null)
    setShowForm(true)
    reset()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Character Manager</h2>
          <button
            onClick={handleNewCharacter}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Character</span>
          </button>
        </div>

        {/* Character Form */}
        {showForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCharacter ? 'Edit Character' : 'Create New Character'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter character name..."
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the character's personality, role, background..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appearance (Optional)
                </label>
                <textarea
                  {...register('appearance')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the character's physical appearance, clothing, etc..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Physical descriptions help generate better AI images
                </p>
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
                  Use tags to organize characters (e.g., NPC, player, villain, ally)
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingCharacter ? 'Update' : 'Create'}</span>
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

        {/* Characters List */}
        {characters.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No characters created yet</p>
            <p className="text-sm text-gray-400">Create your first character to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {characters.map((character) => (
              <div
                key={character.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {character.name}
                    </h3>
                    
                    <div className="space-y-2 mb-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
                        <p className="text-gray-600 text-sm">
                          {character.description}
                        </p>
                      </div>
                      
                      {character.appearance && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">Appearance</span>
                          <p className="text-gray-600 text-sm">
                            {character.appearance}
                          </p>
                        </div>
                      )}
                    </div>

                    {character.tags && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {character.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      Created {new Date(character.created_at).toLocaleDateString()}
                      {character.updated_at !== character.created_at && (
                        <span> • Updated {new Date(character.updated_at).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(character)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Edit Character"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(character.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete Character"
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
