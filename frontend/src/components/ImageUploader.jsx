import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Upload, Image as ImageIcon, Trash2, Eye, Monitor } from 'lucide-react'
import io from 'socket.io-client'

import { imagesAPI } from '../services/api'

export default function ImageUploader() {
  // Environment-aware base URL helper
  const getBaseUrl = () => {
    return import.meta.env.PROD ? window.location.origin : 'http://localhost:3000'
  }
  const [images, setImages] = useState([])
  const [activeImage, setActiveImage] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    loadImages()
    loadActiveImage()
    initializeSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const initializeSocket = () => {
    // Environment-aware Socket.IO connection
    const socketUrl = import.meta.env.PROD 
      ? window.location.origin  // Use same origin in production
      : 'http://localhost:3000'  // Use localhost in development
    
    socketRef.current = io(socketUrl)
    
    socketRef.current.on('connect', () => {
      console.log('Connected to server')
    })

    socketRef.current.on('image-uploaded', (imageData) => {
      setImages(prev => [imageData, ...prev])
      if (imageData.is_active) {
        setActiveImage(imageData)
      }
    })
  }

  const loadImages = async () => {
    try {
      const response = await imagesAPI.getAll({ limit: 50 })
      setImages(response.data)
    } catch (error) {
      console.error('Failed to load images:', error)
      toast.error('Failed to load images')
    }
  }

  const loadActiveImage = async () => {
    try {
      const response = await imagesAPI.getActive()
      setActiveImage(response.data)
    } catch (error) {
      console.error('Failed to load active image:', error)
    }
  }

  const handleFileSelect = (files) => {
    const file = files[0]
    if (file) {
      uploadImage(file)
    }
  }

  const uploadImage = async (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('setActive', 'true')

      const response = await imagesAPI.upload(formData)
      toast.success('Image uploaded successfully!')
      
      // The socket event will update the state
      
    } catch (error) {
      console.error('Failed to upload image:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const activateImage = async (id) => {
    try {
      const response = await imagesAPI.activate(id)
      setActiveImage(response.data)
      setImages(prev => prev.map(img => ({
        ...img,
        is_active: img.id === id ? 1 : 0
      })))
      toast.success('Image activated!')
    } catch (error) {
      console.error('Failed to activate image:', error)
      toast.error('Failed to activate image')
    }
  }

  const deleteImage = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      await imagesAPI.delete(id)
      setImages(prev => prev.filter(img => img.id !== id))
      if (activeImage?.id === id) {
        setActiveImage(null)
      }
      toast.success('Image deleted!')
    } catch (error) {
      console.error('Failed to delete image:', error)
      toast.error('Failed to delete image')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Image Uploader & OBS Overlay
        </h2>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isUploading ? 'Uploading...' : 'Upload your generated image'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop an image here, or click to select
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Select Image'}
            </button>
          </div>
        </div>

        {/* OBS Integration Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Monitor className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">OBS Integration</h3>
              <p className="text-sm text-blue-700 mt-1">
                Add a Browser Source in OBS with URL: 
                <span className="font-mono bg-white px-2 py-1 rounded ml-1">
                  {getBaseUrl()}/overlay
                </span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Recommended size: 1920x1080. Images will automatically appear when uploaded.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Image */}
      {activeImage && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="h-5 w-5 mr-2 text-green-600" />
            Currently Active Image
          </h3>
          <div className="flex items-start space-x-4">
            <img
              src={`${getBaseUrl()}${activeImage.url}`}
              alt={activeImage.original_name}
              className="w-32 h-32 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{activeImage.original_name}</p>
              <p className="text-sm text-gray-500">
                Uploaded {new Date(activeImage.created_at).toLocaleString()}
              </p>
              <p className="text-sm text-green-600 font-medium mt-1">
                ✓ Currently displayed on overlay
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Uploaded Images
        </h3>

        {images.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No images uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group border-2 rounded-lg overflow-hidden ${
                  image.is_active ? 'border-green-500' : 'border-gray-200'
                }`}
              >
                <img
                  src={`${getBaseUrl()}${image.url}`}
                  alt={image.original_name}
                  className="w-full h-32 object-cover"
                />
                
                {image.is_active && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Active
                  </div>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                    {!image.is_active && (
                      <button
                        onClick={() => activateImage(image.id)}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                        title="Activate Image"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteImage(image.id)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      title="Delete Image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-600 truncate">
                    {image.original_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
