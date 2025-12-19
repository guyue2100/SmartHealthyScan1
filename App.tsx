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
    <div className="min-h-screen flex flex-col bg-[#FDFDFF]">
      <Header />
      
      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-8 md:py-16">
        {!result ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                重新定义您的<br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">健康烹饪艺术</span>
              </h2>
              <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                瞬时识别食材，开启智能营养分析
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <CameraView onCapture={handleCapture} isProcessing={isProcessing} />
            </div>

            {error && (
              <div className="max-w-lg mx-auto bg-rose-50 border border-rose-100 text-rose-800 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in shake duration-500">
                <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}
            
            {/* 优化后的高级感功能一体化卡框 */}
            <div className="max-w-4xl mx-auto">
              <div className="relative group overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] hover:shadow-[0_48px_80px_-24px_rgba(0,0,0,0.08)] transition-all duration-500">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x divide-slate-100">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">感官级视觉识别</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">毫秒级 AI 视觉引擎，精准捕捉食材的独特特质。</p>
                    </div>
                  </div>

                  <div className="space-y-4 md:pl-8">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">深度营养洞察</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">提供全方位的食材背景与科学营养指南。</p>
                    </div>
                  </div>

                  <div className="space-y-4 md:pl-8">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">大师级定制方案</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">实时生成由专业大厨校对的个性化健康食谱。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ResultDisplay data={result} onReset={handleReset} />
        )}
      </main>

      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs md:text-sm text-slate-400 font-bold tracking-widest uppercase">© 2025 SmartHealthyScan · Intelligent Kitchen Intelligence</p>
        </div>
      </footer>
    </div>
  );
};

export default App;