"use client"

import * as React from "react"
import Link from "next/link"

const Header = () => {
  return (
    <header className="sticky top-0 left-0 z-50 p-4 bg-white md:bg-transparent">
      <Link href="/" className="flex items-center space-x-2">
        <span className="font-bold text-4xl hover:opacity-80 transition-opacity">
          FrontRow
        </span>
      </Link>
    </header>
  )
}

export default Header 