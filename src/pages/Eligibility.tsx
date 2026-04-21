import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { PayMeLogo } from '../context/Logos';

export default function Eligibility() {
  const [progress, setProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowModal(true);
          return 100;
        }
        return prev + (100 / 25); // ~4% per second for 25 seconds
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F9F9F9] relative overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-end p-6 bg-[#F9F9F9]">
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase">
            <Shield size={14} className="text-[#E8620A]" fill="currentColor" />
            <span>{t.common.secureVerification}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 pt-4">
        <div className="mb-10 flex flex-col gap-6">
          <PayMeLogo />
        </div>

        <h1 className="text-[42px] font-bold text-[#1A1A1A] mb-6 tracking-tight leading-[1.1] whitespace-pre-line">
          {t.eligibility.title}
        </h1>
        
        <p className="text-xl text-gray-500 mb-16 leading-relaxed font-medium">
          {t.eligibility.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-16">
          <div className="flex justify-between items-end mb-5">
            <span className="text-xs font-bold text-[#1A1A1A] tracking-widest uppercase">{t.eligibility.analyzing}</span>
            <span className="text-4xl font-black text-[#E8620A] tracking-tighter">{Math.min(100, Math.floor(progress))}%</span>
          </div>
          <div className="h-7 bg-gray-200/50 rounded-full overflow-hidden p-1">
            <div 
              className="h-full bg-black rounded-full relative transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-[#E8620A] rounded-r-full"></div>
            </div>
          </div>
        </div>

        {/* Animation Area */}
        <div className="bg-white rounded-[32px] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-16 border border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-[#F5F5F5] rounded-2xl flex items-center justify-center text-gray-200">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{t.kyc.yourData}</span>
            </div>
            
            <div className="flex-1 px-4 relative flex items-center">
              <div className="h-[2px] w-full bg-gray-100"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-[#E8620A] rounded-full shadow-[0_0_10px_rgba(232,98,10,0.5)]"></div>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-200">
                  <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center text-white">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{t.kyc.analysis}</span>
            </div>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="bg-white border-l-[6px] border-[#C8102E] p-8 rounded-r-2xl flex gap-6 mb-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-12 h-12 bg-[#C8102E] rounded-full flex items-center justify-center text-white shrink-0 mt-1">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="font-black text-[#C8102E] block mb-3 text-sm tracking-widest uppercase">{t.eligibility.attention}</span>
            <p className="text-base text-[#1A1A1A] leading-relaxed font-medium">
              {t.eligibility.warning}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 pb-12 flex flex-col items-center gap-8">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center">
            <Shield size={16} />
          </div>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{t.common.certifiedSystem}</span>
        </div>
        <p className="text-[10px] font-bold text-gray-400 tracking-widest text-center leading-loose">
          © 2024 PAY-ME BY ORANGE BANK. {t.common.allRightsReserved}.
        </p>
      </footer>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-10 max-w-sm w-full shadow-2xl border-t-[12px] border-[#E8620A]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-[#E8620A] mb-8">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-[#1A1A1A] mb-4 tracking-tight uppercase">{t.eligibility.confirmedTitle}</h2>
              <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">
                {t.eligibility.confirmedDesc}
              </p>
              <button 
                onClick={() => navigate('/kyc')}
                className="w-full bg-[#E8620A] text-white font-black py-5 px-4 rounded-sm hover:bg-[#d55809] transition-colors uppercase tracking-widest text-sm shadow-lg shadow-orange-200"
              >
                {t.common.continue}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
