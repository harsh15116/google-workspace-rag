import { GoogleGenerativeAI, TaskType } from "@google/generative-ai"
import { chunkText } from "./utils"

// Initialize Gemini
const genAI = new GoogleGenerativeAI("AIzaSyC8mAe6WVhvjSf4vBwITLQw15ZZ_ODmgKM")
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" })

/**
 * Generate an embedding for a single text using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent({
      content: {
        role: "user", // Required by SDK
        parts: [{ text }], // The text to embed
      },
      taskType: TaskType.RETRIEVAL_DOCUMENT, // Appropriate for doc embeddings
    })

    return result.embedding.values
  } catch (error) {
    console.error("Error generating Gemini embedding:", error)
    throw error
  }
}

/**
 * Generate embeddings for multiple texts using Gemini
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const embeddings = await Promise.all(texts.map(generateEmbedding))
    return embeddings
  } catch (error) {
    console.error("Error generating multiple Gemini embeddings:", error)
    throw error
  }
}

/**
 * Process a document for RAG by chunking and generating embeddings using Gemini
 */
export async function processDocumentForRAG(
  document: { id: string; content: string; metadata?: any },
  chunkSize = 1000,
  overlap = 200,
){
  // Chunk the document into overlapping segments
  const chunks = chunkText(document.content, chunkSize, overlap)

  // Generate embeddings for each chunk
  const results = await Promise.all(
    chunks.map(async (chunk, index) => {
      const embedding = await generateEmbedding(chunk)
      return {
        documentId: document.id,
        chunkIndex: index,
        content: chunk,
        embedding,
        metadata: document.metadata,
      }
    }),
  )

  return results
}
