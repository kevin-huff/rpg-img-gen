import React, { useEffect, useRef } from 'react'
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

export default function ActionInput({ textareaRef }) {
  const { actionText, setAction } = useSession()
  const quickActions = loadQuickActions()
  const ref = textareaRef || useRef(null)

  useEffect(() => {
    ref.current?.focus()
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
      <div className="flex flex-wrap gap-2 mt-2">
        {quickActions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => setAction(action)}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full border border-gray-300 hover:bg-blue-50 hover:border-blue-400 transition-colors"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  )
}
