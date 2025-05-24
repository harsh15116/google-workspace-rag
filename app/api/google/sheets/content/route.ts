// /app/api/google/docs/content/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getGoogleSheetData, sheetDataToText } from "@/lib/google/sheet.server"

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  const authHeader = req.headers.get("authorization")
  const accessToken = authHeader?.replace("Bearer ", "")

  if (!id || !accessToken) {
    return NextResponse.json({ error: "Missing ID or token" }, { status: 400 })
  }

  try {
    const content = await getGoogleSheetData(accessToken, id)
    const processedContent = sheetDataToText(content);
    return NextResponse.json({ content:processedContent })
  } catch (error) {
    console.error("Failed to get Google Doc content", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}
