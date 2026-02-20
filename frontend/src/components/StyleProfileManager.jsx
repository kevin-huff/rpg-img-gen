import React, { useState, useEffect } from 'react'
import { Star, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import ModifierChips from './ModifierChips'
import { styleProfilesAPI } from '../services/api'
import { useSession } from '../contexts/SessionContext'

const STYLE_PRESETS = ['dark fantasy comic art', 'cinematic film still', 'silver age comic', 'noir graphic novel', 'watercolor illustration', 'photorealistic render']
const COMPOSITIONS = ['wide establishing shot', 'rule-of-thirds', 'hero landing splash', 'dutch angle', 'symmetrical framing', 'panoramic vista']
const LIGHTINGS = ['cold moonlight', 'golden hour', 'strobe burst', 'sodium vapor', 'bioluminescent glow', 'candlelight flicker']
const MOODS = ['grim resolve', 'triumphant', 'ferocious blood-rush', 'paranoid dread', 'whimsical mischief', 'serene calm']
const CAMERAS = ['24mm wide', '50mm portrait', '85mm telephoto', 'low angle dynamic', 'bird-eye sweeping', 'canted close-up']
const POST_PROCESSINGS = ['high-contrast grading', 'teal-orange color grade', 'halftone dots', 'film noir vignette', 'pastel bloom', 'desaturated matte']

const emptyProfile = {
  name: '',
  style_preset: '',
  composition: '',
  lighting: '',
  mood: '',
  camera: '',
  post_processing: '',
  ai_style: '',
}

export default function StyleProfileManager({ isOpen, onClose }) {
  const { refreshProfiles, setActiveProfile } = useSession()
  const [profiles, setProfiles] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ ...emptyProfile })
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    if (isOpen) loadProfiles()
  }, [isOpen])

  async function loadProfiles() {
    try {
      const res = await styleProfilesAPI.getAll()
      setProfiles(res.data)
      if (res.data.length > 0 && !selectedId) {
        selectProfile(res.data[0])
      }
    } catch (err) {
      console.error('Failed to load profiles:', err)
    }
  }

  function selectProfile(profile) {
    setSelectedId(profile.id)
    setForm({
      name: profile.name,
      style_preset: profile.style_preset || '',
      composition: profile.composition || '',
      lighting: profile.lighting || '',
      mood: profile.mood || '',
      camera: profile.camera || '',
      post_processing: profile.post_processing || '',
      ai_style: profile.ai_style || '',
    })
    setIsNew(false)
  }

  function startNew() {
    setSelectedId(null)
    setForm({ ...emptyProfile })
    setIsNew(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Profile name is required')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const res = await styleProfilesAPI.create(form)
        toast.success('Profile created!')
        setSelectedId(res.data.id)
        setIsNew(false)
      } else {
        await styleProfilesAPI.update(selectedId, form)
        toast.success('Profile updated!')
      }
      await loadProfiles()
      await refreshProfiles()
    } catch (err) {
      console.error('Failed to save profile:', err)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedId) return
    try {
      await styleProfilesAPI.delete(selectedId)
      toast.success('Profile deleted')
      setSelectedId(null)
      setForm({ ...emptyProfile })
      await loadProfiles()
      await refreshProfiles()
    } catch (err) {
      console.error('Failed to delete profile:', err)
      toast.error('Failed to delete profile')
    }
  }

  async function handleSetDefault() {
    if (!selectedId) return
    try {
      await styleProfilesAPI.setDefault(selectedId)
      toast.success('Default profile updated!')
      setActiveProfile(selectedId)
      await loadProfiles()
      await refreshProfiles()
    } catch (err) {
      console.error('Failed to set default:', err)
      toast.error('Failed to set default')
    }
  }

  const updateField = (key) => (value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Modal title="Style Profile Manager" isOpen={isOpen} onClose={onClose} widthClass="max-w-4xl">
      <div className="flex gap-4 min-h-[400px]">
        {/* Profile list */}
        <div className="w-48 flex-shrink-0 border-r border-gray-200 pr-4">
          <button
            type="button"
            onClick={startNew}
            className="w-full flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-lg mb-3 transition-colors"
          >
            <Plus className="h-3 w-3" />
            New Profile
          </button>
          <div className="space-y-1">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProfile(p)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedId === p.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {p.is_default ? <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> : null}
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Edit form */}
        <div className="flex-1 overflow-y-auto">
          {(selectedId || isNew) ? (
            <div className="space-y-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name')(e.target.value)}
                  placeholder="e.g., Dark Fantasy"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>

              <ModifierChips label="Style Preset" options={STYLE_PRESETS} value={form.style_preset} onChange={updateField('style_preset')} />
              <ModifierChips label="Composition" options={COMPOSITIONS} value={form.composition} onChange={updateField('composition')} />
              <ModifierChips label="Lighting" options={LIGHTINGS} value={form.lighting} onChange={updateField('lighting')} />
              <ModifierChips label="Mood" options={MOODS} value={form.mood} onChange={updateField('mood')} />
              <ModifierChips label="Camera" options={CAMERAS} value={form.camera} onChange={updateField('camera')} />
              <ModifierChips label="Post Processing" options={POST_PROCESSINGS} value={form.post_processing} onChange={updateField('post_processing')} />

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isNew ? 'Create Profile' : 'Save Changes'}
                </button>
                {!isNew && (
                  <>
                    <button
                      type="button"
                      onClick={handleSetDefault}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50 border border-yellow-300 rounded-lg"
                    >
                      <Star className="h-3.5 w-3.5" />
                      Set as Default
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-lg ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Select a profile or create a new one</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
