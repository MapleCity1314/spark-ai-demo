
import React from 'react';

interface HPBarProps {
  userHP: number;
  userName: string;
  mirrorName: string;
}

const HPBar: React.FC<HPBarProps> = ({ userHP, userName, mirrorName }) => {
  const segments = 20; // 20 segments for retro feel
  const userSegments = Math.round((userHP / 100) * segments);

  return (
    <div className="absolute top-2 left-0 right-0 z-30 px-4">
      <div className="flex justify-between items-center mb-1 font-arcade text-[8px] text-white">
        <span className="bg-blue-600 px-1 border border-white">DEFENSE</span>
        <span className="bg-red-600 px-1 border border-white">PROSECUTION</span>
      </div>
      <div className="h-6 w-full bg-black border-[3px] border-white p-[2px] flex">
        {/* Render segments */}
        {[...Array(segments)].map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 mx-[1px] transition-all duration-300 ${
              i < userSegments ? 'bg-blue-400' : 'bg-red-500'
            } ${i === userSegments - 1 || i === userSegments ? 'animate-pulse bg-white' : ''}`}
          >
            <div className="h-1 w-full bg-white/30"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HPBar;
