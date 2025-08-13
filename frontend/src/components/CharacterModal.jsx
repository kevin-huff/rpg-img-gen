import React from 'react'
import CharacterManager from './CharacterManager'

// Wrapper to use CharacterManager inside a modal. Accepts onClose and onSaved to notify parent.
export default function CharacterModal({ onClose, onSaved }) {
  return (
    <div>
      {/* We reuse the full CharacterManager; the user can close the modal when done. */}
      <CharacterManager />
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => { onSaved?.(); onClose?.(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>
  )
}
