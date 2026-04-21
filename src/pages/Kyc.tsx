import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Upload, Camera, AlertTriangle, CheckCircle2, FileText, LayoutGrid, Check, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { PayMeLogo } from '../context/Logos';

export default function Kyc() {
  const navigate = useNavigate();
  const [frontId, setFrontId] = useState<File | null>(null);
  const [backId, setBackId] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const { t } = useLanguage();

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const isSubmitEnabled = frontId && backId && selfie && !isUploading && !isAnalyzing;

  useEffect(() => {
    if (isAnalyzing) {
      const duration = 15000; // 15 seconds
      const intervalTime = 50;
      const steps = duration / intervalTime;
      const increment = 100 / steps;

      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsAnalyzing(false);
              setShowModal(true);
            }, 800);
            return 100;
          }
          return Math.min(prev + increment, 100);
        });
      }, intervalTime);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!isSubmitEnabled) return;
    
    setIsUploading(true);
    try {
      // Simulate a realistic upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use mock URLs instead of real ones
      const frontUrl = 'https://placeholder.local/kyc/front.jpg';
      const backUrl = 'https://placeholder.local/kyc/back.jpg';
      const selfieUrl = 'https://placeholder.local/kyc/selfie.jpg';

      sessionStorage.setItem('kycData', JSON.stringify({ frontUrl, backUrl, selfieUrl }));
      
      setIsUploading(false);
      setIsAnalyzing(true);
      setAnalysisProgress(0);
    } catch (error) {
      console.error("Simulation failed", error);
      alert("Une erreur est survenue lors du traitement.");
      setIsUploading(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F9F9F9] relative overflow-x-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-6 bg-[#F9F9F9]">
          <PayMeLogo className="scale-75 origin-left" />
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase">
              <Shield size={14} className="text-[#E8620A]" fill="currentColor" />
              <span>{t.common.secureVerification}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 pt-12">
          
          <h1 className="text-[42px] font-bold text-[#1A1A1A] mb-6 tracking-tight leading-[1.1] whitespace-pre-line">
            {t.kyc.analyzingTitle}
          </h1>
          
          <p className="text-xl text-gray-500 mb-16 leading-relaxed font-medium">
            {t.kyc.analyzingDesc}
          </p>

          {/* Progress Section */}
          <div className="mb-16">
            <div className="flex justify-between items-end mb-5">
              <span className="text-xs font-bold text-[#1A1A1A] tracking-widest uppercase">vérification d'identité</span>
              <span className="text-4xl font-black text-[#E8620A] tracking-tighter">{Math.round(analysisProgress)}%</span>
            </div>
            <div className="h-7 bg-gray-200/50 rounded-full overflow-hidden p-1">
              <div className="h-full bg-black rounded-full relative transition-all duration-300 ease-out" style={{ width: `${analysisProgress}%` }}>
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-[#E8620A] rounded-r-full"></div>
              </div>
            </div>
          </div>

          {/* Analysis Card */}
          <div className="bg-white rounded-[32px] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-16 border border-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-[#F5F5F5] rounded-2xl flex items-center justify-center text-[#E8620A]">
                  <FileText size={36} fill="currentColor" className="text-white" />
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
                  <LayoutGrid size={32} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{t.kyc.analysis}</span>
              </div>
            </div>
          </div>

{/* Progress Section removed */}
          <div className="bg-white border-l-[6px] border-[#C8102E] p-10 rounded-r-2xl flex gap-8 mb-16 shadow-sm">
            <div className="w-12 h-12 bg-[#C8102E] rounded-full flex items-center justify-center text-white shrink-0 mt-1">
              <AlertTriangle size={24} />
            </div>
            <div>
              <span className="font-black text-[#C8102E] block mb-3 text-sm tracking-widest uppercase">{t.eligibility.attention}</span>
              <p className="text-lg text-[#1A1A1A] leading-relaxed font-medium">
                {t.eligibility.warning}
              </p>
            </div>
          </div>
        </main>

        <footer className="px-8 pb-12 flex flex-col items-center gap-8">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center">
              <Check size={16} />
            </div>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{t.common.certifiedSystem}</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest text-center leading-loose">
            © 2024 PAY-ME BY ORANGE BANK. {t.common.allRightsReserved}.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-sm relative pb-24">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-[#1A1A1A]" />
          </button>
          <span className="font-bold text-lg text-[#1A1A1A]">{t.kyc.header}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <PayMeLogo className="scale-50 origin-right" />
        </div>
      </header>

      <div className="h-1.5 w-24 bg-[#E8620A] ml-6 mt-6 mb-8 rounded-full"></div>

      {/* Main Content */}
      <main className="flex-1 px-6">
        <h1 className="text-4xl font-black text-[#1A1A1A] mb-6 tracking-tighter leading-[0.9] uppercase">
          {t.kyc.title}
        </h1>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">
          {t.kyc.description}
        </p>

        {/* Warning Notice */}
        <div className="bg-[#F9F9F9] border-l-[6px] border-[#8B4513] p-8 rounded-r-lg flex gap-6 mb-12 shadow-sm">
          <div className="text-[#8B4513] shrink-0 mt-1">
            <AlertTriangle size={28} fill="currentColor" className="text-white" />
          </div>
          <div>
            <span className="font-black text-[#1A1A1A] block mb-2 text-sm tracking-widest uppercase">{t.kyc.attention}</span>
            <p className="text-base text-gray-600 leading-relaxed font-medium">
              {t.kyc.warning}
            </p>
          </div>
        </div>

        {/* Upload Zones */}
        <div className="space-y-10">
          {/* Face Avant */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-3 block">{t.kyc.frontId}</span>
            <div 
              onClick={() => frontRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${frontId ? 'border-[#E8620A] bg-orange-50/30' : 'border-gray-100 hover:border-[#E8620A] hover:bg-gray-50'}`}
            >
              <input type="file" ref={frontRef} className="hidden" accept="image/*" onChange={handleFileChange(setFrontId)} />
              <div className="w-16 h-16 bg-orange-100 text-[#E8620A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Upload size={28} />
              </div>
              <p className="font-bold text-[#1A1A1A] mb-2 text-lg tracking-tight">{t.kyc.frontIdDesc}</p>
              <p className="text-sm text-gray-400 font-medium">{frontId ? frontId.name : t.kyc.readable}</p>
            </div>
          </div>

          {/* Face Arrière */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-3 block">{t.kyc.backId}</span>
            <div 
              onClick={() => backRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${backId ? 'border-[#E8620A] bg-orange-50/30' : 'border-gray-100 hover:border-[#E8620A] hover:bg-gray-50'}`}
            >
              <input type="file" ref={backRef} className="hidden" accept="image/*" onChange={handleFileChange(setBackId)} />
              <div className="w-16 h-16 bg-orange-100 text-[#E8620A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Upload size={28} />
              </div>
              <p className="font-bold text-[#1A1A1A] mb-2 text-lg tracking-tight">{t.kyc.backIdDesc}</p>
              <p className="text-sm text-gray-400 font-medium">{backId ? backId.name : t.kyc.readable}</p>
            </div>
          </div>

          {/* Selfie */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-3 block">{t.kyc.selfie}</span>
            <div 
              onClick={() => selfieRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${selfie ? 'border-[#E8620A] bg-orange-50/30' : 'border-gray-100 hover:border-[#E8620A] hover:bg-gray-50'}`}
            >
              <input type="file" ref={selfieRef} className="hidden" accept="image/*" capture="user" onChange={handleFileChange(setSelfie)} />
              <div className="w-16 h-16 bg-orange-100 text-[#E8620A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Camera size={28} />
              </div>
              <p className="font-bold text-[#1A1A1A] mb-2 text-lg tracking-tight">{t.kyc.selfieDesc}</p>
              <p className="text-sm text-gray-400 font-medium">{selfie ? selfie.name : t.kyc.wellLit}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 max-w-md mx-auto z-10">
        <button
          onClick={handleSubmit}
          disabled={!isSubmitEnabled}
          className={`w-full font-black py-5 px-4 rounded-sm transition-all uppercase tracking-[0.2em] text-sm shadow-xl ${
            isSubmitEnabled 
              ? 'bg-[#E8620A] text-white hover:bg-[#d55809] shadow-orange-200' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
          }`}
        >
          {isUploading ? t.kyc.uploading : t.common.submit}
        </button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-10 max-w-sm w-full shadow-2xl border-t-[12px] border-[#1E4D8C]"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#F0F7FF] rounded-full flex items-center justify-center text-[#1E4D8C] mb-8">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-black text-[#1A1A1A] mb-4 tracking-tight uppercase">{t.kyc.successTitle}</h2>
                <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">
                  {t.kyc.successDesc}
                </p>
                <button 
                  onClick={() => navigate('/payment')}
                  className="w-full bg-[#1A1A1A] text-white font-black py-5 px-4 rounded-sm hover:bg-black transition-colors uppercase tracking-[0.2em] text-xs"
                >
                  {t.kyc.makePayment}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
