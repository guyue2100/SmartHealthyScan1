import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "./types";

export const analyzeIngredientsAndGetRecipes = async (base64Image: string): Promise<AnalysisResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key 未配置，请联系管理员。");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    你是一个极其专业的视觉识别 AI 营养师。
    
    任务：
    1. 识别图片中的食材（蔬菜、肉类、海鲜等）。
    2. 提供核心营养价值和每100g预估热量。
    3. 推荐3个极简健康食谱。
    
    要求：
    - 必须严格返回符合 JSON Schema 的数据。
    - 不要包含任何 Markdown 标签（如 \`\`\`json）。
    - 描述简练，语言为中文。
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            info: { type: Type.STRING },
            nutrition: { type: Type.STRING },
            caloriesPer100g: { type: Type.INTEGER }
          },
          required: ["name", "info", "caloriesPer100g"]
        }
      },
      recipes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            prepTime: { type: Type.STRING },
            allIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "name", "difficulty", "prepTime", "allIngredients", "instructions"]
        }
      }
    },
    required: ["ingredients", "recipes"]
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { 
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "请分析这张照片中的食材并返回 JSON。" }
        ] 
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 未能识别到有效内容。");
    
    // 过滤掉可能存在的 markdown 标签并解析
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);
    
    if (!parsedData.ingredients || parsedData.ingredients.length === 0) {
      throw new Error("未能识别到清晰的食材，请调整角度重拍。");
    }

    return parsedData as AnalysisResponse;
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    if (error instanceof SyntaxError) throw new Error("识别结果解析失败，请重试。");
    throw error;
  }
};