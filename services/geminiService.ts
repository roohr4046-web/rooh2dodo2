import { GoogleGenAI, Type } from "@google/genai";
import { GeminiMetadataResponse } from "../types";

// Initialize Gemini Client
// In a production app, the API key should be securely handled.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateVideoMetadata = async (filename: string): Promise<GeminiMetadataResponse> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided. Returning mock data.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: `فيديو معالج: ${filename.replace(/\.[^/.]+$/, "")}`,
          description: "هذا وصف تجريبي تم إنشاؤه تلقائياً لأن مفتاح API غير موجود. يرجى إضافة مفتاح Gemini لتفعيل الذكاء الاصطناعي الحقيقي.",
          tags: ["فيديو", "تجريبي", "سحابة"]
        });
      }, 1500);
    });
  }

  try {
    const prompt = `
      لدي ملف فيديو باسم "${filename}". 
      يرجى إنشاء الآتي **باللغة العربية**:
      1. عنوان جذاب متوافق مع محركات البحث (SEO).
      2. وصف قصير وشيق (جملتين كحد أقصى).
      3. خمسة وسوم (tags) ذات صلة.
      افترض أن المحتوى تقني أو تعليمي بناءً على الاسم.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as GeminiMetadataResponse;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    // Fallback in case of error
    return {
      title: filename,
      description: "فشل التوليد التلقائي. يرجى التعديل يدوياً.",
      tags: ["خطأ", "مراجعة-يدوية"]
    };
  }
};