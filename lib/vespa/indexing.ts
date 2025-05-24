import { getVespaClient } from "./client"
import { processDocumentForRAG } from "../embeddings"

/**
 * Index a document and its chunks in Vespa
 */
export async function indexDocumentInVespa(document: {
  id: string
  title: string
  content: string
  type: "doc" | "sheet" | "calendar"
  lastModified: string
  metadata?: any
}) {
  try {
    const vespaClient = getVespaClient()


    // Index the main document
    // await vespaClient.indexDocument(document.id, {
    //   document_id: document.id,
    //   title: document.title,
    //   document_type: document.type,
    //   last_modified: new Date(document.lastModified).getTime(),
    //   metadata: JSON.stringify(document.metadata || {}),
    //   text_summary: document.content.substring(0, 500),
    // })

    // Process document content into chunks + embeddings for RAG
    const chunks = await processDocumentForRAG({
      id: document.id,
      content: document.content,
      metadata: {
        title: document.title,
        type: document.type,
        lastModified: document.lastModified,
      },
    })

    // Index each chunk separately
    for (const chunk of chunks) {
      await vespaClient.indexDocument(chunk.documentId + "_" + chunk.chunkIndex, {
        chunk_id: chunk.documentId + "_" + chunk.chunkIndex,
        document_id: chunk.documentId + "_" + chunk.chunkIndex,
        content: chunk.content,
        // embedding: {
        //   values: chunk.embedding,
        // },
        document_type: document.type,
        title: document.title,
        last_modified: new Date(document.lastModified).getTime(),
        metadata: JSON.stringify(chunk.metadata || {}),
      })
    }

    return {
      success: true,
      documentId: document.id,
      chunksCount: chunks.length,
    }
  } catch (error) {
    console.error("❌ Error indexing document in Vespa:", error)
    throw error
  }
}

/**
 * Delete a document and its content chunks from Vespa
 */
export async function deleteDocumentFromVespa(documentId: string) {
  try {
    const vespaClient = getVespaClient()

    // Delete main document
    await vespaClient.deleteDocument(documentId)

    // Search for all chunks related to this document
    const yql = `select * from content_chunk where document_id contains "${documentId}"`
    const searchResults = await vespaClient.search(yql)

    const hits = searchResults?.root?.children || []

    for (const hit of hits) {
      if (hit.fields?.chunk_id) {
        await vespaClient.deleteDocument(hit.fields.chunk_id)
      }
    }

    return {
      success: true,
      documentId,
      chunksDeleted: hits.length,
    }
  } catch (error) {
    console.error("❌ Error deleting document from Vespa:", error)
    throw error
  }
}
