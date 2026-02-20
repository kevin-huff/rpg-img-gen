import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useSession } from '../contexts/SessionContext'
import ModifierChips from './ModifierChips'

const STYLE_DIMENSIONS = [
  {
    key: 'style_preset',
    label: 'Style Preset',
    options: ['dark fantasy comic art', 'cinematic film still', 'silver age comic', 'noir graphic novel', 'watercolor illustration', 'photorealistic render'],
  },
  {
    key: 'composition',
    label: 'Composition',
    options: ['wide establishing shot', 'rule-of-thirds', 'hero landing splash', 'dutch angle', 'symmetrical framing', 'panoramic vista'],
  },
  {
    key: 'lighting',
    label: 'Lighting',
    options: ['cold moonlight', 'golden hour', 'strobe burst', 'sodium vapor', 'bioluminescent glow', 'candlelight flicker'],
  },
  {
    key: 'mood',
    label: 'Mood',
    options: ['grim resolve', 'triumphant', 'ferocious blood-rush', 'paranoid dread', 'whimsical mischief', 'serene calm'],
  },
  {
    key: 'camera',
    label: 'Camera',
    options: ['24mm wide', '50mm portrait', '85mm telephoto', 'low angle dynamic', 'bird-eye sweeping', 'canted close-up'],
  },
  {
    key: 'post_processing',
    label: 'Post Processing',
    options: ['high-contrast grading', 'teal-orange color grade', 'halftone dots', 'film noir vignette', 'pastel bloom', 'desaturated matte'],
  },
]

export default function StyleOverridePanel() {
  const { styleOverrides, setStyleOverride, hasOverrides, clearOverrides } = useSession()
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Style Tweaks
          {hasOverrides && (
            <span className="w-2 h-2 bg-yellow-400 rounded-full" title="Overrides active" />
          )}
        </button>
        {hasOverrides && (
          <button
            type="button"
            onClick={clearOverrides}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Clear overrides
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 mb-3">
            Override style profile values for this shot only. Resets after generate.
          </p>
          {STYLE_DIMENSIONS.map((dim) => (
            <ModifierChips
              key={dim.key}
              label={dim.label}
              options={dim.options}
              value={styleOverrides[dim.key] || ''}
              onChange={(val) => setStyleOverride(dim.key, val)}
              allowCustom={true}
              placeholder={`Custom ${dim.label.toLowerCase()}...`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
