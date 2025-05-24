import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI('AIzaSyC8mAe6WVhvjSf4vBwITLQw15ZZ_ODmgKM')

export async function generateGeminiAnswer(prompt: string): Promise<string> {
    // Use the model name you found from listModels()
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
}