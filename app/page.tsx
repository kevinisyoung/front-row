"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import PhotoUpload from "./components/photo-upload"
import VotingComponent from "./components/voting-component"
import Gallery from "./components/gallery"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function Home() {
  const [concertInfo, setConcertInfo] = useState({ name: "", date: "" })
  const [currentView, setCurrentView] = useState("welcome")

  useEffect(() => {
    // In a real scenario, you'd fetch this from an API or Supabase
    setConcertInfo({ name: "Amazing Band Live", date: "June 15, 2023" })
  }, [])

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        {currentView === "welcome" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold mb-4">Welcome to FrontRow</h1>
            <p className="text-xl mb-8">
              {concertInfo.name} - {concertInfo.date}
            </p>
            <button
              onClick={() => setCurrentView("upload")}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Upload Your Photos
            </button>
          </motion.div>
        )}
        {currentView === "upload" && <PhotoUpload onComplete={() => setCurrentView("voting")} />}
        {currentView === "voting" && <VotingComponent onComplete={() => setCurrentView("gallery")} />}
        {currentView === "gallery" && <Gallery />}
      </main>
      <Footer />
    </>
  )
}

