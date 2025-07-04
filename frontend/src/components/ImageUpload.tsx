import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  imagePreview: string
  isUploading: boolean
}

export default function ImageUpload({ onImageSelect, imagePreview, isUploading }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    onImageSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const clearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // You might want to call a callback to clear the image in the parent component
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          NFT Image *
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Upload an image for your NFT. Supported formats: JPG, PNG, GIF, SVG. Max size: 10MB.
        </p>
      </div>

      {!imagePreview ? (
        <div
          className={clsx(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer",
            isDragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!isUploading ? handleClick : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-sm text-gray-600">Processing image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your image here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                JPG, PNG, GIF, SVG up to 10MB
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={imagePreview}
              alt="NFT Preview"
              className="w-full h-full object-cover"
            />
            {!isUploading && (
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {!isUploading && (
            <button
              onClick={handleClick}
              className="mt-3 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Change Image
            </button>
          )}
        </div>
      )}

      {/* Image Requirements */}
      <div className="bg-gray-50 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Image Requirements</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Recommended size: 512x512px or larger</li>
          <li>• Square aspect ratio works best</li>
          <li>• High-quality images get better visibility</li>
          <li>• Make sure you own the rights to the image</li>
        </ul>
      </div>
    </div>
  )
}