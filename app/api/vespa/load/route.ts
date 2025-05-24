import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import https from "https";
import axios from "axios";

type DocumentInput = {
  id?: string;
  title: string;
  type: string;
  content: string;
  text_summary: string;
  metadata?: Record<string, any>;
  lastModified?:Date;
  embedding?:any;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const document: DocumentInput = body.document;

    if (!document || !document.title || !document.type) {
      return new Response(JSON.stringify({ error: "Missing required document fields" }), {
        status: 400,
      });
    }

    const agent = new https.Agent({
      cert: fs.readFileSync(path.resolve("app/api/vespa/load/ingest.pem")),
      key: fs.readFileSync(path.resolve("app/api/vespa/load/ingest_key.pem")),
    });

    const baseUrl = "https://b2aa1f94.ffc048d6.z.vespa-app.cloud";

    const payload = {
      fields: {
        document_id: document.id || "1",
        title: document.title,
        document_type: document.type,
        last_modified: document.lastModified || Date.now(),
        metadata: JSON.stringify(document.metadata || {}),
        text_summary: document.text_summary.substring(0, 500),
        embedding: document.embedding || null,
        content:document.content
      },
    };

    const response = await axios.post(
      `${baseUrl}/document/v1/msmarco/passage/docid/${document.id || 0}`,
      payload,
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return new Response(JSON.stringify({ message: "✅ Document indexed", data: response.data }), {
      status: 200,
    });
  } catch (error: any) {
    console.error("❌ Error indexing document:", error);
    return new Response(
      JSON.stringify({
        error: error.response?.data || error.message || "Internal Server Error",
      }),
      { status: 500 }
    );
  }
}
