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
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setError("识别功能需要 HTTPS 安全连接，请检查部署配置。");
      return;
    }

    setCapturedImage(null);
    try {
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setStreamActive(true);
          }).catch(e => {
            setError("点击屏幕以启动摄像头。");
          });
        };
      }
      setError(null);
    } catch (err: any) {
      setError(err.name === 'NotAllowedError' ? "摄像头权限被拒绝，请在设置中开启。" : "无法访问摄像头设备。");
    }
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      startCamera();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera, isProcessing]);

  const capturePhoto = () => {
    if (isProcessing || !streamActive || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState < 2 || video.videoWidth === 0) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    // 限制最大截图宽度为 1024px，进一步减小数据体积提高成功率
    const maxWidth = 1024;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 使用 0.7 压缩率，在保证识别度的前提下最大限度减小请求体积
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setCapturedImage(dataUrl);
      
      const base64 = dataUrl.split(',')[1];
      if (base64) {
        onCapture(base64);
      }
      
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        setStreamActive(false);
      }
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-video rounded-[2.5rem] overflow-hidden bg-slate-950 shadow-2xl ring-1 ring-white/10">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-10 text-center space-y-6 z-50 bg-slate-900/95 backdrop-blur-md">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-sm font-bold opacity-80 max-w-xs">{error}</p>
          <button onClick={() => { setError(null); startCamera(); }} className="px-10 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold transition-all">尝试恢复相机</button>
        </div>
      ) : (
        <>
          {!capturedImage && (
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-700 ${streamActive ? 'opacity-100' : 'opacity-0'}`} />
          )}

          {capturedImage && (
            <div className="absolute inset-0">
              <img src={capturedImage} className={`w-full h-full object-cover transition-all duration-1000 ${isProcessing ? 'blur-2xl scale-110 opacity-30' : ''}`} alt="Captured" />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />

          {isProcessing && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="w-full h-[3px] bg-emerald-400 shadow-[0_0_30px_rgba(52,211,153,1)] animate-scan top-0 absolute"></div>
              </div>
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-white font-black text-xs tracking-[0.4em] uppercase animate-pulse">AI 正在深度解析食材...</p>
            </div>
          )}

          {!isProcessing && streamActive && !capturedImage && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
               <div className="w-full h-full border border-white/10 rounded-[3rem] relative">
                  <div className="absolute -top-1 -left-1 w-14 h-14 border-t-4 border-l-4 border-emerald-500/50 rounded-tl-[2rem]"></div>
                  <div className="absolute -top-1 -right-1 w-14 h-14 border-t-4 border-r-4 border-emerald-500/50 rounded-tr-[2rem]"></div>
                  <div className="absolute -bottom-1 -left-1 w-14 h-14 border-b-4 border-l-4 border-emerald-500/50 rounded-bl-[2rem]"></div>
                  <div className="absolute -bottom-1 -right-1 w-14 h-14 border-b-4 border-r-4 border-emerald-500/50 rounded-br-[2rem]"></div>
               </div>
            </div>
          )}

          {!isProcessing && !capturedImage && (
            <div className="absolute bottom-10 inset-x-0 flex justify-center z-30">
              <button 
                onClick={capturePhoto} 
                disabled={!streamActive} 
                className="group relative flex flex-col items-center gap-4 active:scale-95 transition-all"
              >
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full border-4 border-white/30 group-hover:scale-110 group-hover:border-white/60 transition-all duration-500"></div>
                  
                  {/* 精制相机快门 Logo */}
                  <div className="w-16 h-16 bg-emerald-700 rounded-full shadow-[0_10px_30px_rgba(4,120,87,0.5)] flex items-center justify-center z-10 group-hover:bg-emerald-800 transition-colors duration-300">
                     <div className="relative w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                           <circle cx="12" cy="13" r="3" />
                        </svg>
                        {/* 模拟镜头光泽 */}
                        <div className="absolute top-3 left-3 w-4 h-4 bg-white/10 rounded-full blur-[2px]"></div>
                     </div>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                  <span className="text-white text-[10px] font-black tracking-[0.4em] uppercase opacity-80 group-hover:opacity-100">拍摄识别</span>
                </div>
              </button>
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  );
};

export default CameraView;