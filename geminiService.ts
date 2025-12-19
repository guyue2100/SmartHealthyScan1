
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "./types";

export const analyzeIngredientsAndGetRecipes = async (base64Image: string): Promise<AnalysisResponse> => {
  // 按照规范，在调用前实例化以确保获取最新 API KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    你是一个专业的营养师和高级厨师。
    你的任务是：
    1. 识别图片中的所有食材（包括蔬菜、水果、鱼类、肉类等）。
    2. 为每种识别到的食材提供简短的营养背景或选购建议。
    3. 提供该食材每100克的预估热量（数值，单位kcal）。
    4. 基于这些识别到的食材，推荐 5 到 6 个健康的“减脂食谱”。
    5. 每个食谱必须包含：名称、描述、难度、准备时间、完整的配料清单、详细的制作步骤。
    
    返回的数据必须严格遵循提供的 JSON Schema 格式。
    语言请使用中文。
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "食材名称" },
            info: { type: Type.STRING, description: "食材的具体信息或营养价值" },
            nutrition: { type: Type.STRING, description: "营养标签文字描述，如 '低卡高纤维'" },
            caloriesPer100g: { type: Type.INTEGER, description: "每100克的热量数值（kcal）" }
          },
          required: ["name", "info", "caloriesPer100g"]
        }
      },
      recipes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "唯一标识符" },
            name: { type: Type.STRING, description: "食谱名称" },
            description: { type: Type.STRING, description: "食谱简介" },
            difficulty: { type: Type.STRING, description: "难度等级（简单/中等/困难）" },
            prepTime: { type: Type.STRING, description: "制作耗时" },
            allIngredients: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "所有需要的食材清单" 
            },
            instructions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "制作步骤" 
            },
            calories: { type: Type.STRING, description: "单份预估热量描述" }
          },
          required: ["id", "name", "description", "difficulty", "prepTime", "allIngredients", "instructions"]
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
    text: "分析这张图片中的食材，并提供相关的减脂食谱。"
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
    if (!text) throw new Error("API 返回内容为空");
    
    return JSON.parse(text.trim()) as AnalysisResponse;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error.message?.includes('xhr error') || error.message?.includes('500')) {
      throw new Error("网络请求失败，请检查网络或重试。");
    }
    throw new Error("识别食材失败，请确保图片清晰并重试。");
  }
};
