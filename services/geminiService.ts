import { GoogleGenAI, Type } from "@google/genai";

// Helper to remove base64 prefix
const cleanBase64 = (data: string) => {
  return data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (data: string) => {
    const match = data.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    return match ? match[1] : 'image/jpeg';
};

/**
 * Generates an image of the user wearing glasses based on a text prompt or a reference glasses image.
 */
export const generateEyewearImage = async (
  originalImage: string,
  prompt: string,
  glassesImage?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // We use the image model for generation
  const model = 'gemini-2.5-flash-image';

  const parts: any[] = [];

  // 1. Add Original Face
  parts.push({
    inlineData: {
      data: cleanBase64(originalImage),
      mimeType: getMimeType(originalImage),
    },
  });

  // 2. Add Glasses Reference (if Try-On mode)
  if (glassesImage) {
    parts.push({
      inlineData: {
        data: cleanBase64(glassesImage),
        mimeType: getMimeType(glassesImage),
      },
    });
    // Specific prompt for merging
    parts.push({
      text: "Refine the first image by placing the glasses from the second image onto the person's face in the first image. Ensure realistic lighting, shadows, perspective, and fit. Do not alter the person's facial features significantly, just add the accessory."
    });
  } else {
    // Consultant Mode
    parts.push({
      text: `Edit the image to add eyeglasses on the person's face. Style description: ${prompt}. Ensure high-quality, photorealistic texturing and correct perspective.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        // No responseMimeType for image generation models usually, 
        // but we want to ensure we parse the response correctly.
      }
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

/**
 * text chat service with Search Grounding for finding products.
 */
export const chatWithConsultant = async (
  message: string,
  history: { role: string; text: string }[]
): Promise<{ text: string; links: Array<{ title: string; url: string }> }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash'; // Or gemini-3-pro-preview for better reasoning

  // Convert simple history to Gemini format if needed, 
  // but for single turn with grounding, we construct a rich prompt.
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: message,
      config: {
        systemInstruction: "You are an expert optical stylist and vision consultant. Help the user find glasses, describe styles, and suggest brands. You speak Persian (Farsi). When looking for products, use Google Search to find real links.",
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "متاسفم، نمی‌توانم پاسخ دهم.";
    const links: Array<{ title: string; url: string }> = [];

    // Extract grounding chunks
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          links.push({
            title: chunk.web.title,
            url: chunk.web.uri
          });
        }
      });
    }

    return { text, links };
  } catch (error) {
    console.error("Chat error:", error);
    return { text: "خطایی در ارتباط با مشاور رخ داد.", links: [] };
  }
};