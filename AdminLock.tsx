import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function AdminLock() {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Auto-focus next
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    // Check if complete
    if (newPin.every(p => p !== '')) {
      const enteredPin = newPin.join('');
      if (enteredPin === '3173') {
        setIsOpen(false);
        setPin(['', '', '', '']);
        navigate('/admin');
      } else {
        setError('Code incorrect');
        setPin(['', '', '', '']);
        document.getElementById('pin-0')?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-2 right-2 opacity-20 hover:opacity-60 bg-transparent border-none cursor-pointer p-2 z-[9999] transition-opacity"
        aria-label="Admin Access"
      >
        <Lock size={16} className="text-gray-500" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl relative">
            <button 
              onClick={() => { setIsOpen(false); setPin(['', '', '', '']); setError(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-6 text-center">Accès Administrateur</h2>
            
            <div className="flex justify-center gap-3 mb-4">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-[#E8620A] focus:outline-none transition-colors"
                />
              ))}
            </div>
            
            {error && <p className="text-red-500 text-center text-sm font-medium">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
