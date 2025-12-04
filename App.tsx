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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef(false);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err) {
        console.warn("无法访问摄像头，已切换至鼠标交互模式:", err);
        setCameraActive(false);
        // Fallback to mouse mode automatically
      }
    };

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

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
          // Draw video frame to hidden canvas
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert to Base64
          const base64Image = canvas.toDataURL('image/jpeg', 0.5);

          // Send to Gemini
          const detectedState = await analyzeGesture(base64Image);
          setGestureState(detectedState);
        }
      } catch (error) {
        console.error("手势分析失败:", error);
      } finally {
        processingRef.current = false;
      }
    };

    // Run analysis every 600ms to balance responsiveness and API quota
    const intervalId = setInterval(captureAndAnalyze, 600);

    return () => clearInterval(intervalId);
  }, [cameraActive]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
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
      onMouseLeave={handleInteractionEnd} // Reset if mouse leaves window
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
    >
      {/* Hidden elements for processing */}
      <video ref={videoRef} className="hidden" muted playsInline />
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
      />
      
      {/* Camera Preview (Only visible if camera is active) */}
      {cameraActive && (
        <div className="absolute top-20 right-6 w-32 h-24 rounded-lg overflow-hidden border border-white/20 opacity-30 hover:opacity-100 transition-opacity z-20 pointer-events-none hidden md:block">
           <video 
             ref={(el) => { if (el && videoRef.current) el.srcObject = videoRef.current.srcObject }} 
             autoPlay 
             muted 
             className="w-full h-full object-cover transform scale-x-[-1]" 
           />
        </div>
      )}
    </div>
  );
};

export default App;