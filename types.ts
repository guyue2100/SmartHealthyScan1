
export interface IngredientInfo {
  name: string;
  info: string;
  nutrition?: string;
  caloriesPer100g?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  difficulty: '简单' | '中等' | '困难';
  prepTime: string;
  allIngredients: string[];
  instructions: string[];
  calories?: string;
}

export interface AnalysisResponse {
  ingredients: IngredientInfo[];
  recipes: Recipe[];
}
