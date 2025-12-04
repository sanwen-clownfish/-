import React, { useState, useEffect, useRef } from 'react';
import ParticleScene from './components/ParticleScene';
import OverlayUI from './components/OverlayUI';
import { ParticleConfig, ShapeType, GestureState } from './types';
import { analyzeGesture } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<ParticleConfig>({
    shape: ShapeType.HEART,
    color: '#e63946',
    expansion: 0.5
  });
  
  const [gestureState, setGestureState] = useState<GestureState>('OPEN');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef(false);

  const startCamera = async () => {
    try {
      setCameraError(null);
      // Request standard SD resolution to save bandwidth/processing
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 320 }, 
          height: { ideal: 240 }, 
          facingMode: 'user' 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready to play
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("无法访问摄像头:", err);
      setCameraActive(false);
      setCameraError("无法访问摄像头 (请确保在 HTTPS 环境下运行并允许权限)");
    }
  };

  // Initialize Camera on mount
  useEffect(() => {
    startCamera();
  }, []);

  // Gesture Recognition Loop (Only runs if camera is active)
  useEffect(() => {
    if (!cameraActive) return;

    const captureAndAnalyze = async () => {
      if (!videoRef.current || !canvasRef.current || processingRef.current) return;

      processingRef.current = true;
      
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Ensure video has actual dimensions
        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx && video.videoWidth > 0) {
          // Draw video frame to hidden canvas
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Mirror the image for intuitive interaction
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

          // Convert to Base64 (Lower quality for speed)
          const base64Image = canvas.toDataURL('image/jpeg', 0.6);

          // Send to API
          const detectedState = await analyzeGesture(base64Image);
          setGestureState(detectedState);
        }
      } catch (error) {
        console.error("手势分析失败:", error);
      } finally {
        processingRef.current = false;
      }
    };

    // Run analysis every 800ms to balance responsiveness and API quota
    const intervalId = setInterval(captureAndAnalyze, 800);

    return () => clearInterval(intervalId);
  }, [cameraActive]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(e => console.log(e));
        setIsFullscreen(false);
      }
    }
  };

  // Interaction Handlers for Fallback Mode
  const handleInteractionStart = () => {
    if (!cameraActive) {
      setGestureState('CLOSED');
    }
  };

  const handleInteractionEnd = () => {
    if (!cameraActive) {
      setGestureState('OPEN');
    }
  };

  return (
    <div 
      className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none cursor-pointer"
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd} 
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 
        CRITICAL FIX for Mobile/iOS: 
        Do not use display:none (className="hidden"). 
        Video must be rendered for canvas.drawImage to work.
        We use opacity-0 and z-index-negative to hide it visually.
      */}
      <video 
        ref={videoRef} 
        style={{ position: 'absolute', opacity: 0, zIndex: -10, pointerEvents: 'none' }}
        playsInline 
        muted 
        autoPlay 
        width="320"
        height="240"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Main 3D Scene */}
      <ParticleScene config={config} gestureState={gestureState} />

      {/* UI Overlay */}
      <OverlayUI 
        config={config} 
        setConfig={setConfig} 
        gestureState={gestureState}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        cameraActive={cameraActive}
        onRetryCamera={startCamera} // Pass retry function
        cameraError={cameraError}
      />
      
      {/* Camera Preview (Always visible if active, moved to bottom-right on mobile to be less intrusive but visible) */}
      {cameraActive && (
        <div className="absolute top-20 right-6 md:top-20 md:right-6 w-24 h-24 md:w-32 md:h-24 rounded-lg overflow-hidden border border-white/20 opacity-60 hover:opacity-100 transition-opacity z-20 pointer-events-none bg-black/50">
           <video 
             ref={(el) => { if (el && videoRef.current) el.srcObject = videoRef.current.srcObject }} 
             autoPlay 
             muted 
             playsInline
             className="w-full h-full object-cover transform scale-x-[-1]" 
           />
        </div>
      )}
    </div>
  );
};

export default App;