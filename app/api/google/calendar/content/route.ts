// /app/api/google/docs/content/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getGoogleDocContent } from "@/lib/google/docs.server"
import { calendarEventsToText, listGoogleCalendarEvents } from "@/lib/google/calendar.server"

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  const authHeader = req.headers.get("authorization")
  const accessToken = authHeader?.replace("Bearer ", "")

  if (!id || !accessToken) {
    return NextResponse.json({ error: "Missing ID or token" }, { status: 400 })
  }

  try {
    const content = await listGoogleCalendarEvents(accessToken, id)
    const processedData = calendarEventsToText(content)
    console.log('cla',content,processedData)
    return NextResponse.json({ content:processedData })
  } catch (error) {
    console.error("Failed to get Google Doc content", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}
