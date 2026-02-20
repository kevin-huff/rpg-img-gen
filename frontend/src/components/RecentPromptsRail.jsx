import React from 'react'
import { RotateCcw } from 'lucide-react'
import { useSession } from '../contexts/SessionContext'

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function RecentPromptsRail() {
  const { recentPrompts, remixFromRecent } = useSession()

  if (recentPrompts.length === 0) return null

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Recent Prompts
      </label>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {recentPrompts.map((recent, index) => (
          <button
            key={recent.timestamp}
            type="button"
            onClick={() => remixFromRecent(index)}
            className="flex-shrink-0 w-56 p-3 bg-white border border-gray-200 rounded-lg text-left hover:border-blue-400 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-xs text-gray-400">{timeAgo(recent.timestamp)}</span>
              <RotateCcw className="h-3 w-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-xs text-gray-700 line-clamp-2 mb-1.5">
              {recent.action || '(no action)'}
            </p>
            <div className="flex items-center gap-2">
              {recent.sceneName && (
                <span className="px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 rounded">
                  {recent.sceneName}
                </span>
              )}
              {recent.characterCount > 0 && (
                <span className="text-[10px] text-gray-400">
                  {recent.characterCount} char{recent.characterCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
