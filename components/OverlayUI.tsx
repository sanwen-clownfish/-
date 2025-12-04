import React from 'react';
import { ParticleConfig, ShapeType, GestureState } from '../types';
import { Maximize, Minimize, Heart, Flower, Zap, Users, Camera, RefreshCw } from 'lucide-react';

interface OverlayUIProps {
  config: ParticleConfig;
  setConfig: React.Dispatch<React.SetStateAction<ParticleConfig>>;
  gestureState: GestureState;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  cameraActive: boolean;
  onRetryCamera: () => void;
  cameraError: string | null;
}

const OverlayUI: React.FC<OverlayUIProps> = ({
  config,
  setConfig,
  gestureState,
  onToggleFullscreen,
  isFullscreen,
  cameraActive,
  onRetryCamera,
  cameraError
}) => {
  
  const handleShapeChange = (shape: ShapeType) => {
    setConfig(prev => ({ ...prev, shape }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, color: e.target.value }));
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6 select-none">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
           <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            禅意粒子
          </h1>
          <p className="text-[10px] md:text-xs text-gray-400 mt-1 flex flex-col md:flex-row md:items-center gap-1">
             <span className="opacity-70">当前状态:</span>
             {cameraActive ? (
                <span className={`font-mono flex items-center gap-1 ${gestureState === 'OPEN' ? "text-green-400" : "text-yellow-400"}`}>
                  <span className={`w-2 h-2 rounded-full ${gestureState === 'OPEN' ? "bg-green-400" : "bg-yellow-400"}`}></span>
                  AI识别: {gestureState === 'OPEN' ? '张开(扩散)' : '握拳(聚合)'}
                </span>
             ) : (
                <span className="text-blue-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  触控模式: {gestureState === 'OPEN' ? '松开(扩散)' : '按住(聚合)'}
                </span>
             )}
          </p>
        </div>

        <div className="flex gap-2">
            {!cameraActive && (
                <button 
                onClick={onRetryCamera}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-white flex items-center gap-2"
                title={cameraError || "开启摄像头"}
                >
                <Camera size={20} />
                <span className="text-xs hidden md:inline">开启摄像头</span>
                </button>
            )}
            <button 
                onClick={onToggleFullscreen}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-white"
                title={isFullscreen ? "退出全屏" : "全屏模式"}
            >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
        </div>
      </div>

      {/* Error Toast */}
      {cameraError && (
          <div className="absolute top-20 left-4 right-4 md:left-auto md:right-auto md:w-96 bg-red-500/80 backdrop-blur-md text-white text-xs p-3 rounded-lg border border-red-400/50 pointer-events-auto flex items-center justify-between">
              <span>{cameraError}</span>
              <button onClick={onRetryCamera} className="ml-2 p-1 hover:bg-white/20 rounded">
                  <RefreshCw size={14} />
              </button>
          </div>
      )}

      {/* Bottom Controls */}
      <div className="pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 w-full max-w-3xl mx-auto flex flex-col gap-4 shadow-2xl transition-all">
        
        {/* Mobile: Split controls into rows for better fit */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-between">
            
            {/* Model Selector */}
            <div className="flex gap-2 flex-wrap justify-center w-full md:w-auto">
            <ModelBtn 
                active={config.shape === ShapeType.HEART} 
                onClick={() => handleShapeChange(ShapeType.HEART)} 
                icon={<Heart size={16} />} 
                label="爱心" 
            />
            <ModelBtn 
                active={config.shape === ShapeType.FLOWER} 
                onClick={() => handleShapeChange(ShapeType.FLOWER)} 
                icon={<Flower size={16} />} 
                label="花朵" 
            />
            <ModelBtn 
                active={config.shape === ShapeType.BUDDHA} 
                onClick={() => handleShapeChange(ShapeType.BUDDHA)} 
                icon={<Users size={16} />} 
                label="禅定" 
            />
            <ModelBtn 
                active={config.shape === ShapeType.FIREWORKS} 
                onClick={() => handleShapeChange(ShapeType.FIREWORKS)} 
                icon={<Zap size={16} />} 
                label="烟花" 
            />
            </div>

            <div className="h-px w-full bg-white/10 md:hidden"></div>
            <div className="h-8 w-px bg-white/20 hidden md:block"></div>

            <div className="flex items-center justify-between w-full md:w-auto gap-4">
                {/* Color Picker */}
                <div className="flex items-center gap-3">
                    <span className="text-xs md:text-sm font-medium text-gray-300">颜色</span>
                    <div className="relative group">
                        <input 
                        type="color" 
                        value={config.color} 
                        onChange={handleColorChange}
                        className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden cursor-pointer border-none p-0 bg-transparent"
                        title="点击修改颜色"
                        />
                        <div className="absolute inset-0 rounded-full ring-2 ring-white/20 pointer-events-none group-hover:ring-white/50 transition-all"></div>
                    </div>
                </div>

                {/* Instructions Text */}
                <div className="text-[10px] md:text-xs text-gray-400 max-w-[150px] md:max-w-[200px] leading-tight text-right md:text-left">
                {cameraActive 
                    ? "请对摄像头：张手扩散，握拳聚合" 
                    : "长按屏幕聚合，松开扩散"
                }
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

const ModelBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all duration-300 flex-1 md:flex-none justify-center ${
      active 
        ? 'bg-purple-600/80 text-white shadow-lg shadow-purple-500/30' 
        : 'bg-white/5 text-gray-300 hover:bg-white/10'
    }`}
  >
    {icon}
    <span className="text-xs md:text-sm font-medium whitespace-nowrap">{label}</span>
  </button>
);

export default OverlayUI;