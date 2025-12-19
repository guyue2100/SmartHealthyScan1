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
    // 检查是否在安全上下文中（HTTPS），否则无法使用摄像头
    if (!window.isSecureContext) {
      setError("由于浏览器安全限制，摄像头识别功能仅在 HTTPS 环境下可用。请检查您的连接。");
      return;
    }

    setCapturedImage(null);
    try {
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1024 },
          height: { ideal: 1024 }
        },
        audio: false 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onplaying = () => setStreamActive(true);
      }
      setError(null);
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError') {
        setError("摄像头访问被拒绝。请在浏览器设置中允许此页面访问摄像头。");
      } else {
        setError("无法初始化摄像头。请确保没有其他应用正在占用它。");
      }
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
      
      // 检查视频是否真的有画面数据
      if (video.readyState < 2) return;

      const width = video.videoWidth;
      const height = video.videoHeight;

      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150);

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        // 使用 0.8 质量，既能保证识别度，又能减小体积提升速度
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        
        const base64 = dataUrl.split(',')[1];
        if (base64) {
          onCapture(base64);
        }
        
        // 捕获后暂时停止视频以节省资源
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          setStreamActive(false);
        }
      }
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-10 text-center space-y-6 z-50">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30">
            <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold">无法使用摄像头</p>
            <p className="text-sm opacity-60 max-w-sm mx-auto">{error}</p>
          </div>
          <button 
            onClick={() => { setError(null); startCamera(); }}
            className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all"
          >
            重试连接
          </button>
        </div>
      ) : (
        <>
          {!capturedImage && (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0'}`} 
            />
          )}

          {capturedImage && (
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={capturedImage} 
                className={`w-full h-full object-cover transition-all duration-1000 ${isProcessing ? 'blur-md scale-105' : ''}`}
                alt="Captured"
              />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />

          {isProcessing && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/30 backdrop-blur-md">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan top-0 absolute opacity-80"></div>
              </div>
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-white font-bold text-lg tracking-widest uppercase animate-pulse">
                智能识别中
              </p>
            </div>
          )}

          {!isProcessing && streamActive && !capturedImage && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
               <div className="w-full h-full border-2 border-white/20 rounded-[2rem] relative">
                  <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-3xl"></div>
                  <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-3xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-3xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-3xl"></div>
               </div>
            </div>
          )}

          {!isProcessing && !capturedImage && (
            <div className="absolute bottom-10 inset-x-0 flex justify-center z-30">
              <button
                onClick={capturePhoto}
                disabled={!streamActive}
                className="group relative w-20 h-20 flex items-center justify-center transition-all active:scale-90"
              >
                <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/50 group-hover:scale-110 transition-transform"></div>
                <div className="w-14 h-14 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center z-10">
                   <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                   </svg>
                </div>
              </button>
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes scan {
          0% { top: -5%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }
        .animate-scan { animation: scan 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default CameraView;