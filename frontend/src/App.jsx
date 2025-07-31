import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { FileImage, PenTool, Upload, Users, MapPin, LogOut } from 'lucide-react'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import TemplateGenerator from './components/TemplateGenerator'
import ImageUploader from './components/ImageUploader'
import SceneManager from './components/SceneManager'
import CharacterManager from './components/CharacterManager'
import TemplateHistory from './components/TemplateHistory'

function AppContent() {
  const { user, authenticated, loading, login, logout } = useAuth()
  const [currentTab, setCurrentTab] = useState('template')

  const navigation = [
    { id: 'template', name: 'Template Generator', icon: PenTool, component: TemplateGenerator },
    { id: 'scenes', name: 'Scenes', icon: MapPin, component: SceneManager },
    { id: 'characters', name: 'Characters', icon: Users, component: CharacterManager },
    { id: 'images', name: 'Image Uploader', icon: Upload, component: ImageUploader },
    { id: 'history', name: 'Template History', icon: FileImage, component: TemplateHistory },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!authenticated) {
    return <Login onLogin={login} />
  }

  const CurrentComponent = navigation.find(nav => nav.id === currentTab)?.component || TemplateGenerator

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                RPG Image Generator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {user?.username}
              </span>
              <span className="text-sm text-gray-500">
                OBS Overlay: 
                <a 
                  href="http://localhost:3000/overlay" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  localhost:3000/overlay
                </a>
              </span>
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentTab === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <CurrentComponent />
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
