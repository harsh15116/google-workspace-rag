import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { searchVespa } from "@/lib/vespa/search"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()
  const session = await getServerSession(authOptions)

  // Check if user is authenticated
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Get the last user message
  const lastUserMessage = messages.filter((m: any) => m.role === "user").pop()

  if (!lastUserMessage) {
    return new Response("No user message found", { status: 400 })
  }

  try {
    // Search Vespa for relevant content
    const relevantContent = await searchVespa(lastUserMessage.content)

    // Format the context from search results
    const context = relevantContent
      .map(
        (item) =>
          `Source: ${item.title} (${item.type})
Content: ${item.content}`,
      )
      .join("\n\n")

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system: `You are an AI assistant that helps users find information in their Google Workspace content.
      
      Use ONLY the following context to answer the user's question:
      
      ${context || "No relevant content found in your Google Workspace."}
      
      If you cannot answer the question based on the provided context, say "I couldn't find information about that in your Google Workspace content."
      
      Always be helpful, clear, and concise. When you reference information, mention which document or source it came from.`,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response("Error processing your request", { status: 500 })
  }
}
