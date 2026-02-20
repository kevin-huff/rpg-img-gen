import React, { useState } from 'react'
import { Settings, Plus } from 'lucide-react'
import { useSession } from '../contexts/SessionContext'
import StyleProfileManager from './StyleProfileManager'

export default function PersistentBar() {
  const {
    profiles,
    activeProfileId,
    setActiveProfile,
    characters,
    activeCharacterIds,
    toggleCharacter,
    autoCopy,
    setAutoCopy,
  } = useSession()

  const [showProfileManager, setShowProfileManager] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-white border-b border-gray-200">
        {/* Style Profile selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
            Style:
          </label>
          <select
            value={activeProfileId || ''}
            onChange={(e) => setActiveProfile(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-white"
          >
            <option value="" disabled>Select profile...</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.is_default ? ' (default)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowProfileManager(true)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Manage style profiles"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Party character toggles */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
            Party:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {characters.map((char) => {
              const isActive = activeCharacterIds.includes(char.id)
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => toggleCharacter(char.id)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  title={char.description}
                >
                  {char.name}
                </button>
              )
            })}
            {characters.length === 0 && (
              <span className="text-xs text-gray-400 italic">No characters yet</span>
            )}
          </div>
        </div>

        {/* Auto-copy toggle */}
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={autoCopy}
            onChange={(e) => setAutoCopy(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Auto-copy
        </label>
      </div>

      <StyleProfileManager
        isOpen={showProfileManager}
        onClose={() => setShowProfileManager(false)}
      />
    </>
  )
}
