import https from "https"
import axios, { AxiosInstance } from "axios"

/**
 * Vespa client for interacting with the Vespa search engine
 */
export class VespaClient {
  private baseUrl: string
  private axiosInstance: AxiosInstance
  private namespace: string
  private documentType: string

  constructor(baseUrl: string, namespace = "msmarco", documentType = "passage") {
    this.baseUrl = baseUrl
    this.namespace = namespace
    this.documentType = documentType

    // Set up mTLS agent

    let cert;
    let key;
    if (process.env.NEXT_PUBLIC_INGEST_CERT && process.env.NEXT_PUBLIC_INGEST_KEY) {
      cert = process.env.NEXT_PUBLIC_INGEST_CERT.replace(/\\n/g, "\n")
      key = process.env.NEXT_PUBLIC_INGEST_KEY.replace(/\\n/g, "\n")
    }

    const agent = new https.Agent({
      cert,
      key,
    })

    this.axiosInstance = axios.create({
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  private buildDocumentUrl(documentId: string) {
    return `${this.baseUrl}/document/v1/${this.namespace}/${this.documentType}/docid/${documentId}`
  }

  /**
   * Index a document in Vespa
   */
  async indexDocument(documentId: string, fields: Record<string, any>) {
    try {
      const response = await axios.post("/api/vespa/load", {
        document: {
          id: fields.document_id,
          title: fields.title,
          chunk_id: fields.chunk_id || null,
          type: fields.document_type,
          lastModified: fields.last_modified,
          metadata: fields.metadata ? JSON.parse(fields.metadata) : {},
          content: fields.content || null,
          text_summary : fields.text_summary || "",
          embedding:fields.embeddings || null,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to call /api/vespa/load:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || "Failed to index document via backend route");
    }
  }

  /**
   * Perform a search query in Vespa
   */
  async search(yql: string, queryVector?: number[], params: Record<string, any> = {}) {
    try {
      const url = `${this.baseUrl}/search/`
      const body: Record<string, any> = {
        yql,
        ...params,
      }

      if (queryVector) {
        body.input = {
          query_embedding: {
            values: queryVector,
          },
        }
      }

      const response = await this.axiosInstance.post(url, body)
      return response.data
    } catch (error: any) {
      console.error("❌ Error searching in Vespa:", error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Delete a document from Vespa
   */
  async deleteDocument(documentId: string) {
    try {
      const url = this.buildDocumentUrl(documentId)
      const response = await this.axiosInstance.delete(url)
      return response.data
    } catch (error: any) {
      console.error("❌ Error deleting document from Vespa:", error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Update a document in Vespa
   */
  async updateDocument(documentId: string, fields: Record<string, any>) {
    try {
      const url = this.buildDocumentUrl(documentId)
      const body = { fields }
      const response = await this.axiosInstance.put(url, body)
      return response.data
    } catch (error: any) {
      console.error("❌ Error updating document in Vespa:", error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Check if Vespa is healthy
   */
  async healthCheck() {
    try {
      const url = `${this.baseUrl}/status.html`
      const response = await this.axiosInstance.get(url)
      return response.status === 200
    } catch (error: any) {
      console.error("⚠️ Vespa health check failed:", error.response?.data || error.message)
      return false
    }
  }
}

// Singleton accessor
let vespaClient: VespaClient | null = null

export function getVespaClient() {
  if (!vespaClient) {
    const vespaEndpoint = process.env.VESPA_ENDPOINT || "https://a103a4a6.ffc048d6.z.vespa-app.cloud"
    vespaClient = new VespaClient(vespaEndpoint)
  }
  return vespaClient
}
