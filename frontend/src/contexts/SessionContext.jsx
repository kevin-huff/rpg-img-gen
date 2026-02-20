import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import toast from 'react-hot-toast'
import { styleProfilesAPI, scenesAPI, charactersAPI } from '../services/api'

const SessionContext = createContext(null)

const MAX_RECENT = 10

function loadLocalStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored !== null ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

const initialState = {
  // Style profiles
  profiles: [],
  activeProfileId: null,
  activeProfile: null,

  // Party
  characters: [],
  activeCharacterIds: [],

  // Scene
  scenes: [],
  activeSceneId: null,

  // Action (hot path)
  actionText: '',

  // Style overrides (per-shot)
  styleOverrides: {},

  // Recent prompts
  recentPrompts: loadLocalStorage('session_recentPrompts', []),

  // Settings
  autoCopy: loadLocalStorage('session_autoCopy', true),

  // Loading
  loading: true,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROFILES':
      return { ...state, profiles: action.payload }
    case 'SET_ACTIVE_PROFILE': {
      const profile = state.profiles.find(p => p.id === action.payload) || null
      return { ...state, activeProfileId: action.payload, activeProfile: profile }
    }
    case 'SET_CHARACTERS':
      return { ...state, characters: action.payload }
    case 'TOGGLE_CHARACTER': {
      const id = action.payload
      const ids = state.activeCharacterIds.includes(id)
        ? state.activeCharacterIds.filter(cid => cid !== id)
        : [...state.activeCharacterIds, id]
      return { ...state, activeCharacterIds: ids }
    }
    case 'SET_ACTIVE_CHARACTER_IDS':
      return { ...state, activeCharacterIds: action.payload }
    case 'SET_SCENES':
      return { ...state, scenes: action.payload }
    case 'SET_ACTIVE_SCENE':
      return { ...state, activeSceneId: action.payload }
    case 'SET_ACTION':
      return { ...state, actionText: action.payload }
    case 'SET_STYLE_OVERRIDE':
      return {
        ...state,
        styleOverrides: { ...state.styleOverrides, [action.payload.key]: action.payload.value },
      }
    case 'CLEAR_STYLE_OVERRIDES':
      return { ...state, styleOverrides: {} }
    case 'ADD_RECENT_PROMPT': {
      const updated = [action.payload, ...state.recentPrompts].slice(0, MAX_RECENT)
      localStorage.setItem('session_recentPrompts', JSON.stringify(updated))
      return { ...state, recentPrompts: updated }
    }
    case 'SET_AUTO_COPY':
      localStorage.setItem('session_autoCopy', JSON.stringify(action.payload))
      return { ...state, autoCopy: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

function assemblePrompt(state) {
  const profile = state.activeProfile
  const scene = state.scenes.find(s => s.id === state.activeSceneId)
  const activeChars = state.characters.filter(c => state.activeCharacterIds.includes(c.id))
  const overrides = state.styleOverrides

  const parts = []

  // Layer 1 + 5: Style (profile defaults merged with overrides)
  const stylePreset = overrides.style_preset || profile?.style_preset
  const composition = overrides.composition || profile?.composition
  const lighting = overrides.lighting || profile?.lighting
  const mood = overrides.mood || profile?.mood
  const camera = overrides.camera || profile?.camera
  const postProcessing = overrides.post_processing || profile?.post_processing

  if (stylePreset) parts.push(stylePreset)
  if (composition) parts.push(composition)
  if (lighting) parts.push(lighting)
  if (mood) parts.push(mood)

  // Layer 3: Scene
  if (scene) {
    parts.push(`Setting: ${scene.description}`)
  }

  // Layer 2: Party characters
  if (activeChars.length > 0) {
    const charDescriptions = activeChars.map(c => {
      const desc = c.appearance || c.description
      return `${c.name}, ${desc}`
    })
    parts.push(charDescriptions.join('; '))
  }

  // Layer 4: Action
  if (state.actionText.trim()) {
    parts.push(state.actionText.trim())
  }

  // Camera and post-processing at the end
  if (camera) parts.push(`Camera: ${camera}`)
  if (postProcessing) parts.push(postProcessing)

  return parts.filter(Boolean).join('. ').replace(/\.\./g, '.') + '.'
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [profilesRes, scenesRes, charsRes] = await Promise.all([
          styleProfilesAPI.getAll(),
          scenesAPI.getAll(),
          charactersAPI.getAll(),
        ])

        dispatch({ type: 'SET_PROFILES', payload: profilesRes.data })
        dispatch({ type: 'SET_SCENES', payload: scenesRes.data })
        dispatch({ type: 'SET_CHARACTERS', payload: charsRes.data })

        // Set default profile
        const defaultProfile = profilesRes.data.find(p => p.is_default) || profilesRes.data[0]
        if (defaultProfile) {
          dispatch({ type: 'SET_ACTIVE_PROFILE', payload: defaultProfile.id })
        }
      } catch (err) {
        console.error('Failed to load session data:', err)
        toast.error('Failed to load session data')
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    loadData()
  }, [])

  const assembledPrompt = useMemo(() => {
    if (!state.activeProfile && !state.activeSceneId && state.activeCharacterIds.length === 0 && !state.actionText) {
      return ''
    }
    return assemblePrompt(state)
  }, [
    state.activeProfile,
    state.activeSceneId,
    state.activeCharacterIds,
    state.actionText,
    state.styleOverrides,
    state.scenes,
    state.characters,
  ])

  const setActiveProfile = useCallback((id) => {
    dispatch({ type: 'SET_ACTIVE_PROFILE', payload: id })
  }, [])

  const toggleCharacter = useCallback((id) => {
    dispatch({ type: 'TOGGLE_CHARACTER', payload: id })
  }, [])

  const setScene = useCallback((id) => {
    dispatch({ type: 'SET_ACTIVE_SCENE', payload: id })
  }, [])

  const setAction = useCallback((text) => {
    dispatch({ type: 'SET_ACTION', payload: text })
  }, [])

  const setStyleOverride = useCallback((key, value) => {
    dispatch({ type: 'SET_STYLE_OVERRIDE', payload: { key, value } })
  }, [])

  const clearAction = useCallback(() => {
    dispatch({ type: 'SET_ACTION', payload: '' })
  }, [])

  const clearOverrides = useCallback(() => {
    dispatch({ type: 'CLEAR_STYLE_OVERRIDES' })
  }, [])

  const generate = useCallback(async () => {
    if (!assembledPrompt || assembledPrompt === '.') return null

    try {
      await navigator.clipboard.writeText(assembledPrompt)
      toast.success('Prompt copied to clipboard!')
    } catch {
      toast.error('Failed to copy to clipboard')
    }

    // Save to recent
    const scene = state.scenes.find(s => s.id === state.activeSceneId)
    dispatch({
      type: 'ADD_RECENT_PROMPT',
      payload: {
        prompt: assembledPrompt,
        action: state.actionText,
        sceneName: scene?.title || '',
        sceneId: state.activeSceneId,
        characterIds: [...state.activeCharacterIds],
        characterCount: state.activeCharacterIds.length,
        profileId: state.activeProfileId,
        timestamp: Date.now(),
      },
    })

    // Auto-reset overrides after generate
    dispatch({ type: 'CLEAR_STYLE_OVERRIDES' })
    // Clear action for next shot
    dispatch({ type: 'SET_ACTION', payload: '' })

    return assembledPrompt
  }, [assembledPrompt, state.actionText, state.activeSceneId, state.activeCharacterIds, state.activeProfileId, state.scenes])

  const remixFromRecent = useCallback((index) => {
    const recent = state.recentPrompts[index]
    if (!recent) return

    if (recent.profileId) dispatch({ type: 'SET_ACTIVE_PROFILE', payload: recent.profileId })
    if (recent.sceneId) dispatch({ type: 'SET_ACTIVE_SCENE', payload: recent.sceneId })
    if (recent.characterIds) dispatch({ type: 'SET_ACTIVE_CHARACTER_IDS', payload: recent.characterIds })
    dispatch({ type: 'SET_ACTION', payload: '' })
    dispatch({ type: 'CLEAR_STYLE_OVERRIDES' })

    toast.success('Loaded from recent - type a new action!')
  }, [state.recentPrompts])

  const refreshProfiles = useCallback(async () => {
    try {
      const res = await styleProfilesAPI.getAll()
      dispatch({ type: 'SET_PROFILES', payload: res.data })
    } catch (err) {
      console.error('Failed to refresh profiles:', err)
    }
  }, [])

  const refreshScenes = useCallback(async () => {
    try {
      const res = await scenesAPI.getAll()
      dispatch({ type: 'SET_SCENES', payload: res.data })
    } catch (err) {
      console.error('Failed to refresh scenes:', err)
    }
  }, [])

  const refreshCharacters = useCallback(async () => {
    try {
      const res = await charactersAPI.getAll()
      dispatch({ type: 'SET_CHARACTERS', payload: res.data })
    } catch (err) {
      console.error('Failed to refresh characters:', err)
    }
  }, [])

  const setAutoCopy = useCallback((val) => {
    dispatch({ type: 'SET_AUTO_COPY', payload: val })
  }, [])

  const hasOverrides = Object.values(state.styleOverrides).some(v => v && v.trim())

  const value = {
    ...state,
    assembledPrompt,
    hasOverrides,
    setActiveProfile,
    toggleCharacter,
    setScene,
    setAction,
    setStyleOverride,
    clearAction,
    clearOverrides,
    generate,
    remixFromRecent,
    refreshProfiles,
    refreshScenes,
    refreshCharacters,
    setAutoCopy,
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
