import React from 'react'
import SceneManager from './SceneManager'

// Wrapper to use SceneManager inside a modal. Accepts onClose and onSaved to notify parent.
export default function SceneModal({ onClose, onSaved }) {
  return (
    <div>
      {/* We reuse the full SceneManager; the user can close the modal when done. */}
      <SceneManager onSceneChanged={onSaved} />
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
