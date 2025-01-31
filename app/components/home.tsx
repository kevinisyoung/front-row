"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import PhotoUpload from "./photo-upload"
import VotingComponent from "./voting-component"
import Gallery from "./gallery"
import Header from "@/components/header"
import Footer from "@/components/footer"
import CreateConcert from "./create-concert"
import { useSupabase } from "../supabase-provider"
import Link from "next/link"

interface Photo {
  id: string;
  photo_url: string;
}

export default function Home({ bandName = "hackathon" }) {
  const [concertInfo, setConcertInfo] = useState({ name: "", date: "" })
  const [currentView, setCurrentView] = useState("welcome")
  const [showCreateConcert, setShowCreateConcert] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [concertNotFound, setConcertNotFound] = useState(false)
  const supabase = useSupabase()

  useEffect(() => {
    const fetchConcertInfo = async () => {
      const { data: concertData, error: concertError } = await supabase
        .from("concerts")
        .select("*")
        .eq("band_name", bandName)
        .single()

      if (concertError) {
        console.error("Error fetching concert:", concertError)
        setConcertNotFound(true)
        return
      }

      if (concertData) {
        setConcertInfo({
          name: concertData.band_name,
          date: new Date(concertData.concert_date).toLocaleDateString(),
        })

        // Fetch photos for this concert
        const { data: photoData, error: photoError } = await supabase
          .from("photos")
          .select("*")
          .eq("concert_id", concertData.id)
          .limit(5)

        if (photoError) {
          console.error("Error fetching photos:", photoError)
          return
        }

        if (photoData) {
          setPhotos(photoData)
        }
      }
    }

    fetchConcertInfo()
  }, [bandName, supabase])

  // Rotate through photos
  useEffect(() => {
    if (photos.length > 0) {
      const interval = setInterval(() => {
        setCurrentPhotoIndex((current) => 
          current === photos.length - 1 ? 0 : current + 1
        )
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [photos])

  if (concertNotFound) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold mb-6">No Concert Found</h1>
            <p className="text-gray-600 mb-8">
              The concert you're looking for doesn't exist.
            </p>
            <Link 
              href="/"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-200 hover:transform hover:scale-105"
            >
              Go to Home
            </Link>
          </motion.div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center p-10 md:p-24">
        {currentView === "welcome" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl w-full"
          >
            <div className="mb-8">
              <p className="text-gray-600 text-lg mb-2">Welcome to the FrontRow photo album for:</p>
              <h1 className="text-4xl font-bold">
                {concertInfo.name}
                <span className="text-gray-500 text-2xl ml-2">
                  {concertInfo.date}
                </span>
              </h1>
            </div>
            
            {/* Photo Carousel - only show if there are photos */}
            {photos.length > 0 && (
              <div className="relative w-full h-96 mb-8 overflow-hidden rounded-lg shadow-xl">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={photos[currentPhotoIndex].id}
                    src={photos[currentPhotoIndex].photo_url}
                    alt="Concert photo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setCurrentView("upload")}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-200 hover:transform hover:scale-105"
              >
                Upload Your Photos
              </button>
              <button
                onClick={() => setCurrentView("gallery")}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-200 hover:transform hover:scale-105"
              >
                View Gallery
              </button>
              {bandName === "hackathon" && (
                <button
                  onClick={() => setShowCreateConcert(true)}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-200 hover:transform hover:scale-105"
                >
                  Create New Concert Album
                </button>
              )}
            </div>
          </motion.div>
        )}
        {currentView === "upload" && <PhotoUpload onComplete={() => setCurrentView("voting")} bandName={bandName} />}
        {currentView === "voting" && <VotingComponent onComplete={() => setCurrentView("gallery")} bandName={bandName} />}
        {currentView === "gallery" && <Gallery bandName={bandName} />}
        {showCreateConcert && <CreateConcert />}
      </main>
      <Footer />
    </>
  )
} 