"use client"

import { useState, useRef, useEffect, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, FileText, Calendar, Table, ExternalLink } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
interface Source {
  id: string
  title: string
  type: "doc" | "sheet" | "calendar"
  snippet: string
  url: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "doc":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "sheet":
        return <Table className="h-4 w-4 text-green-500" />
      case "calendar":
        return <Calendar className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch("/api/vespa/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      })

      const data = await res.json()

      if (data.message === "No results found") {
        const noResultMessage: ChatMessage = {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: "Sorry, I couldn't find any relevant data for your query.",
          sources: [],
        }
        setMessages((prev) => [...prev, noResultMessage])
      } else {
        const vespaHits = data.vespaHits || []
        const sources: Source[] = vespaHits.map((hit: any) => {
          const metadata = JSON.parse(hit.fields.metadata)
          const id = hit.fields.document_id.split("_")[0];
          let url;
          console.log("id ",id);
          if(metadata.type=='doc'){
            url = `https://docs.google.com/document/d/${id}`
          }else if(metadata.type=='sheet'){
            url = `https://docs.google.com/spreadsheets/d/${id}`
          }else{
            url= `https://calendar.google.com/calendar`
          }
          return {
            id: hit.fields.document_id,
            title: metadata.title,
            type: metadata.type as "doc" | "sheet" | "calendar",
            snippet: hit.fields.content.split("\n")[0],
            url: url,
          }
        })
        console.log("sources ",sources);

        const assistantMessage: ChatMessage = {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: data.answer,
          sources,
        }

        setMessages((prev) => [...prev, assistantMessage])
      }

    } catch (error) {
      console.log("Failed to fetch Vespa sources:", error)
      const errorMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: "Sorry, I couldn't retrieve any sources at the moment.",
        sources: [],
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setInput("")
    setIsLoading(false)
  }

  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p>Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Chat with Your Data</h1>
      </div>

      <Card className="flex-1 mb-4 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                <p className="text-gray-500 max-w-md">
                  Ask questions about your Google Workspace content. Try "What's in my Q2 marketing plan?" or "When is
                  my next meeting?"
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <div className="whitespace-pre-wrap"><ReactMarkdown>{message.content}</ReactMarkdown></div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 mb-2">Sources:</p>
                        <div className="space-y-2 max-h-[40px] overflow-y-scroll pr-10">
                          {message.sources.map((source) => (
                            <div key={source.id} className="flex items-start gap-2 text-sm">
                              {getSourceIcon(source.type)}
                              <div className="flex-1">
                                <div className="font-medium">{source.title}</div>
                                <p className="text-xs text-gray-500 line-clamp-1">{source.snippet}</p>
                              </div>
                              <a target="_blank" href={source.url} className="text-blue-500 hover:text-blue-700">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your content..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
