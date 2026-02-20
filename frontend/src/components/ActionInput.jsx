import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Settings, Plus, X } from 'lucide-react'
import { useSession } from '../contexts/SessionContext'

const DEFAULT_QUICK_ACTIONS = [
  'Charges forward',
  'Casts a spell',
  'Sneaks past',
  'Takes defensive stance',
  'Flees in panic',
  'Examines closely',
]

function loadQuickActions() {
  try {
    const stored = localStorage.getItem('session_quickActions')
    return stored ? JSON.parse(stored) : DEFAULT_QUICK_ACTIONS
  } catch {
    return DEFAULT_QUICK_ACTIONS
  }
}

function saveQuickActions(actions) {
  localStorage.setItem('session_quickActions', JSON.stringify(actions))
}

const ActionInput = React.memo(function ActionInput({ textareaRef }) {
  const { actionText, setAction } = useSession()
  const [quickActions, setQuickActions] = useState(loadQuickActions)
  const [editing, setEditing] = useState(false)
  const [newAction, setNewAction] = useState('')
  const ref = textareaRef || useRef(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const handleAddQuickAction = useCallback(() => {
    const trimmed = newAction.trim()
    if (!trimmed || quickActions.includes(trimmed)) return
    const updated = [...quickActions, trimmed]
    setQuickActions(updated)
    saveQuickActions(updated)
    setNewAction('')
  }, [newAction, quickActions])

  const handleRemoveQuickAction = useCallback((index) => {
    const updated = quickActions.filter((_, i) => i !== index)
    setQuickActions(updated)
    saveQuickActions(updated)
  }, [quickActions])

  const handleResetDefaults = useCallback(() => {
    setQuickActions(DEFAULT_QUICK_ACTIONS)
    saveQuickActions(DEFAULT_QUICK_ACTIONS)
  }, [])

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        Action
      </label>
      <textarea
        ref={ref}
        value={actionText}
        onChange={(e) => setAction(e.target.value)}
        placeholder="Type what's happening right now..."
        rows={3}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base resize-none transition-colors"
      />
      <div className="flex items-center gap-2 mt-2">
        <div className="flex flex-wrap gap-2 flex-1">
          {quickActions.map((action, index) => (
            <span key={`${action}-${index}`} className="relative group">
              <button
                type="button"
                onClick={() => setAction(action)}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full border border-gray-300 hover:bg-blue-50 hover:border-blue-400 transition-colors"
              >
                {action}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => handleRemoveQuickAction(index)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          ))}
          {editing && (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddQuickAction() } }}
                placeholder="New action..."
                className="px-2 py-1 text-xs border border-gray-300 rounded-full w-32 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={handleAddQuickAction}
                disabled={!newAction.trim()}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (editing) setNewAction('')
            setEditing(!editing)
          }}
          className={`p-1.5 rounded transition-colors ${editing ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          title={editing ? 'Done editing' : 'Customize quick actions'}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
      {editing && (
        <div className="mt-1 text-right">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[10px] text-gray-400 hover:text-gray-600"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  )
})

export default ActionInput
