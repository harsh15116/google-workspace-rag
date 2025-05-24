// app/api/search/route.ts
import { NextResponse } from "next/server"
import axios from "axios"
import https from "https"
import fs from "fs"
import path from "path"
import { generateEmbedding } from "@/lib/embeddings"
import { generateGeminiAnswer } from "@/lib/gemini"

const VESPA_ENDPOINT = "https://b2aa1f94.ffc048d6.z.vespa-app.cloud/search"

const httpsAgent = new https.Agent({
    cert: fs.readFileSync(path.resolve("app/api/vespa/search/serve.pem")),
    key: fs.readFileSync(path.resolve("app/api/vespa/search/serve_key.pem")),
})

export async function POST(req: Request) {
    try {
        const { query, topK = 10 } = await req.json()

        if (!query) {
            return NextResponse.json({ message: "Missing query" }, { status: 400 })
        }

        // let embedding = await generateEmbedding(query)
        // console.log("embeddings", embedding);

        // if (typeof embedding === 'string') {
        //     embedding = JSON.parse(embedding);
        // }

        const words = query.trim().split(/\s+/); // Split query into words
        const queryParts = words.map((word:string) =>
            `(title contains "${word}" OR text_summary contains "${word}" OR content contains "${word}")`
        );
        const combinedQuery = queryParts.join(" OR ");

        const vespaQuery = {
            yql: `select * from sources * where ${combinedQuery};`,
            ranking: "default",
            hits: topK
        };


        // const vespaQuery = {
        //     yql: `select * from sources * where ([{"targetNumHits":${topK}}]nearestNeighbor(embedding, query_embedding));`,
        //     "ranking.features.query(query_embedding)": embedding,  // pass array, not string!
        //     "ranking.profile": "default",
        //     hits: topK,
        // };



        const vespaResponse = await axios.post(VESPA_ENDPOINT, vespaQuery, {
            headers: { "Content-Type": "application/json" },
            httpsAgent,
        })

        const hits = vespaResponse.data.root.children ?? []

        if (hits.length === 0) {
            return NextResponse.json({ message: "No results found" }, { status: 404 })
        }

        // 2. Extract content
        const context = hits.map((hit: any) => hit.fields.content).join("\n\n")

        // 3. Construct prompt
        const prompt = `Answer the following question based on the context below:\n\nQuestion: ${query}\n\nContext:\n${context}`

        // 4. Ask Gemini
        const geminiResponse = await generateGeminiAnswer(prompt)

        return NextResponse.json({
            answer: geminiResponse,
            query,
            vespaHits: hits,
        })

    } catch (error: any) {
        console.error("Vespa query failed:", JSON.stringify(error.response?.data) || error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
