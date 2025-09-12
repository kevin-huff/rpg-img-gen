import React, { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Upload } from 'lucide-react'

import { imagesAPI } from '../services/api'

export default function ImageDropzone() {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (files) => {
    const file = files?.[0]
    if (file) uploadImage(file)
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
      await imagesAPI.upload(formData)
      toast.success('Image uploaded and activated!')
    } catch (error) {
      console.error('Failed to upload image:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
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
    handleFileSelect(files)
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Upload</h3>
      <div
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <Upload className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-2 text-sm text-gray-700">
          {isUploading ? 'Uploading...' : 'Drop image here or click to select'}
        </p>
        <p className="text-xs text-gray-500">Automatically sets overlay active</p>
      </div>
    </div>
  )
}
