import { google } from "googleapis"
import { getGoogleAuthClient } from "./auth.server"

export interface GoogleDoc {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  content?: string
}

/**
 * List Google Docs
 */
export async function listGoogleDocs(accessToken: string): Promise<GoogleDoc[]> {
  try {
    const auth = getGoogleAuthClient(accessToken)
    const drive = google.drive({ version: "v3", auth })

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document'",
      fields: "files(id, name, mimeType, modifiedTime)",
      orderBy: "modifiedTime desc",
      pageSize: 50,
    })
    return (response.data.files as GoogleDoc[]) || []
  } catch (error) {
    console.error("Error listing Google Docs:", error)
    return [] as GoogleDoc[];
  }
}

/**
 * Get Google Doc content
 */
export async function getGoogleDocContent(accessToken: string, docId: string): Promise<string> {
  try {
    const auth = getGoogleAuthClient(accessToken)
    const docs = google.docs({ version: "v1", auth })

    const response = await docs.documents.get({
      documentId: docId,
    })

    const document = response.data

    // Extract text content from the document
    let content = ""

    if (document.body && document.body.content) {
      document.body.content.forEach((element) => {
        if (element.paragraph) {
          if (element.paragraph.elements) {
            element.paragraph.elements.forEach((paraElement) => {
              if (paraElement.textRun && paraElement.textRun.content) {
                content += paraElement.textRun.content
              }
            })
          }
        }
      })
    }

    return content
  } catch (error) {
    console.error("Error getting Google Doc content:", error)
    return "";
  }
}
