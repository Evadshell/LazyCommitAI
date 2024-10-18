import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
dotenv.config();

export async function generateCommitMessage(changesSummary: string): Promise<string> {
    const geminiToken = process.env.GEMINI_TOKEN;
    if (!geminiToken) {
        throw new Error('GEMINI_TOKEN is not defined in the environment variables');
    }
    const genAI = new GoogleGenerativeAI(geminiToken);
    const geminiModel = process.env.GEMINI_MODEL;
    if (!geminiModel) {
        throw new Error('GEMINI_MODEL is not defined in the environment variables');
    }
    const model = genAI.getGenerativeModel({ model: geminiModel });
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
