import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();

export async function generateCommitMessage(changesSummary: string): Promise<string> {
 console.log(process.env.GEMINI_TOKEN);
 const genAI = new GoogleGenerativeAI(process.env.GEMINI_TOKEN);
 const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
        const prompt = `
        You are a Git commit message generator. Based on the following code changes, generate a concise and professional commit message that summarizes the changes.
        
        **Code Changes:**
        ${changesSummary}

        Please return a single concise commit message that reflects the intent of the changes.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Error generating commit message:', error);
        return 'Auto-commit changes';
    }
}
