import { google } from "googleapis"
import { getGoogleAuthClient } from "./auth.server"

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
}

/**
 * List Google Calendar events
 */
export async function listGoogleCalendarEvents(
  accessToken: string,
  calendarId = "primary",
  timeMin: string = new Date().toISOString(),
  timeMax: string = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
): Promise<GoogleCalendarEvent[]> {
  try {
    const auth = getGoogleAuthClient(accessToken)
    const calendar = google.calendar({ version: "v3", auth })
    console.log("id",calendarId)
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    })
    console.log("response ",response);

    return (response.data.items as GoogleCalendarEvent[]) || []
  } catch (error) {
    console.error("Error listing Google Calendar events:", error)
    throw error
  }
}

/**
 * Get all calendars for the user
 */
export async function listGoogleCalendars(accessToken: string) {
  try {
    const auth = getGoogleAuthClient(accessToken)
    const calendar = google.calendar({ version: "v3", auth })

    const response = await calendar.calendarList.list()

    return response.data.items || []
  } catch (error) {
    console.error("Error listing Google Calendars:", error)
    return [];
  }
}

/**
 * Convert calendar events to text for embedding
 */
export function calendarEventsToText(events: GoogleCalendarEvent[]): string {
  if (!events || events.length === 0) return ""

  let text = ""

  events.forEach((event) => {
    text += `Event: ${event.summary}\n`

    if (event.description) {
      text += `Description: ${event.description}\n`
    }

    const startDate = new Date(event.start.dateTime)
    const endDate = new Date(event.end.dateTime)

    text += `Date: ${startDate.toLocaleDateString()}\n`
    text += `Time: ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}\n`

    if (event.attendees && event.attendees.length > 0) {
      text += "Attendees: "
      event.attendees.forEach((attendee, index) => {
        text += `${attendee.displayName || attendee.email}${index < event.attendees!.length - 1 ? ", " : ""}`
      })
      text += "\n"
    }

    text += "\n"
  })

  return text
}
