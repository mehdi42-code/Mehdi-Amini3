import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage, className = '' }) => {
  const [sliderPosition, setSliderPosition] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX;

    if (window.TouchEvent && event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
    } else if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else {
        return;
    }

    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    
    setSliderPosition(percent);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-96 md:h-[500px] overflow-hidden rounded-xl cursor-ew-resize select-none shadow-xl border-2 border-slate-200 ${className}`}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      {/* After Image (Base) */}
      <img 
        src={afterImage} 
        alt="After" 
        className="absolute top-0 left-0 w-full h-full object-cover" 
      />

      {/* Before Image (Clipped) */}
      <div 
        className="absolute top-0 left-0 w-full h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeImage} 
          alt="Before" 
          className="absolute top-0 left-0 w-full h-full max-w-none object-cover"
          style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
        />
        {/* Label */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 text-sm rounded backdrop-blur-sm">
          اصلی
        </div>
      </div>

      {/* Label for After */}
      <div className="absolute bottom-4 right-4 bg-primary/80 text-white px-2 py-1 text-sm rounded backdrop-blur-sm">
        هوش مصنوعی
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg text-primary">
            <MoveHorizontal size={20} />
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;