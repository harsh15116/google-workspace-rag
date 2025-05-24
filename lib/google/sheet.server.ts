import { google } from "googleapis"
import { getGoogleAuthClient } from "./auth.server"

export interface GoogleSheet {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  sheets?: Array<{
    properties: {
      title: string
      gridProperties: {
        rowCount: number
        columnCount: number
      }
    }
  }>
  data?: any[][]
}

/**
 * List Google Sheets
 */
export async function listGoogleSheets(accessToken: string): Promise<GoogleSheet[]> {
  try {
    const auth = getGoogleAuthClient(accessToken)
    const drive = google.drive({ version: "v3", auth })

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: "files(id, name, mimeType, modifiedTime)",
      orderBy: "modifiedTime desc",
      pageSize: 50,
    })

    return (response.data.files as GoogleSheet[]) || []
  } catch (error) {
    console.error("Error listing Google Sheets:", error)
    return [] as GoogleSheet[];
  }
}

/**
 * Get Google Sheet data
 */
export async function getGoogleSheetData(accessToken: string, sheetId: string): Promise<any[][]> {
  try {
    const auth = getGoogleAuthClient(accessToken)
    const sheets = google.sheets({ version: "v4", auth })

    // First, get the sheet metadata to find all sheet names
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties",
    })

    const sheetTitles = metadataResponse.data.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter(Boolean) as string[]

    // For each sheet, get the data
    const allData: any[][] = []

    for (const sheetTitle of sheetTitles) {
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: sheetTitle,
      })

      if (dataResponse.data.values) {
        allData.push(...dataResponse.data.values)
      }
    }

    return allData
  } catch (error) {
    console.error("Error getting Google Sheet data:", error)
    throw error
  }
}

/**
 * Convert sheet data to text for embedding
 */
export function sheetDataToText(data: any[][]): string {
  if (!data || data.length === 0) return ""

  // Assume first row is headers
  const headers = data[0]
  const rows = data.slice(1)

  let text = ""

  // Process each row
  rows.forEach((row, rowIndex) => {
    text += `Row ${rowIndex + 1}: `

    // Create key-value pairs for each cell
    headers.forEach((header, colIndex) => {
      if (row[colIndex]) {
        text += `${header}: ${row[colIndex]}. `
      }
    })

    text += "\n"
  })

  return text
}
