"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "../supabase-provider"
import { motion } from "framer-motion"

interface Vote {
  vote_type: boolean;
}

interface Photo {
  id: string;
  photo_url: string;
  votes: Vote[];
  user_id: string;
}

export default function Gallery() {
  const [photos, setPhotos] = useState<any[]>([])
  const supabase = useSupabase()

  useEffect(() => {
    fetchTopPhotos()
  }, [])

  const fetchTopPhotos = async () => {
    const { data, error } = await supabase
      .from("photos")
      .select(`
        *,
        votes (
          vote_type
        )
      `)
      .returns<Photo[]>();

    if (error) {
      console.error("Error fetching top photos:", error)
      return
    }

    if (data) {
      // Sort photos by counting upvotes (true vote_type)
      const sortedPhotos = data.sort((a, b) => {
        const aUpvotes = a.votes ? a.votes.filter((v: any) => v.vote_type).length : 0;
        const bUpvotes = b.votes ? b.votes.filter((v: any) => v.vote_type).length : 0;
        return bUpvotes - aUpvotes;
      });
      setPhotos(sortedPhotos);
    }
  }

  return (
    <div className="container mx-auto px-4 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Top Photos</h2>
      <div className="flex flex-col gap-8">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative bg-white p-4 rounded-lg shadow-md"
          >
            <div className="relative">
              <img
                src={photo.photo_url || "/placeholder.svg"}
                alt="Concert photo"
                className="w-full h-auto max-w-2xl rounded-lg"
                style={{ maxHeight: '80vh' }}
              />
              {photo.user_id === localStorage.getItem('userId') && (
                <span className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm">
                  Yours
                </span>
              )}
            </div>
            <div className="absolute bottom-6 right-6 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
              {photo.votes.filter((v: any) => v.vote_type).length} upvotes
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

