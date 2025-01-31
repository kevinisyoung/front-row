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

const FULL_SIZE_PHOTO_COUNT = 4;

const getUserId = () => {
  let userId = localStorage.getItem('userId')
  if (!userId) {
    userId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('userId', userId)
  }
  return userId
}

export default function Gallery({ bandName }: { bandName: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [userVotes, setUserVotes] = useState<{[key: string]: boolean}>({})
  const [activeSection, setActiveSection] = useState<'top' | 'more'>('top')
  const supabase = useSupabase()
  const userId = getUserId()

  useEffect(() => {
    fetchTopPhotos()

    const handleScroll = () => {
      const morePhotosSection = document.getElementById('more-photos-section')
      if (morePhotosSection) {
        const rect = morePhotosSection.getBoundingClientRect()
        // Change to More Photos when the section is just entering the viewport
        if (rect.top <= 100) { // Adjusted threshold to 100px from viewport top
          setActiveSection('more')
        } else {
          setActiveSection('top')
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchTopPhotos = async () => {
    const { data: concertData, error: concertError } = await supabase
      .from("concerts")
      .select("id")
      .eq("band_name", bandName)
      .single();

    if (concertError) {
      console.error("Error fetching concert:", concertError);
      return;
    }

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
      .eq("concert_id", concertData.id)
      .returns<Photo[]>();

    if (error) {
      console.error("Error fetching top photos:", error);
      return;
    }

    if (data) {
      const sortedPhotos = data.sort((a, b) => {
        const aScore = a.votes ? a.votes.reduce((acc, vote) => acc + (vote.vote_type ? 1 : -1), 0) : 0;
        const bScore = b.votes ? b.votes.reduce((acc, vote) => acc + (vote.vote_type ? 1 : -1), 0) : 0;
        return bScore - aScore;
      });

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
    
    // If clicking the same vote type, do nothing
    if (existingVoteType === voteType) {
      return;
    }

    // Simply insert or update the vote
    const { error } = await supabase
      .from("votes")
      .insert({
        photo_id: photoId,
        vote_type: voteType,
        user_id: userId
      })

    if (!error) {
      setUserVotes(prev => ({
        ...prev,
        [photoId]: voteType
      }));
      fetchTopPhotos();
    }
  }

  const getVoteCount = (photo: Photo) => {
    if (!photo.votes) return 0;
    return photo.votes.reduce((acc, vote) => acc + (vote.vote_type ? 1 : -1), 0);
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sticky section - top on mobile, sidebar on desktop */}
      <div className="md:w-48 sticky top-0 md:top-20 bg-white/80 backdrop-blur-sm z-10 md:h-[calc(100vh-80px)] flex md:flex-col gap-4 md:gap-0 p-4 md:p-0">
        <motion.h2 
          className={`text-xl md:text-2xl font-bold transition-opacity duration-300 ${
            activeSection === 'top' ? 'opacity-100' : 'opacity-40'
          }`}
        >
          Top Photos
        </motion.h2>
        {photos.length > FULL_SIZE_PHOTO_COUNT && (
          <motion.h2 
            className={`text-xl md:text-2xl font-bold md:mt-4 transition-opacity duration-300 ${
              activeSection === 'more' ? 'opacity-100' : 'opacity-40'
            }`}
          >
            More Photos
          </motion.h2>
        )}
      </div>

      {/* Main content container - full width on mobile */}
      <div className="container mx-auto px-4 md:max-w-2xl pb-20">
        {/* Top photos in single column */}
        <div className="flex flex-col gap-8 mb-12 mt-4">
          {photos.slice(0, FULL_SIZE_PHOTO_COUNT).map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              layout
              layoutId={photo.id}
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
                <div className="relative flex-1 flex justify-center">
                  <img
                    src={photo.photo_url || "/placeholder.svg"}
                    alt="Concert photo"
                    className="w-auto h-auto max-w-full max-h-[60vh] rounded-lg object-contain"
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

        {/* Remaining photos in single column on mobile, two columns on desktop */}
        {photos.length > FULL_SIZE_PHOTO_COUNT && (
          <div 
            id="more-photos-section" 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 min-h-[100px]"
          >
            {photos.slice(FULL_SIZE_PHOTO_COUNT).map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                layout
                layoutId={photo.id}
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
                  <div className="relative flex-1 flex justify-center">
                    <img
                      src={photo.photo_url || "/placeholder.svg"}
                      alt="Concert photo"
                      className="w-auto h-auto max-w-full max-h-[60vh] rounded-lg object-contain"
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
        )}
      </div>
    </div>
  )
}