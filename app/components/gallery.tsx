"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "../supabase-provider"
import { motion } from "framer-motion"
import { ArrowUp, ArrowDown } from "lucide-react"

interface Vote {
  id: string;
  photo_id: string;
  vote_type: boolean;
  user_id: string;
}

interface Photo {
  id: string;
  photo_url: string;
  votes: Vote[];
  user_id: string;
}

const getUserId = () => {
  let userId = localStorage.getItem('userId')
  if (!userId) {
    userId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('userId', userId)
  }
  return userId
}

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [userVotes, setUserVotes] = useState<{[key: string]: boolean}>({})
  const supabase = useSupabase()
  const userId = getUserId()

  useEffect(() => {
    fetchTopPhotos()
  }, [])

  const fetchTopPhotos = async () => {
    const { data, error } = await supabase
      .from("photos")
      .select(`
        *,
        votes (
          id,
          vote_type,
          user_id
        )
      `)
      .returns<Photo[]>();

    if (error) {
      console.error("Error fetching top photos:", error)
      return
    }

    if (data) {
      // Sort photos by net votes (upvotes - downvotes)
      const sortedPhotos = data.sort((a, b) => {
        const aScore = a.votes ? a.votes.reduce((acc, vote) => acc + (vote.vote_type ? 1 : -1), 0) : 0;
        const bScore = b.votes ? b.votes.reduce((acc, vote) => acc + (vote.vote_type ? 1 : -1), 0) : 0;
        return bScore - aScore;
      });

      // Track user's votes
      const userVoteMap: {[key: string]: boolean} = {};
      data.forEach(photo => {
        const userVote = photo.votes?.find(vote => vote.user_id === userId);
        if (userVote) {
          userVoteMap[photo.id] = userVote.vote_type;
        }
      });

      setPhotos(sortedPhotos);
      setUserVotes(userVoteMap);
    }
  }

  const handleVote = async (photoId: string, voteType: boolean) => {
    const existingVoteType = userVotes[photoId];
    
    if (existingVoteType === voteType) {
      // Remove vote if clicking the same button
      const { error } = await supabase
        .from("votes")
        .delete()
        .match({ photo_id: photoId, user_id: userId });

      if (!error) {
        const newUserVotes = { ...userVotes };
        delete newUserVotes[photoId];
        setUserVotes(newUserVotes);
      }
    } else {
      // First delete any existing vote
      await supabase
        .from("votes")
        .delete()
        .match({ photo_id: photoId, user_id: userId });

      // Then insert the new vote
      const { error } = await supabase
        .from("votes")
        .insert({
          photo_id: photoId,
          vote_type: voteType,
          user_id: userId
        });

      if (!error) {
        setUserVotes(prev => ({
          ...prev,
          [photoId]: voteType
        }));
      }
    }

    fetchTopPhotos(); // Refresh the photos to update vote counts
  }

  const getVoteCount = (photo: Photo) => {
    if (!photo.votes) return 0;
    return photo.votes.reduce((acc, vote) => acc + (vote.vote_type ? 1 : -1), 0);
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
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVote(photo.id, true)}
                  className={`p-2 rounded-full transition-colors ${
                    userVotes[photo.id] === true 
                      ? "bg-green-500 text-white" 
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <ArrowUp className="w-6 h-6" />
                </motion.button>
                <span className="font-bold text-lg">{getVoteCount(photo)}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVote(photo.id, false)}
                  className={`p-2 rounded-full transition-colors ${
                    userVotes[photo.id] === false 
                      ? "bg-red-500 text-white" 
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <ArrowDown className="w-6 h-6" />
                </motion.button>
              </div>
              <div className="relative flex-1">
                <img
                  src={photo.photo_url || "/placeholder.svg"}
                  alt="Concert photo"
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: '80vh' }}
                />
                {photo.user_id === userId && (
                  <span className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm">
                    Yours
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

