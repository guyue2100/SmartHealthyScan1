
import React, { useState, useEffect, useMemo } from 'react';
import { IngredientInfo, Recipe } from '../types';

interface ResultDisplayProps {
  data: {
    ingredients: IngredientInfo[];
    recipes: Recipe[];
  };
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onReset }) => {
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, Set<string>>>({});
  const [difficultyFilter, setDifficultyFilter] = useState<string>('全部');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('smartHealthyFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smartHealthyFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleRecipe = (id: string) => {
    setExpandedRecipeId(expandedRecipeId === id ? null : id);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  const toggleIngredient = (recipeId: string, ingredient: string) => {
    setCheckedIngredients(prev => {
      const newSet = new Set(prev[recipeId] || []);
      if (newSet.has(ingredient)) {
        newSet.delete(ingredient);
      } else {
        newSet.add(ingredient);
      }
      return { ...prev, [recipeId]: newSet };
    });
  };

  const counts = useMemo(() => {
    const c = { 简单: 0, 中等: 0, 困难: 0, 全部: data.recipes.length };
    data.recipes.forEach(r => {
      if (r.difficulty in c) {
        c[r.difficulty as keyof typeof c]++;
      }
    });
    return c;
  }, [data.recipes]);

  const filteredAndSortedRecipes = useMemo(() => {
    let result = [...data.recipes];
    
    if (difficultyFilter !== '全部') {
      result = result.filter(r => r.difficulty === difficultyFilter);
    }

    const difficultyPriority: Record<string, number> = {
      '简单': 1,
      '中等': 2,
      '困难': 3
    };

    return result.sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 1 : 0;
      const bFav = favorites.includes(b.id) ? 1 : 0;
      
      if (aFav !== bFav) {
        return bFav - aFav;
      }

      const aDiff = difficultyPriority[a.difficulty] || 99;
      const bDiff = difficultyPriority[b.difficulty] || 99;
      
      return aDiff - bDiff;
    });
  }, [data.recipes, difficultyFilter, favorites]);

  const maxCalories = useMemo(() => {
    return Math.max(...data.ingredients.map(i => i.caloriesPer100g || 0), 1);
  }, [data.ingredients]);

  if (data.ingredients.length === 0 && data.recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">未能识别到食材</h3>
          <p className="text-slate-500">请确保食材清晰且光线充足。</p>
        </div>
        <button onClick={onReset} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all">
          重新尝试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-bold text-slate-900">识别结果</h2>
        <button 
          onClick={onReset}
          className="px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
        >
          重新扫描
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Stats */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              预估热量密度 (100g)
            </h3>
            <div className="space-y-5">
              {data.ingredients.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    <span className="text-xs font-bold text-emerald-600">{item.caloriesPer100g} kcal</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${((item.caloriesPer100g || 0) / maxCalories) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">食材百科</h3>
            <div className="space-y-3">
              {data.ingredients.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                    {item.nutrition && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold">
                        {item.nutrition}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.info}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Side: Recipes */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-900">推荐健康食谱</h3>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="全部">全部难度 ({counts.全部})</option>
              <option value="简单">简单 ({counts.简单})</option>
              <option value="中等">中等 ({counts.中等})</option>
              <option value="困难">困难 ({counts.困难})</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {filteredAndSortedRecipes.map((recipe) => {
              const isExpanded = expandedRecipeId === recipe.id;
              const isFavorite = favorites.includes(recipe.id);
              const checkedSet = checkedIngredients[recipe.id] || new Set();

              return (
                <div key={recipe.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                  <div 
                    onClick={() => toggleRecipe(recipe.id)}
                    className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors flex justify-between items-center"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          recipe.difficulty === '简单' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          recipe.difficulty === '中等' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {recipe.difficulty}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">{recipe.prepTime}</span>
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">{recipe.name}</h4>
                      <p className="text-sm text-slate-500 font-medium line-clamp-1">{recipe.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => toggleFavorite(e, recipe.id)}
                        className={`p-2 rounded-lg transition-colors ${isFavorite ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-rose-400'}`}
                      >
                        <svg className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-8 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">食材清单</h5>
                          <div className="space-y-2">
                            {recipe.allIngredients.map((ing, i) => (
                              <label key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                                  checked={checkedSet.has(ing)}
                                  onChange={() => toggleIngredient(recipe.id, ing)}
                                />
                                <span className={`text-sm font-bold ${checkedSet.has(ing) ? 'line-through text-slate-300' : 'text-slate-700'}`}>{ing}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">制作步骤</h5>
                          <div className="space-y-4">
                            {recipe.instructions.map((step, i) => (
                              <div key={i} className="flex gap-4">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold flex items-center justify-center border border-emerald-200">
                                  {i + 1}
                                </span>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
