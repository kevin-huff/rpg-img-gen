import React, { useCallback, useEffect, useRef } from 'react'
import { Zap, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { SessionProvider, useSession } from '../contexts/SessionContext'
import PersistentBar from './PersistentBar'
import SceneSelector from './SceneSelector'
import ActionInput from './ActionInput'
import StyleOverridePanel from './StyleOverridePanel'
import RecentPromptsRail from './RecentPromptsRail'

function DashboardContent() {
  const {
    assembledPrompt,
    promptCharCount,
    generate,
    clearAction,
    clearOverrides,
    hasOverrides,
    loading,
  } = useSession()

  const textareaRef = useRef(null)

  const handleGenerate = useCallback(async () => {
    await generate()
    // Re-focus action textarea after generate
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [generate])

  const handleCopyOnly = useCallback(async () => {
    if (!assembledPrompt || assembledPrompt === '.') return
    try {
      await navigator.clipboard.writeText(assembledPrompt)
      toast.success('Prompt copied!')
    } catch {
      toast.error('Failed to copy')
    }
  }, [assembledPrompt])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Ctrl+Enter → Generate + Copy
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        handleGenerate()
        return
      }

      // Escape → Clear action, then clear overrides
      if (e.key === 'Escape') {
        const activeEl = document.activeElement
        const isTextarea = activeEl?.tagName === 'TEXTAREA'
        if (isTextarea && activeEl?.value) {
          clearAction()
        } else if (hasOverrides) {
          clearOverrides()
        }
        return
      }

      // Ctrl+Shift+C → Copy preview without generating
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        handleCopyOnly()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleGenerate, handleCopyOnly, clearAction, clearOverrides, hasOverrides])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Top bar: Style Profile + Party toggles */}
      <PersistentBar />

      {/* Main content */}
      <div className="p-4 space-y-4">
        {/* Scene selector */}
        <SceneSelector />

        {/* Action input - the hot path */}
        <ActionInput textareaRef={textareaRef} />

        {/* Generate button + Style tweaks toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!assembledPrompt || assembledPrompt === '.'}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Zap className="h-4 w-4" />
            Generate + Copy
          </button>
          <button
            type="button"
            onClick={handleCopyOnly}
            disabled={!assembledPrompt || assembledPrompt === '.'}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="h-4 w-4" />
            Copy Only
          </button>
          <div className="flex-1" />
          <StyleOverridePanel />
        </div>

        {/* Prompt preview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Prompt Preview
            </label>
            {promptCharCount > 0 && (
              <span className={`text-xs tabular-nums ${promptCharCount > 1500 ? 'text-red-500 font-semibold' : promptCharCount > 1000 ? 'text-yellow-600' : 'text-gray-400'}`}>
                {promptCharCount} chars
              </span>
            )}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm text-gray-800 whitespace-pre-wrap min-h-[80px]">
            {assembledPrompt && assembledPrompt !== '.'
              ? assembledPrompt
              : <span className="text-gray-400 italic">Select a style, characters, scene, and action to preview your prompt...</span>
            }
          </div>
        </div>

        {/* Recent prompts */}
        <RecentPromptsRail />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex gap-4 text-[10px] text-gray-400">
        <span>Ctrl+Enter: Generate</span>
        <span>Escape: Clear action</span>
        <span>Ctrl+Shift+C: Copy only</span>
      </div>
    </div>
  )
}

export default function SessionDashboard() {
  return (
    <SessionProvider>
      <DashboardContent />
    </SessionProvider>
  )
}
