import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "./types";

export const analyzeIngredientsAndGetRecipes = async (base64Image: string): Promise<AnalysisResponse> => {
  // 根据开发规范，直接从环境获取并初始化
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `你是一位顶级的视觉营养专家。
请识别图片中的食材，并以 JSON 格式提供详细的营养分析及3个极简健康食谱。
确保返回的 JSON 结构严谨，不要包含 Markdown 代码块标记，直接输出 JSON 字符串。
食材信息要具体，食谱步骤要易于操作。`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "食材名称" },
            info: { type: Type.STRING, description: "食材百科信息" },
            nutrition: { type: Type.STRING, description: "主要营养成分" },
            caloriesPer100g: { type: Type.INTEGER, description: "每百克能量(kcal)" }
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
            difficulty: { type: Type.STRING, enum: ["简单", "中等", "困难"] },
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
          { text: "分析此图中的所有食材并生成健康方案。" }
        ] 
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 服务未返回有效数据，请检查网络或重拍图片。");
    
    // 鲁棒的 JSON 解析逻辑
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);
    
    if (!parsedData.ingredients || parsedData.ingredients.length === 0) {
      throw new Error("未能从图中清晰识别到食材，请调整角度并确保光线充足。");
    }

    return parsedData as AnalysisResponse;
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    if (error.message?.includes("API_KEY")) {
      throw new Error("环境配置错误：API 密钥无效或未正确配置。");
    }
    throw error;
  }
};