"use client"

import { useState } from "react"
import { useSupabase } from "../supabase-provider"
import { motion } from "framer-motion"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { toast } from "sonner"
import { Image } from "lucide-react"

// Toggle between secure and presigned upload
const USE_PRESIGNED = false

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

// Only used for direct upload
const s3Client = USE_PRESIGNED ? null : new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY!
  }
})

const getUserId = () => {
  let userId = localStorage.getItem('userId')
  if (!userId) {
    userId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('userId', userId)
  }
  return userId
}

export default function PhotoUpload({ onComplete }: { onComplete: () => void }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const supabase = useSupabase()

  const validateFiles = (files: FileList) => {
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    Array.from(files).forEach(file => {
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        validFiles.push(file)
      } else {
        invalidFiles.push(file.name)
      }
    })

    if (invalidFiles.length > 0) {
      toast.error(`Invalid file type(s): ${invalidFiles.join(', ')}`, {
        description: "Please upload only JPEG, PNG, GIF, WebP, or SVG images"
      })
    }

    return validFiles
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = validateFiles(e.target.files)
      setSelectedFiles(validFiles)
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    
    try {
      const response = await fetch('/api/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: selectedFiles.map(file => ({
            name: `${Date.now()}-${file.name}`,
            contentType: file.type
          }))
        })
      })

      const { presignedUrls } = await response.json()

      await Promise.all(
        selectedFiles.map(async (file, index) => {
          const url = presignedUrls[index]
          await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
          })

          const photoUrl = `${process.env.NEXT_PUBLIC_PHOTOS_BASE_URL}/${url.split('/').slice(-2).join('/')}`
          await supabase.from("photos").insert({ photo_url: photoUrl, user_id: getUserId() })
        })
      )

      toast.success("Photos uploaded successfully!")
      onComplete()
    } catch (error) {
      console.error("Error in upload process:", error)
      toast.error("Failed to upload photos", {
        description: "Please try again later"
      })
    }

    setUploading(false)
    setSelectedFiles([])
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Upload Photos</h2>
        <button
          onClick={onComplete}
          className="text-sm text-blue-500 hover:text-blue-700 transition-colors"
        >
          Skip →
        </button>
      </div>

      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <input 
            type="file" 
            onChange={handleFileChange} 
            multiple 
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label 
            htmlFor="file-upload"
            className="cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <div className="mb-2">
              <span className="block text-sm text-muted-foreground mb-1">
                Drag and drop your photos or click to browse
              </span>
              <span className="text-xs text-muted-foreground">
                Supported formats: JPEG, PNG, GIF, WebP, SVG
              </span>
            </div>
          </label>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Selected Files:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">↻</span> 
              Uploading...
            </span>
          ) : (
            "Upload Photos"
          )}
        </button>
      </div>
    </motion.div>
  )
}

