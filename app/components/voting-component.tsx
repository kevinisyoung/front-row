"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "../supabase-provider"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUp, ArrowDown } from "lucide-react"

const INITIAL_VOTING_PHOTOS = 4 // You can change this const as needed

export default function VotingComponent({ onComplete }: { onComplete: () => void }) {
  const [photos, setPhotos] = useState<any[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [selectedVote, setSelectedVote] = useState<boolean | null>(null)
  const supabase = useSupabase()

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(INITIAL_VOTING_PHOTOS)

    if (data) {
      setPhotos(data)
    }
    if (error) {
      console.error("Error fetching photos:", error)
    }
  }

  const handleVote = async (photoId: number, voteType: boolean) => {
    setSelectedVote(voteType)
    
    const { error } = await supabase
      .from("votes")
      .insert({ photo_id: photoId, vote_type: voteType })

    if (error) {
      console.error("Error submitting vote:", error)
    }

    // Add a small delay to show the selected vote state
    setTimeout(() => {
      if (currentPhotoIndex < photos.length - 1) {
        setCurrentPhotoIndex(currentPhotoIndex + 1)
        setSelectedVote(null)
      } else {
        onComplete()
      }
    }, 500)
  }

  if (photos.length === 0) {
    return <div>Loading...</div>
  }

  const currentPhoto = photos[currentPhotoIndex]

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Vote on Photos</h2>
      <div className="flex items-center gap-8">
        <div className="flex flex-col gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote(currentPhoto.id, true)}
            className={`p-4 rounded-full transition-colors ${
              selectedVote === true 
                ? "bg-green-500 text-white" 
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <ArrowUp className="w-8 h-8" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote(currentPhoto.id, false)}
            className={`p-4 rounded-full transition-colors ${
              selectedVote === false 
                ? "bg-red-500 text-white" 
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <ArrowDown className="w-8 h-8" />
          </motion.button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhoto.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3 }}
            className="relative w-96 h-96"
          >
            <img
              src={currentPhoto.photo_url || "/placeholder.svg"}
              alt="Concert photo"
              className="w-full h-full object-cover rounded-lg"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

