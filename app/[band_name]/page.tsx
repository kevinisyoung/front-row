"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import Home from "../components/home"

export default function BandPage() {
  const params = useParams()
  const bandName = params.band_name as string

  return <Home bandName={bandName} />
} 