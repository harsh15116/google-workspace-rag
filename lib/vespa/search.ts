import { getVespaClient } from "./client"
import { generateEmbedding } from "../embeddings"

interface SearchResult {
  id: string
  title: string
  content: string
  score: number
  type: "doc" | "sheet" | "calendar"
  metadata: any
}

/**
 * Search Vespa for relevant content
 */
export async function searchVespa(query: string, limit = 5): Promise<SearchResult[]> {
  try {
    const vespaClient = getVespaClient()

    // Generate embedding for the query
    const embedding = await generateEmbedding(query)

    // Construct YQL query for hybrid search
    const yql = `
      select * from content_chunk 
      where ({targetHits:${limit}}nearestNeighbor(embedding, query_embedding)) or 
            ({grammar: "loose"}userQuery("content:${query}")) 
      order by (0.7 * closeness(embedding) + 0.3 * bm25(content))
      limit ${limit}
    `

    const searchResults = await vespaClient.search(yql, embedding, {
      ranking: "hybrid",
      hits: limit,
    })

    // Transform Vespa results to our format
    return searchResults.root.children.map((hit: any) => ({
      id: hit.fields.chunk_id,
      title: hit.fields.title,
      content: hit.fields.content,
      score: hit.relevance,
      type: hit.fields.document_type,
      metadata: JSON.parse(hit.fields.metadata || "{}"),
    }))
  } catch (error) {
    console.error("Error searching Vespa:", error)

    // Return empty results on error
    return []
  }
}
