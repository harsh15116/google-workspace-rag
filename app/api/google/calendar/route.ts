// app/api/google/docs/route.ts
import { listGoogleCalendarEvents } from "@/lib/google/calendar.server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!accessToken) return NextResponse.json({ error: "Missing access token" }, { status: 401 })

  try {
    const calendarEvents = await listGoogleCalendarEvents(accessToken);
    return NextResponse.json(calendarEvents || [])
  } catch (error) {
    console.error("Error listing Google Docs:", error)
    return NextResponse.json({ error: "Failed to fetch docs" }, { status: 500 })
  }
}
