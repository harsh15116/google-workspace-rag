"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { FileText, Table, Calendar, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { indexDocumentInVespa } from "@/lib/vespa/indexing"
import { formatDate } from "@/lib/utils"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [isIndexing, setIsIndexing] = useState(false)
  const [indexProgress, setIndexProgress] = useState(0)
  const [indexingStatus, setIndexingStatus] = useState("")

  const [googleDocs, setGoogleDocs] = useState<any[]>([])
  const [googleSheets, setGoogleSheets] = useState<any[]>([])
  const [googleCalendars, setGoogleCalendars] = useState<any[]>([])

  const [indexedDocs, setIndexedDocs] = useState<any[]>([])
  const [indexedSheets, setIndexedSheets] = useState<any[]>([])
  const [indexedCalendars, setIndexedCalendars] = useState<any[]>([])

  const [error, setError] = useState<string | null>(null)



  useEffect(() => {
    const storedDocs = localStorage.getItem("indexedDocs")
    const storedSheets = localStorage.getItem("indexedSheets")
    const storedCalendars = localStorage.getItem("indexedCalendars")

    if (storedDocs) setIndexedDocs(JSON.parse(storedDocs))
    if (storedSheets) setIndexedSheets(JSON.parse(storedSheets))
    if (storedCalendars) setIndexedCalendars(JSON.parse(storedCalendars))
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }

    if (status === "authenticated" && session.accessToken) {
      fetchGoogleContent()
    }
  }, [status, session, router])

  const fetchGoogleContent = async () => {
    if (!session?.accessToken) return;

    try {
      setError(null)
      async function fetchDocs() {
        const res = await fetch('/api/google/docs', {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        })
        const data = await res.json()
        setGoogleDocs(data)
      }

      fetchDocs()
      async function fetchSheets() {
        const res = await fetch('/api/google/sheets', {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        })
        const data = await res.json()
        setGoogleSheets(data)
      }

      fetchSheets()

      async function fetchCalendar() {
        const res = await fetch('/api/google/calendar', {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        })
        const events = await res.json()
        setGoogleCalendars([
          {
            id: "primary",
            title: "My Calendar",
            events: events.length,
            timeRange: "Next 90 days",
          },
        ])
      }

      fetchCalendar()
    } catch (error) {
      console.error("Error fetching Google content:", error)
      setError("Failed to fetch content from Google Workspace. Please try again.")
    }
  }

  const handleStartIndexing = async () => {
    if (!session?.accessToken) return

    setIsIndexing(true)
    setIndexProgress(0)
    setIndexingStatus("Starting indexing process...")

    try {
      // Index Google Docs
      const docsToIndex = googleDocs.filter((doc) => !indexedDocs.some((indexed) => indexed.id === doc.id))

      const totalItems =
        docsToIndex.length +
        (googleSheets.length - indexedSheets.length) +
        (googleCalendars.length - indexedCalendars.length)

      let processedItems = 0

      // Process Google Docs
      for (const doc of docsToIndex) {
        setIndexingStatus(`Processing document: ${doc.name}`)
        const res = await fetch(`/api/google/docs/content?id=${doc.id}`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        })
        const data = await res.json()
        const content = data.content;

        // Index in Vespa
        await indexDocumentInVespa({
          id: doc.id,
          title: doc.name,
          content,
          type: "doc",
          lastModified: doc.modifiedTime,
          metadata: {
            mimeType: doc.mimeType,
          },
        })

        processedItems++
        setIndexProgress(Math.round((processedItems / totalItems) * 100))
      }

      // // Process Google Sheets
      const sheetsToIndex = googleSheets.filter((sheet) => !indexedSheets.some((indexed) => indexed.id === sheet.id))

      for (const sheet of sheetsToIndex) {
        setIndexingStatus(`Processing spreadsheet: ${sheet.name}`)
        const res = await fetch(`/api/google/sheets/content?id=${sheet.id}`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        })
        const data = await res.json()
        const content = data.content;
        console.log("sheet_content ", content);

        // Index in Vespa
        await indexDocumentInVespa({
          id: sheet.id,
          title: sheet.name,
          content,
          type: "sheet",
          lastModified: sheet.modifiedTime,
          metadata: {
            mimeType: sheet.mimeType,
            rowCount: data.length,
          },
        })

        processedItems++
        setIndexProgress(Math.round((processedItems / totalItems) * 100))
      }

      // // Process Google Calendar
      const calendarsToIndex = googleCalendars.filter(
        (cal) => !indexedCalendars.some((indexed) => indexed.id === cal.id),
      )

      for (const calendar of calendarsToIndex) {
        setIndexingStatus(`Processing calendar: ${calendar.title}`)

        // Get calendar events
        // const events = await listGoogleCalendarEvents(session.accessToken, calendar.id)

        // Convert to text
        const res = await fetch(`/api/google/calendar/content?id=${calendar.id}`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        })
        const data = await res.json()
        const content = data.content;
        console.log("calendar content", content);

        // Index in Vespa
        await indexDocumentInVespa({
          id: calendar.id,
          title: calendar.title,
          content,
          type: "calendar",
          lastModified: new Date().toISOString(),
          metadata: {
            // eventCount: events.length,
            timeRange: "Next 90 days",
          },
        })

        processedItems++
        setIndexProgress(Math.round((processedItems / totalItems) * 100))
      }

      // Update indexed content
      // Update indexed content
      setIndexedDocs(googleDocs)
      setIndexedSheets(googleSheets)
      setIndexedCalendars(googleCalendars)

      // Save to localStorage
      localStorage.setItem("indexedDocs", JSON.stringify(googleDocs))
      localStorage.setItem("indexedSheets", JSON.stringify(googleSheets))
      localStorage.setItem("indexedCalendars", JSON.stringify(googleCalendars))


      setIndexingStatus("Indexing complete!")
      setIndexProgress(100)
    } catch (error) {
      console.error("Error during indexing:", error)
      setError("Failed to index content. Please try again.")
    } finally {
      setTimeout(() => {
        setIsIndexing(false)
      }, 2000)
    }
  }

  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p>Loading your content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your Google Workspace content</p>
        </div>
        <Button
          onClick={handleStartIndexing}
          disabled={isIndexing || googleDocs.length === 0}
          className="flex items-center gap-2"
        >
          {isIndexing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isIndexing ? "Indexing..." : "Refresh & Index Content"}
        </Button>
      </div>

      {error && (
        <Card className="mb-8 border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {isIndexing && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{indexingStatus}</p>
                <p className="text-sm text-gray-500">{indexProgress}%</p>
              </div>
              <Progress value={indexProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="docs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="sheets" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Spreadsheets
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="space-y-4">
          {googleDocs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center py-10 text-center">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-gray-500 max-w-md">
                  We couldn't find any Google Docs in your account. Create some documents or check your permissions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {googleDocs.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">{doc.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      {indexedDocs.some((indexed) => indexed.id === doc.id) ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Indexed
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                          Not indexed
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">Google Document</p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex justify-between items-center w-full text-xs text-gray-500">
                      <span>Last modified: {formatDate(doc.modifiedTime)}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sheets" className="space-y-4">
          {googleSheets.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center py-10 text-center">
                <Table className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No spreadsheets found</h3>
                <p className="text-gray-500 max-w-md">
                  We couldn't find any Google Sheets in your account. Create some spreadsheets or check your
                  permissions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {googleSheets.map((sheet) => (
                <Card key={sheet.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">{sheet.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      {indexedSheets.some((indexed) => indexed.id === sheet.id) ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Indexed
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                          Not indexed
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">Google Spreadsheet</p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex justify-between items-center w-full text-xs text-gray-500">
                      <span>Last modified: {formatDate(sheet.modifiedTime)}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          {googleCalendars.length === 0 ? (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No calendar data found</h3>
                <p className="text-gray-500 max-w-md">
                  We couldn't find any calendar data in your account. Add some events or check your permissions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {googleCalendars.map((calendar) => (
                <Card key={calendar.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">{calendar.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      {indexedCalendars.some((indexed) => indexed.id === calendar.id) ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Indexed
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                          Not indexed
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{calendar.events} events</p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex justify-between items-center w-full text-xs text-gray-500">
                      <span>Time range: {calendar.timeRange}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
