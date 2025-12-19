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
    setCapturedImage(null);
    try {
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onplaying = () => setStreamActive(true);
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => setStreamActive(true));
        };
      }
      setError(null);
    } catch (err) {
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
        ctx.drawImage(video, 0, 0, width, height);
        // 降低到 0.7 质量以加快上传和识别速度
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCapturedImage(dataUrl);
        
        const base64 = dataUrl.split(',')[1];
        if (base64) {
          onCapture(base64);
        }
        
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          setStreamActive(false);
        }
      }
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-black shadow-2xl ring-1 ring-slate-200">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center space-y-6 bg-slate-900 z-50">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/30">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <button 
            onClick={() => { setError(null); startCamera(); }}
            className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-bold shadow-xl hover:bg-slate-50 active:scale-95 transition-all"
          >
            开启摄像头
          </button>
        </div>
      ) : (
        <>
          {!capturedImage && (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          )}

          {capturedImage && (
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={capturedImage} 
                className={`w-full h-full object-cover transition-all duration-1000 ${isProcessing ? 'blur-md scale-105 opacity-60' : 'opacity-100'}`}
                alt="Captured"
              />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />

          {isProcessing && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-[4px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(52,211,153,1)] animate-scan-y top-0 absolute opacity-80"></div>
              </div>
              <div className="flex flex-col items-center gap-6">
                 <div className="relative w-20 h-20">
                   <div className="absolute inset-0 border-[3px] border-emerald-500/20 rounded-full"></div>
                   <div className="absolute inset-0 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
                 <p className="text-white font-bold text-xl tracking-tight drop-shadow-lg">
                   正在极速识别...
                 </p>
              </div>
            </div>
          )}

          {!isProcessing && streamActive && !capturedImage && (
            <div className="absolute inset-0 pointer-events-none z-10">
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4/5 h-4/5 border border-white/10 rounded-[2.5rem] relative">
                     <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl"></div>
                     <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl"></div>
                     <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl"></div>
                     <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl"></div>
                  </div>
               </div>
            </div>
          )}

          {!isProcessing && !capturedImage && (
            <div className="absolute bottom-10 inset-x-0 flex justify-center z-50">
              <button
                onClick={capturePhoto}
                disabled={!streamActive}
                className="w-20 h-20 rounded-full border-4 border-white shadow-2xl bg-white/20 backdrop-blur-md flex items-center justify-center hover:scale-105 active:scale-90 transition-all"
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-full shadow-inner flex items-center justify-center">
                   <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                   </svg>
                </div>
              </button>
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
        .animate-scan-y { animation: scan-y 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default CameraView;