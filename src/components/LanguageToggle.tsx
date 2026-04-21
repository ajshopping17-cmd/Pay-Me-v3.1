import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 transition-colors text-xs font-bold text-gray-600"
    >
      <Globe size={14} className="text-[#E8620A]" />
      <span>{language === 'fr' ? 'EN' : 'FR'}</span>
    </button>
  );
}
