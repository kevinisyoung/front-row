import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { photo_id, vote_type } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data, error } = await supabase.from("votes").insert({ photo_id, vote_type }).select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

