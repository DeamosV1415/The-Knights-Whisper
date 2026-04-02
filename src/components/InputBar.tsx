import { useState, KeyboardEvent } from 'react';

interface InputBarProps {
  onSubmit: (action: string) => void;
  disabled: boolean;
}

export function InputBar({ onSubmit, disabled }: InputBarProps) {
  const [value, setValue] = useState('');
  
  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  return (
    <div 
      className="border-t border-dungeon-borderfaint px-5 py-4 flex items-center gap-3"
      style={{ background: 'rgba(6,4,10,0.8)' }}
    >
      {/* Text Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? 'Waiting for the dungeon master...' : 'What do you do?'}
        className="flex-1 rounded-xl px-4 py-3 text-[14px] font-mono transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
        style={{
          background: '#12101a',
          border: '1px solid #2a2240',
          color: '#d0c4e8',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#5a40a0';
          e.target.style.boxShadow = '0 0 20px rgba(100,70,200,0.15)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#2a2240';
          e.target.style.boxShadow = 'none';
        }}
      />
      
      {/* Send Button */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="px-5 py-3 rounded-xl text-[13px] font-mono transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none flex-shrink-0 cursor-pointer hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #2a1e5a, #3a2e70)',
          border: '1px solid #4a3e80',
          color: '#c0b0e8',
          boxShadow: '0 0 15px rgba(80,50,160,0.2)',
        }}
      >
        Enter ↵
      </button>
    </div>
  );
}
