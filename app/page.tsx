import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Search, MessageSquare, Calendar, FileText, Table } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container px-4  md:px-[10%]">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  AI-Powered Search for Your Google Workspace
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Connect your Google Workspace, search across all your content, and chat with your data using advanced
                  RAG technology.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/dashboard">
                    <Button className="px-8">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/chat">
                    <Button variant="outline">Chat</Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto lg:ml-auto flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm dark:bg-gray-950">
                    <FileText className="h-10 w-10 mb-2 text-blue-500" />
                    <h3 className="text-lg font-medium">Google Docs</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                      Search through all your documents
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm dark:bg-gray-950">
                    <Table className="h-10 w-10 mb-2 text-green-500" />
                    <h3 className="text-lg font-medium">Google Sheets</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">Query your spreadsheet data</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm dark:bg-gray-950">
                    <Calendar className="h-10 w-10 mb-2 text-purple-500" />
                    <h3 className="text-lg font-medium">Google Calendar</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                      Access your schedule information
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm dark:bg-gray-950">
                    <MessageSquare className="h-10 w-10 mb-2 text-amber-500" />
                    <h3 className="text-lg font-medium">Chat Interface</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                      Ask questions about your data
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our platform uses advanced RAG technology to make your Google Workspace content searchable and
                  interactive.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <span className="font-bold text-lg text-blue-900 dark:text-blue-100">1</span>
                </div>
                <h3 className="text-xl font-bold">Connect</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Securely connect your Google Workspace account with OAuth 2.0
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <span className="font-bold text-lg text-blue-900 dark:text-blue-100">2</span>
                </div>
                <h3 className="text-xl font-bold">Index</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  We process and index your content with advanced chunking and embedding strategies
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <span className="font-bold text-lg text-blue-900 dark:text-blue-100">3</span>
                </div>
                <h3 className="text-xl font-bold">Search & Chat</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Ask questions and get answers with source attribution from your content
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-2 py-4 md:h-16 md:flex-row md:items-center md:justify-between md:py-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 Xyne. All rights reserved.</p>
          <nav className="flex gap-4 text-xs">
            <Link href="#" className="text-gray-500 hover:underline underline-offset-4 dark:text-gray-400">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-500 hover:underline underline-offset-4 dark:text-gray-400">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
