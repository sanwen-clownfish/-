import React from 'react';
import { ParticleConfig, ShapeType, GestureState } from '../types';
import { Maximize, Minimize, Heart, Flower, Zap, Users } from 'lucide-react';

interface OverlayUIProps {
  config: ParticleConfig;
  setConfig: React.Dispatch<React.SetStateAction<ParticleConfig>>;
  gestureState: GestureState;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  cameraActive: boolean;
}

const OverlayUI: React.FC<OverlayUIProps> = ({
  config,
  setConfig,
  gestureState,
  onToggleFullscreen,
  isFullscreen,
  cameraActive
}) => {
  
  const handleShapeChange = (shape: ShapeType) => {
    setConfig(prev => ({ ...prev, shape }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, color: e.target.value }));
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 select-none">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
           <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            禅意粒子
          </h1>
          <p className="text-xs text-gray-400 mt-1">
             当前模式: {cameraActive ? (
                <span className={gestureState === 'OPEN' ? "text-green-400 font-mono" : "text-yellow-400 font-mono"}>
                  AI 手势识别 ({gestureState === 'OPEN' ? '张开-扩散' : '握拳-聚合'})
                </span>
             ) : (
                <span className="text-blue-400 font-mono">
                  鼠标/触摸 ({gestureState === 'OPEN' ? '松开-扩散' : '按住-聚合'})
                </span>
             )}
          </p>
        </div>

        <button 
          onClick={onToggleFullscreen}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-white"
          title={isFullscreen ? "退出全屏" : "全屏模式"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-full max-w-3xl mx-auto flex flex-col md:flex-row gap-6 items-center shadow-2xl transition-all hover:bg-black/50">
        
        {/* Model Selector */}
        <div className="flex gap-2 flex-wrap justify-center">
          <ModelBtn 
            active={config.shape === ShapeType.HEART} 
            onClick={() => handleShapeChange(ShapeType.HEART)} 
            icon={<Heart size={18} />} 
            label="爱心" 
          />
          <ModelBtn 
            active={config.shape === ShapeType.FLOWER} 
            onClick={() => handleShapeChange(ShapeType.FLOWER)} 
            icon={<Flower size={18} />} 
            label="花朵" 
          />
          <ModelBtn 
            active={config.shape === ShapeType.BUDDHA} 
            onClick={() => handleShapeChange(ShapeType.BUDDHA)} 
            icon={<Users size={18} />} 
            label="禅定" 
          />
          <ModelBtn 
            active={config.shape === ShapeType.FIREWORKS} 
            onClick={() => handleShapeChange(ShapeType.FIREWORKS)} 
            icon={<Zap size={18} />} 
            label="烟花" 
          />
        </div>

        <div className="h-8 w-px bg-white/20 hidden md:block"></div>

        {/* Color Picker */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-300">粒子颜色</span>
          <div className="relative group">
            <input 
              type="color" 
              value={config.color} 
              onChange={handleColorChange}
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-none p-0 bg-transparent"
              title="点击修改颜色"
            />
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 pointer-events-none group-hover:ring-white/50 transition-all"></div>
          </div>
        </div>

        <div className="h-8 w-px bg-white/20 hidden md:block"></div>

        <div className="text-xs text-gray-400 max-w-[200px] leading-tight text-center md:text-left">
          {cameraActive 
            ? "对着摄像头张开手掌扩散粒子，握拳聚合粒子。" 
            : "未检测到摄像头。长按鼠标或屏幕聚合粒子，松开扩散。"
          }
        </div>

      </div>
    </div>
  );
};

const ModelBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
      active 
        ? 'bg-purple-600/80 text-white shadow-lg shadow-purple-500/30' 
        : 'bg-white/5 text-gray-300 hover:bg-white/10'
    }`}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default OverlayUI;