import React from 'react';

interface HPBarProps {
  userHP: number;
  userName: string;
  mirrorName: string;
}

const HPBar: React.FC<HPBarProps> = ({ userHP, userName, mirrorName }) => {
  const segments = 20;
  const userSegments = Math.round((userHP / 100) * segments);

  return (
    <div className="w-full mb-4 px-2">
      <div className="flex justify-between items-center mb-1 font-arcade text-[8px] text-white">
        <span className="bg-blue-600 px-2 py-0.5 border border-white uppercase">{userName} DEFENSE</span>
        <span className="bg-red-600 px-2 py-0.5 border border-white uppercase">{mirrorName} PROSECUTION</span>
      </div>
      <div className="h-6 w-full bg-black border-[3px] border-white p-[2px] flex">
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
