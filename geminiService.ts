import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "./types";

export const analyzeIngredientsAndGetRecipes = async (base64Image: string): Promise<AnalysisResponse> => {
  // 核心修复：在函数内部获取 API_KEY，确保部署环境下的环境变量注入生效
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    throw new Error("API_KEY 未正确注入或无效。请检查部署平台的环境变量设置。");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";
    
    const systemInstruction = `你是一位顶级的视觉营养专家和星级厨师。
你的任务：
1. 精准识别图片中的所有食材。
2. 为每种食材提供简短的百科信息和每100克的预估热量。
3. 根据识别到的食材，推荐3个制作简单、营养均衡的健康食谱。

规则：
- 必须严格返回 JSON 格式数据。
- 严禁包含 Markdown 标签（如 \`\`\`json）。
- 语言：中文。
- 若图中无食材，请在 ingredients 数组中返回空。`;

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

    const response = await ai.models.generateContent({
      model,
      contents: { 
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image.trim() } },
          { text: "请识别这张照片中的食材并提供营养建议和食谱。" }
        ] 
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 响应为空，请尝试重新拍摄。");
    
    // 清洗可能存在的不可见字符
    const cleanedText = text.trim();
    const parsedData = JSON.parse(cleanedText);
    
    if (!parsedData.ingredients || parsedData.ingredients.length === 0) {
      throw new Error("未能清晰识别到食材。请靠近拍摄，并确保光线充足。");
    }

    return parsedData as AnalysisResponse;
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    // 处理特定错误
    if (error.message?.includes("fetch")) {
      throw new Error("网络连接超时，请检查您的网络环境。");
    }
    if (error.message?.includes("Unexpected token")) {
      throw new Error("数据解析失败，模型返回了非预期的格式，请重试。");
    }
    
    throw error;
  }
};