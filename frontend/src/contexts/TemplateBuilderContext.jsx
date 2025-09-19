import React, { createContext, useCallback, useContext, useState } from 'react'

const TemplateBuilderContext = createContext(null)

export function TemplateBuilderProvider({ children, onRequestNavigate }) {
  const [prefill, setPrefill] = useState(null)

  const requestPrefill = useCallback((data) => {
    if (!data) return
    setPrefill({ ...data })
    if (typeof onRequestNavigate === 'function') {
      onRequestNavigate('template')
    }
  }, [onRequestNavigate])

  const clearPrefill = useCallback(() => {
    setPrefill(null)
  }, [])

  const value = {
    prefill,
    requestPrefill,
    clearPrefill,
  }

  return (
    <TemplateBuilderContext.Provider value={value}>
      {children}
    </TemplateBuilderContext.Provider>
  )
}

export function useTemplateBuilder() {
  const context = useContext(TemplateBuilderContext)
  if (!context) {
    throw new Error('useTemplateBuilder must be used within a TemplateBuilderProvider')
  }
  return context
}
