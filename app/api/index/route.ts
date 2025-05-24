import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { listGoogleDocs, getGoogleDocContent } from "@/lib/google/docs.server"
import { listGoogleSheets, getGoogleSheetData, sheetDataToText } from "@/lib/google/sheet.server"
import { listGoogleCalendarEvents, calendarEventsToText } from "@/lib/google/calendar.server"
import { indexDocumentInVespa } from "@/lib/vespa/indexing"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { documentType, documentId } = await req.json()

    if (!documentType || !documentId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    let indexResult

    switch (documentType) {
      case "doc":
        // Get document content
        const doc = await getGoogleDocContent(session.accessToken, documentId)

        // Get document metadata
        const docs = await listGoogleDocs(session.accessToken)
        const docMetadata = docs.find((d) => d.id === documentId)

        if (!docMetadata) {
          return NextResponse.json({ error: "Document not found" }, { status: 404 })
        }

        // Index in Vespa
        indexResult = await indexDocumentInVespa({
          id: documentId,
          title: docMetadata.name,
          content: doc,
          type: "doc",
          lastModified: docMetadata.modifiedTime,
          metadata: {
            mimeType: docMetadata.mimeType,
          },
        })
        break

      case "sheet":
        // Get sheet data
        const sheetData = await getGoogleSheetData(session.accessToken, documentId)

        // Get sheet metadata
        const sheets = await listGoogleSheets(session.accessToken)
        const sheetMetadata = sheets.find((s) => s.id === documentId)

        if (!sheetMetadata) {
          return NextResponse.json({ error: "Sheet not found" }, { status: 404 })
        }

        // Convert to text
        const sheetContent = sheetDataToText(sheetData)

        // Index in Vespa
        indexResult = await indexDocumentInVespa({
          id: documentId,
          title: sheetMetadata.name,
          content: sheetContent,
          type: "sheet",
          lastModified: sheetMetadata.modifiedTime,
          metadata: {
            mimeType: sheetMetadata.mimeType,
            rowCount: sheetData.length,
          },
        })
        break

      case "calendar":
        // Get calendar events
        const events = await listGoogleCalendarEvents(session.accessToken, documentId)

        // Convert to text
        const calendarContent = calendarEventsToText(events)

        // Index in Vespa
        indexResult = await indexDocumentInVespa({
          id: documentId,
          title: "My Calendar",
          content: calendarContent,
          type: "calendar",
          lastModified: new Date().toISOString(),
          metadata: {
            eventCount: events.length,
            timeRange: "Next 90 days",
          },
        })
        break

      default:
        return NextResponse.json({ error: "Invalid document type" }, { status: 400 })
    }

    return NextResponse.json({ success: true, result: indexResult })
  } catch (error) {
    console.error("Error indexing document:", error)
    return NextResponse.json({ error: "Failed to index document" }, { status: 500 })
  }
}
