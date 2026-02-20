import React, { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from '../contexts/SessionContext'
import { scenesAPI } from '../services/api'

const SceneSelector = React.memo(function SceneSelector() {
  const { scenes, activeSceneId, setScene, refreshScenes } = useSession()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const activeScene = useMemo(
    () => scenes.find(s => s.id === activeSceneId),
    [scenes, activeSceneId]
  )

  const handleQuickCreate = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error('Title and description are required')
      return
    }

    setCreating(true)
    try {
      const res = await scenesAPI.create({
        title: newTitle.trim(),
        description: newDescription.trim(),
        tags: '',
      })
      await refreshScenes()
      setScene(res.data.id)
      setNewTitle('')
      setNewDescription('')
      setShowQuickAdd(false)
      toast.success('Scene created!')
    } catch (err) {
      console.error('Failed to create scene:', err)
      toast.error('Failed to create scene')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
          Scene:
        </label>
        <select
          value={activeSceneId || ''}
          onChange={(e) => setScene(e.target.value ? Number(e.target.value) : null)}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-white"
          title={activeScene?.description || ''}
        >
          <option value="">Select scene...</option>
          {scenes.map((s) => (
            <option key={s.id} value={s.id} title={s.description}>{s.title}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors"
        >
          <Plus className="h-3 w-3" />
          Quick Scene
        </button>
      </div>

      {/* Scene description preview */}
      {activeScene && (
        <p className="mt-1 ml-12 text-xs text-gray-500 italic truncate" title={activeScene.description}>
          {activeScene.description}
        </p>
      )}

      {showQuickAdd && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Scene title"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Scene description (used in prompt)"
            rows={2}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleQuickCreate}
              disabled={creating}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export default SceneSelector
