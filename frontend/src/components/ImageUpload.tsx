import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  onImageClear?: () => void
  imagePreview: string
  isUploading: boolean
}

interface ValidationError {
  type: 'size' | 'format' | 'dimensions' | 'corrupted' | 'network'
  message: string
}

export default function ImageUpload({ onImageSelect, onImageClear, imagePreview, isUploading }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<ValidationError | null>(null)
  const [validationSuccess, setValidationSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const changeImageInputRef = useRef<HTMLInputElement>(null)

  const validateImage = async (file: File): Promise<ValidationError | null> => {
    // Clear previous validation state
    setError(null)
    setValidationSuccess(false)

    // Check file type
    if (!file.type.startsWith('image/')) {
      return {
        type: 'format',
        message: `Unsupported file format: ${file.type || 'unknown'}. Please upload an image file (JPG, PNG, GIF, WebP, SVG).`
      }
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      return {
        type: 'size',
        message: `File too large: ${fileSizeMB}MB. Maximum allowed size is 10MB. Please compress your image or choose a smaller file.`
      }
    }

    // Check minimum file size (prevent 0 byte files)
    if (file.size < 100) {
      return {
        type: 'corrupted',
        message: 'File appears to be corrupted or empty. Please try uploading a different image.'
      }
    }

    // Validate image dimensions and format by loading it
    try {
      await validateImageDimensions(file)
    } catch (error) {
      return {
        type: 'corrupted',
        message: 'Unable to process image. The file may be corrupted or in an unsupported format.'
      }
    }

    return null // No errors
  }

  const validateImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        // Check minimum dimensions
        if (img.width < 100 || img.height < 100) {
          reject(new Error(`Image too small: ${img.width}x${img.height}px. Minimum recommended size is 100x100px.`))
          return
        }

        // Warn about very large dimensions
        if (img.width > 4096 || img.height > 4096) {
          console.warn(`Large image detected: ${img.width}x${img.height}px. Will be optimized by backend.`)
        }

        resolve({ width: img.width, height: img.height })
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }
      
      img.src = url
    })
  }

  const handleFileSelect = async (file: File) => {
    try {
      const validationError = await validateImage(file)
      
      if (validationError) {
        setError(validationError)
        setValidationSuccess(false)
        return
      }

      // File is valid
      setError(null)
      setValidationSuccess(true)
      
      // Clear success message after 2 seconds
      setTimeout(() => setValidationSuccess(false), 2000)
      
      onImageSelect(file)
    } catch (error) {
      console.error('Image validation error:', error)
      setError({
        type: 'network',
        message: 'Unable to validate image. Please check your connection and try again.'
      })
      setValidationSuccess(false)
    }
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
    // Clear any previous validation states when opening file picker
    setError(null)
    setValidationSuccess(false)
    
    // Use the change image input ref when we have an existing image
    const inputRef = imagePreview ? changeImageInputRef : fileInputRef
    
    if (inputRef.current) {
      try {
        inputRef.current.focus()
        inputRef.current.click()
      } catch (error) {
        console.error('Error clicking file input:', error)
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
    // Clear the input value to allow selecting the same file again
    if (e.target) {
      e.target.value = ''
    }
  }

  const clearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setError(null)
    setValidationSuccess(false)
    // Call parent callback to clear image preview and file
    if (onImageClear) {
      onImageClear()
    }
  }

  const dismissError = () => {
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          NFT Image *
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Upload an image for your NFT. Supported formats: JPG, PNG, GIF, WebP, SVG. Max size: 10MB.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md animate-slide-up">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {error.type === 'size' && 'File Too Large'}
                {error.type === 'format' && 'Unsupported Format'}
                {error.type === 'dimensions' && 'Invalid Dimensions'}
                {error.type === 'corrupted' && 'Corrupted File'}
                {error.type === 'network' && 'Validation Error'}
              </h3>
              <p className="mt-1 text-sm text-red-700">{error.message}</p>
              
              {/* Helpful suggestions based on error type */}
              {error.type === 'size' && (
                <div className="mt-2 text-xs text-red-600">
                  <p><strong>Solutions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Use an image compression tool online</li>
                    <li>Reduce image dimensions</li>
                    <li>Convert to JPEG format for smaller file size</li>
                  </ul>
                </div>
              )}
              
              {error.type === 'format' && (
                <div className="mt-2 text-xs text-red-600">
                  <p><strong>Supported formats:</strong> JPEG, PNG, GIF, WebP, SVG</p>
                </div>
              )}
            </div>
            <button
              onClick={dismissError}
              className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
              title="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Display */}
      {validationSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md animate-slide-up">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm text-green-700 font-medium">
              Image validated successfully! ✨
            </p>
          </div>
        </div>
      )}

      {!imagePreview ? (
        <div
          className={clsx(
            "relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors duration-200 cursor-pointer",
            isDragOver
              ? "border-blue-400 bg-blue-50"
              : error
              ? "border-red-300 bg-red-50"
              : validationSuccess
              ? "border-green-400 bg-green-50"
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
            multiple={false}
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-sm text-gray-600">Processing image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
              <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Drop your image here, or click to browse
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                JPG, PNG, GIF, SVG up to 10MB
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100">
            <img
              src={imagePreview}
              alt="NFT Preview"
              className="w-full h-full object-cover"
            />
            {!isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearImage()
                }}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl z-10"
                title="Remove image"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {!isUploading && (
            <>
              {/* Separate file input for changing image */}
              <input
                ref={changeImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                disabled={isUploading}
                multiple={false}
                id="change-image-input"
              />
              
              <label
                htmlFor="change-image-input"
                className="mt-3 w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm cursor-pointer inline-block text-center"
              >
                📷 Change Image
              </label>
            </>
          )}
        </div>
      )}

      {/* Image Requirements */}
      <div className="bg-gray-50 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Image Requirements</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Formats:</strong> JPEG, PNG, GIF, WebP, SVG</li>
          <li>• <strong>Size:</strong> Maximum 10MB, minimum 100x100px</li>
          <li>• <strong>Recommended:</strong> 512x512px or larger, square aspect ratio</li>
          <li>• <strong>Quality:</strong> High-resolution images get better visibility</li>
          <li>• <strong>Rights:</strong> Ensure you own or have permission to use the image</li>
          <li>• <strong>Processing:</strong> Images will be optimized and converted to JPEG for IPFS storage</li>
        </ul>
      </div>
    </div>
  )
}