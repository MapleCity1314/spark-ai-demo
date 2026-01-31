import React from 'react';

interface PixelCharacterProps {
  type?: 'user' | 'mirror';
  className?: string;
}

const PixelCharacter: React.FC<PixelCharacterProps> = ({ type = 'user', className }) => (
  <div className={`pixel-sprite floating ${className || ''}`.trim()}>
    <div
      className={`sprite-headband ${
        type === 'mirror' ? 'bg-[#331111] border-b border-red-900' : 'bg-[#ff4444]'
      }`}
    ></div>
    <div className={`sprite-face ${type === 'mirror' ? 'bg-[#8c6b55]' : 'bg-[#ffccaa]'}`}>
      <div
        className={`sprite-eye left ${
          type === 'mirror'
            ? 'bg-[#ff3333] shadow-[0_0_8px_rgba(255,0,0,0.8)]'
            : 'bg-black'
        }`}
      ></div>
      <div
        className={`sprite-eye right ${
          type === 'mirror'
            ? 'bg-[#ff3333] shadow-[0_0_8px_rgba(255,0,0,0.8)]'
            : 'bg-black'
        }`}
      ></div>
      <div className={`sprite-mouth ${type === 'mirror' ? 'h-[2px] bg-[#4a1a1a]' : 'bg-black'}`}></div>
    </div>
    <div
      className={`sprite-body ${
        type === 'mirror' ? 'bg-[#4a1a1a] border-2 border-[#2a0a0a]' : 'bg-[#3366ff] border-2 border-[#1a3388]'
      }`}
    ></div>
  </div>
);

export default PixelCharacter;
