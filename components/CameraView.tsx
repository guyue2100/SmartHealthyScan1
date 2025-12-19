
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CameraViewProps {
  onCapture: (base64Image: string) => void;
  isProcessing: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    console.log("Starting camera...");
    setCapturedImage(null);
    try {
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false 
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("Backing off to simple constraints", e);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        const handleVideoPlay = () => {
          setStreamActive(true);
        };

        videoRef.current.onplaying = handleVideoPlay;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error("Play failed", err);
            setStreamActive(true); 
          });
        };

        if (videoRef.current.readyState >= 2) {
          setStreamActive(true);
        }
      }
      setError(null);
    } catch (err) {
      console.error("Final camera error:", err);
      setError("无法访问摄像头。请检查权限设置。");
    }
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      startCamera();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera, isProcessing]);

  const capturePhoto = () => {
    if (isProcessing) return;

    if (videoRef.current && canvasRef.current && streamActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) return;

      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150);

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          // 保存最后一帧以供显示
          setCapturedImage(dataUrl);
          
          const base64 = dataUrl.split(',')[1];
          if (base64) {
            onCapture(base64);
          }
          
          // 拍照后停止视频流以节省资源
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setStreamActive(false);
          }
        } catch (err) {
          console.error("Draw/Export failed:", err);
        }
      }
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-video rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-black shadow-2xl ring-4 ring-white/10 group">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center space-y-6 bg-slate-900 z-50">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/30">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-lg text-white">摄像头启动受阻</p>
            <p className="text-sm text-slate-400 font-medium">{error}</p>
          </div>
          <button 
            onClick={() => { setError(null); startCamera(); }}
            className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black shadow-xl hover:bg-emerald-50 active:scale-95 transition-all"
          >
            授予权限并重试
          </button>
        </div>
      ) : (
        <>
          {/* 实时视频流 - 仅在非处理状态显示 */}
          {!capturedImage && (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* 最后一帧照片 - 仅在处理状态显示 */}
          {capturedImage && (
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={capturedImage} 
                className={`w-full h-full object-cover transition-all duration-1000 ${isProcessing ? 'blur-sm scale-105 opacity-60 brightness-75 animate-pulse-slow' : 'opacity-100'}`}
                alt="Captured content"
              />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          
          {/* 快门闪烁 */}
          <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />

          {/* 分析中动画覆盖层 */}
          {isProcessing && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] overflow-hidden">
              {/* 扫描线动画 */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-[4px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(52,211,153,1)] animate-scan-y top-0 absolute opacity-80"></div>
              </div>
              
              <div className="relative flex flex-col items-center gap-6">
                 {/* 加载光环 */}
                 <div className="relative w-24 h-24 md:w-32 md:h-32">
                   <div className="absolute inset-0 border-[4px] border-emerald-500/20 rounded-full"></div>
                   <div className="absolute inset-0 border-[4px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-10 h-10 md:w-12 md:h-12 text-emerald-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                   </div>
                 </div>

                 <div className="text-center px-6">
                    <p className="text-white font-black text-lg md:text-2xl tracking-tight drop-shadow-lg">
                      AI 正在深度识别食材中...
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                       <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* 辅助网格 */}
          {!isProcessing && streamActive && !capturedImage && (
            <div className="absolute inset-0 pointer-events-none z-10">
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4/5 h-4/5 border border-white/10 rounded-[2rem] md:rounded-[3rem] relative">
                     <div className="absolute -top-1 -left-1 w-6 h-6 md:w-8 md:h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl md:rounded-tl-2xl"></div>
                     <div className="absolute -top-1 -right-1 w-6 h-6 md:w-8 md:h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl md:rounded-tr-2xl"></div>
                     <div className="absolute -bottom-1 -left-1 w-6 h-6 md:w-8 md:h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl md:rounded-bl-2xl"></div>
                     <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl md:rounded-br-2xl"></div>
                  </div>
               </div>
            </div>
          )}

          {/* 拍照按钮 */}
          {!isProcessing && !capturedImage && (
            <div className="absolute bottom-6 md:bottom-10 inset-x-0 flex justify-center items-center z-50">
              <button
                onClick={capturePhoto}
                disabled={!streamActive}
                className={`
                  group/btn relative p-1 rounded-full border-[4px] md:border-[6px] border-white shadow-2xl transition-all duration-300
                  ${!streamActive ? 'grayscale opacity-30 cursor-wait' : 'hover:scale-105 active:scale-90 cursor-pointer'}
                `}
                aria-label="Take Photo"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 group-hover/btn:bg-white transition-colors">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500 rounded-full shadow-inner flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                       <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                       </svg>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {!streamActive && !error && !capturedImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-md z-40">
               <div className="flex flex-col items-center gap-6">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white font-bold text-xs md:text-sm tracking-widest uppercase">Initializing Lens...</p>
               </div>
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes scan-y {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1.05); }
          50% { transform: scale(1.08); }
        }
        .animate-scan-y {
          animation: scan-y 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CameraView;
