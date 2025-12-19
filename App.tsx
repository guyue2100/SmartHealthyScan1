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
    
    // 为复杂的视觉任务提供充足的时间
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("AI 响应超时，可能是网络环境不稳定或图片上传受阻。")), 45000)
    );

    try {
      const data = await Promise.race([
        analyzeIngredientsAndGetRecipes(base64Image),
        timeoutPromise
      ]) as AnalysisResponse;
      
      setResult(data);
    } catch (err: any) {
      console.error("App Analysis Error:", err);
      let msg = err.message || "由于系统繁忙，无法完成识别。";
      // 不区分大小写的 API KEY 校验
      if (/api[_\s]?key/i.test(msg)) {
        msg = "环境配置错误：请检查部署平台的 API_KEY 设置是否正确注入。";
      }
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFF] selection:bg-emerald-100 selection:text-emerald-900">
      <Header />
      
      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-10 md:py-20">
        {!result ? (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="text-center space-y-6">
              <h2 className="text-4xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05]">
                重新定义您的<br/><span className="bg-clip-text text-transparent bg-gradient-to-br from-emerald-600 to-teal-500">健康烹饪艺术</span>
              </h2>
              <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium tracking-tight">
                瞬时识别食材，开启智能营养分析
              </p>
            </div>

            <div className="max-w-4xl mx-auto relative">
              <CameraView onCapture={handleCapture} isProcessing={isProcessing} />
              
              <div className="absolute -z-10 -top-12 -left-12 w-64 h-64 bg-emerald-100/40 rounded-full blur-[80px]"></div>
              <div className="absolute -z-10 -bottom-12 -right-12 w-64 h-64 bg-teal-100/40 rounded-full blur-[80px]"></div>
            </div>

            {error && (
              <div className="max-w-lg mx-auto bg-rose-50 border border-rose-100 text-rose-800 px-6 py-5 rounded-[2rem] flex items-start gap-4 animate-in shake duration-500">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold">识别遇到一点问题</p>
                  <p className="text-xs font-medium opacity-70 leading-relaxed">{error}</p>
                </div>
              </div>
            )}
            
            <div className="max-w-4xl mx-auto">
              <div className="relative group overflow-hidden bg-white border border-slate-100 rounded-[3rem] p-10 md:p-14 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.04)] hover:shadow-[0_60px_100px_-30px_rgba(0,0,0,0.08)] transition-all duration-700">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-50/50 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 md:divide-x divide-slate-50">
                  <div className="space-y-5">
                    <div className="w-14 h-14 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">感官级视觉识别</h3>
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">毫秒级 AI 视觉引擎，精准捕捉食材的独特特质。</p>
                    </div>
                  </div>

                  <div className="space-y-5 md:pl-10">
                    <div className="w-14 h-14 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">深度营养洞察</h3>
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">提供全方位的食材背景与科学营养指南。</p>
                    </div>
                  </div>

                  <div className="space-y-5 md:pl-10">
                    <div className="w-14 h-14 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">大师级定制方案</h3>
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">实时生成由专业大厨校对的个性化健康食谱。</p>
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

      <footer className="py-16 border-t border-slate-50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-300 font-bold tracking-[0.25em] uppercase">© 2025 SmartHealthyScan · Intelligent Kitchen Intelligence</p>
        </div>
      </footer>
    </div>
  );
};

export default App;