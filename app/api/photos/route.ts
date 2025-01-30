import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { photo_url } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data, error } = await supabase.from("photos").insert({ photo_url }).select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  const { data, error } = await supabase.from("photos").select("*").order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

