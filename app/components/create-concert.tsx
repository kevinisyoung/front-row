"use client"

import { useState } from "react"
import { useSupabase } from "../supabase-provider"
import { useRouter } from "next/navigation"

export default function CreateConcert() {
  const [bandName, setBandName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = useSupabase()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("concerts")
        .insert({ band_name: bandName })
        .select()

      if (error) throw error

      if (data && data[0]) {
        router.push(`/${bandName}`)
      }
    } catch (error) {
      console.error("Error creating concert:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Create New Concert Album</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={bandName}
            onChange={(e) => setBandName(e.target.value)}
            placeholder="Enter band name"
            className="border p-2 rounded"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Concert"}
          </button>
        </form>
      </div>
    </div>
  )
} 