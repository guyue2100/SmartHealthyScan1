import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "./types";

export const analyzeIngredientsAndGetRecipes = async (base64Image: string): Promise<AnalysisResponse> => {
  // 实时实例化以使用最新环境中的 API KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    你是一个极其高效的AI营养师。
    目标：瞬时分析食材并返回最精简的JSON。
    
    任务：
    1. 识别图片食材。
    2. 提供核心价值和100g热量。
    3. 推荐 3 个极简健康食谱。
    
    规则：
    - 响应必须是纯JSON，严禁额外文字。
    - 文本描述尽量简短（不超过20字）。
    - 语言：中文。
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

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image
    }
  };

  const textPart = {
    text: "识别并给出3个食谱，直接返回JSON格式。"
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("识别结果为空");
    
    return JSON.parse(text.trim()) as AnalysisResponse;
  } catch (error: any) {
    console.error("Gemini Speed Mode Error:", error);
    throw new Error("识别失败，请检查图片并重试。");
  }
};