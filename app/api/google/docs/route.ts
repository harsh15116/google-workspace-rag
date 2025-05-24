// app/api/google/docs/route.ts
import { getGoogleAuthClient } from "@/lib/google/auth.server"
import { listGoogleDocs } from "@/lib/google/docs.server"
import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!accessToken) return NextResponse.json({ error: "Missing access token" }, { status: 401 })

  try {
    const docs = await listGoogleDocs(accessToken);
    return NextResponse.json(docs || [])
  } catch (error) {
    console.log("Error listing Google Docs:", error)
    return NextResponse.json({ error: "Failed to fetch docs" }, { status: 500 })
  }
}
