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
      setError("识别功能需要 HTTPS 安全连接。请确保在安全环境下访问。");
      return;
    }

    setCapturedImage(null);
    try {
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 }, // 调整为理想的 720p 级别，平衡清晰度与体积
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
            console.error("Camera Auto-play blocked:", e);
            setError("请点击界面以激活摄像头。");
          });
        };
      }
      setError(null);
    } catch (err: any) {
      console.error("Camera Setup Error:", err);
      setError(err.name === 'NotAllowedError' ? "摄像头访问被拒绝，请检查权限。" : "无法检测到摄像头设备。");
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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 关键优化：0.75 的压缩率能大幅提升上传成功率
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
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
          <button onClick={() => { setError(null); startCamera(); }} className="px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-900/20">重新连接相机</button>
        </div>
      ) : (
        <>
          {!capturedImage && (
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-700 ${streamActive ? 'opacity-100' : 'opacity-0'}`} />
          )}

          {capturedImage && (
            <div className="absolute inset-0">
              <img src={capturedImage} className={`w-full h-full object-cover transition-all duration-1000 ${isProcessing ? 'blur-2xl scale-110 opacity-40' : ''}`} alt="Captured" />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />

          {isProcessing && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl">
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-full h-[3px] bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] animate-scan top-0 absolute"></div>
              </div>
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-white font-bold text-xs tracking-[0.4em] uppercase animate-pulse">正在解析食材成分...</p>
            </div>
          )}

          {!isProcessing && streamActive && !capturedImage && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
               <div className="w-full h-full border border-white/10 rounded-[2rem] relative">
                  <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-emerald-500/60 rounded-tl-3xl"></div>
                  <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-emerald-500/60 rounded-tr-3xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-emerald-500/60 rounded-bl-3xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-emerald-500/60 rounded-br-3xl"></div>
               </div>
            </div>
          )}

          {!isProcessing && !capturedImage && (
            <div className="absolute bottom-10 inset-x-0 flex justify-center z-30">
              <button 
                onClick={capturePhoto} 
                disabled={!streamActive} 
                className="group relative flex flex-col items-center gap-3 active:scale-95 transition-all"
              >
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full border-4 border-white/30 group-hover:scale-110 group-hover:border-white/50 transition-all duration-300"></div>
                  {/* 相机快门 Logo */}
                  <div className="w-16 h-16 bg-emerald-700 rounded-full shadow-2xl flex items-center justify-center z-10 group-hover:bg-emerald-800 transition-colors">
                     <svg className="w-8 h-8 text-white transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <circle cx="12" cy="13" r="3" strokeWidth={2.5} />
                     </svg>
                  </div>
                </div>
                <span className="text-white text-[10px] font-black tracking-[0.3em] uppercase opacity-70 group-hover:opacity-100">识别食材</span>
              </button>
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default CameraView;