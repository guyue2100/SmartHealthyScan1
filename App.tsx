import React, { useState } from 'react';
import Header from './components/Header';
import CameraView from './components/CameraView';
import ResultDisplay from './components/ResultDisplay';
import { analyzeIngredientsAndGetRecipes } from './geminiService';
import { AnalysisResponse } from './types';

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (base64Image: string) => {
    setIsProcessing(true);
    setError(null);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("分析时间过长，请检查网络后重试。")), 35000)
    );

    try {
      const data = await Promise.race([
        analyzeIngredientsAndGetRecipes(base64Image),
        timeoutPromise
      ]) as AnalysisResponse;
      
      setResult(data);
    } catch (err: any) {
      console.error("Capture handle error:", err);
      setError(err.message || "分析失败，请稍后重试。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-8 md:py-20">
        {!result ? (
          <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                智能食材识别与食谱推荐
              </h2>
              <p className="text-sm md:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
                分析食材，为您提供科学的营养建议与美味的健康食谱
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <CameraView onCapture={handleCapture} isProcessing={isProcessing} />
            </div>

            {error && (
              <div className="max-w-lg mx-auto bg-rose-50 border border-rose-100 text-rose-800 px-6 py-4 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs md:text-sm font-medium">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-2 md:pt-6">
              {[
                { title: "视觉识别", desc: "拍照即刻识别多种食材" },
                { title: "营养百科", desc: "了解食材热量与营养价值" },
                { title: "定制食谱", desc: "基于现有食材生成健康方案" }
              ].map((f, i) => (
                <div key={i} className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-xs md:text-sm text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ResultDisplay data={result} onReset={handleReset} />
        )}
      </main>

      <footer className="py-8 md:py-12 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs md:text-sm text-slate-400 font-medium">© 2025 SmartHealthyScan. 专业智能营养分析。</p>
        </div>
      </footer>
    </div>
  );
};

export default App;