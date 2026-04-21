import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

const COUNTRIES = [
  { id: 'cm', name: 'CAMEROUN', currency: 'XAF', region: 'Afrique Centrale', code: '+237', rate: 1 },
  { id: 'sn', name: 'SÉNÉGAL', currency: 'XOF', region: 'Afrique de l\'Ouest', code: '+221', rate: 1 },
  { id: 'ci', name: 'CÔTE D\'IVOIRE', currency: 'XOF', region: 'Afrique de l\'Ouest', code: '+225', rate: 1 },
  { id: 'bf', name: 'BURKINA FASO', currency: 'XOF', region: 'Afrique de l\'Ouest', code: '+226', rate: 1 },
  { id: 'ml', name: 'MALI', currency: 'XOF', region: 'Afrique de l\'Ouest', code: '+223', rate: 1 },
  { id: 'bj', name: 'BÉNIN', currency: 'XOF', region: 'Afrique de l\'Ouest', code: '+229', rate: 1 },
];

const BASE_AMOUNTS = [5600, 9750, 14950, 19900, 79999];

export default function Payment() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [baseAmount, setBaseAmount] = useState(BASE_AMOUNTS[0]);
  const [isAmountDropdownOpen, setIsAmountDropdownOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const displayAmount = Math.round(baseAmount / selectedCountry.rate);

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 1;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isProcessing]);

  const handlePayment = async () => {
    if (!phone || phone.length < 8) return;
    
    setIsProcessing(true);
    setError('');

    try {
      let userId = localStorage.getItem('sessionId');
      if (!userId) {
        userId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('sessionId', userId);
      }

      const kycDataStr = sessionStorage.getItem('kycData');
      const kycData = kycDataStr ? JSON.parse(kycDataStr) : {};

      const response = await fetch('/api/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `${selectedCountry.code}${phone}`,
          amount: displayAmount,
          currency: selectedCountry.currency,
          country: selectedCountry.name,
          countryCode: selectedCountry.id,
          email: 'anonymous@pay-me.local',
          userId: userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      const reference = data.reference;
      const paymentInfo = data.payment;

      // Save to Firestore
      const transactionData: any = {
        reference: reference,
        gatewayRef: paymentInfo.gatewayRef,
        provider: paymentInfo.provider,
        phone: `${selectedCountry.code}${phone}`,
        amount: displayAmount,
        currency: selectedCountry.currency,
        country: selectedCountry.name,
        status: 'pending',
        createdAt: new Date(),
        userId: userId,
      };

      await setDoc(doc(db, 'transactions', reference), transactionData);

      // Start polling for payment status
      let attempts = 0;
      const maxAttempts = 40; // 2 minutes max (40 * 3s)

      const pollStatus = async () => {
        try {
          const queryParams = new URLSearchParams({
             provider: paymentInfo.provider,
             gatewayRef: paymentInfo.gatewayRef
          });
          const statusRes = await fetch(`/api/payment-status/${reference}?${queryParams.toString()}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'complete' || statusData.status === 'successful' || statusData.status === 'success') {
            await setDoc(doc(db, 'transactions', reference), { status: 'success', completedAt: new Date() }, { merge: true });
            setIsProcessing(false);
            navigate('/success', { state: { transaction: statusData.transaction || data.payment } });
            return;
          } else if (statusData.status === 'failed' || statusData.status === 'canceled') {
            await setDoc(doc(db, 'transactions', reference), { status: 'failed', failReason: 'Paiement échoué ou annulé' }, { merge: true });
            setIsProcessing(false);
            setError('Le paiement a échoué ou a été annulé par l\'utilisateur.');
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            setIsProcessing(false);
            setError('Délai d\'attente dépassé. Veuillez vérifier votre téléphone.');
            return;
          }

          setTimeout(pollStatus, 3000);
        } catch (err) {
          console.error("Polling error", err);
          attempts++;
          if (attempts >= maxAttempts) {
            setIsProcessing(false);
            setError('Erreur de connexion lors de la vérification du paiement.');
            return;
          }
          setTimeout(pollStatus, 3000);
        }
      };

      setTimeout(pollStatus, 3000);

    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setError(err.message || 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white relative pb-24">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-white">
        <div className="flex flex-col">
          <span className="font-black text-2xl tracking-tighter text-[#1A1A1A] leading-none">PAY-ME</span>
          <span className="text-[8px] font-bold text-gray-400 tracking-[0.2em] uppercase">BY ORANGE BANK</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <div className="w-12 h-12 bg-[#E8620A] rounded-full flex items-center justify-center shadow-lg shadow-orange-100">
            <div className="w-5 h-5 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
      <div className="h-1.5 w-24 bg-[#E8620A] ml-6 mb-8 rounded-full"></div>

      {/* Main Content */}
      <main className="flex-1 px-6">
        <h1 className="text-4xl font-black text-[#1A1A1A] mb-2 tracking-tighter uppercase">
          {t.payment.title}
        </h1>
        <p className="text-gray-500 text-lg mb-8 leading-relaxed font-medium">
          {t.payment.description}
        </p>
        <p className="text-gray-400 text-xs mb-8 leading-relaxed italic font-medium">
          {t.payment.mention}
        </p>

        {/* Country Selection */}
        <div className="mb-10">
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4 block">{t.payment.selectCountry}</span>
          <div className="grid grid-cols-2 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            {COUNTRIES.map((country) => (
              <div 
                key={country.id}
                onClick={() => setSelectedCountry(country)}
                className={`p-5 bg-white cursor-pointer transition-all relative ${selectedCountry.id === country.id ? 'border-l-[6px] border-l-[#E8620A] bg-orange-50/10' : 'border-l-[6px] border-l-transparent hover:bg-gray-50'}`}
              >
                <div className="font-black text-[#1A1A1A] text-sm mb-1 tracking-tight">{country.name}</div>
                <div className="text-[10px] text-gray-400 font-bold tracking-wider">{country.currency} ({country.region})</div>
              </div>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-10 relative">
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4 block">{t.payment.selectAmount}</span>
          <button 
            type="button"
            onClick={() => setIsAmountDropdownOpen(!isAmountDropdownOpen)}
            className="w-full bg-[#F9F9F9] rounded-xl p-6 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-all border border-gray-50 shadow-sm"
          >
            <span className="text-3xl font-black text-[#1A1A1A] tracking-tighter">{displayAmount} {selectedCountry.currency}</span>
            {isAmountDropdownOpen ? <ChevronUp size={28} className="text-[#E8620A]" /> : <ChevronDown size={28} className="text-[#E8620A]" />}
          </button>
          
          <AnimatePresence>
            {isAmountDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                {BASE_AMOUNTS.map((amt) => {
                  const dAmt = Math.round(amt / selectedCountry.rate);
                  return (
                    <button 
                      key={amt}
                      type="button"
                      onClick={() => {
                        setBaseAmount(amt);
                        setIsAmountDropdownOpen(false);
                      }}
                      className={`w-full text-left p-6 hover:bg-orange-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 flex justify-between items-center ${baseAmount === amt ? 'bg-orange-50/50' : ''}`}
                    >
                      <span className={`text-xl font-black tracking-tight ${baseAmount === amt ? 'text-[#E8620A]' : 'text-[#1A1A1A]'}`}>
                        {dAmt} {selectedCountry.currency}
                      </span>
                      {baseAmount === amt && <div className="w-3 h-3 bg-[#E8620A] rounded-full shadow-[0_0_10px_rgba(232,98,10,0.5)]"></div>}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phone Number */}
        <div className="mb-10">
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4 block">{t.payment.orangeNumber}</span>
          <div className="bg-[#F9F9F9] rounded-xl p-6 flex items-center gap-4 border border-gray-50 shadow-sm focus-within:border-[#E8620A] transition-all">
            <span className="text-xl font-black text-[#1A1A1A] tracking-tight">{selectedCountry.code}</span>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="6XX XXX XXX"
              className="bg-transparent border-none outline-none text-xl font-bold text-[#1A1A1A] w-full placeholder-gray-300 tracking-wider"
            />
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-[#F0F7FF] p-8 rounded-2xl flex gap-6 items-start border border-blue-50 mb-10 shadow-sm">
          <div className="bg-[#1E4D8C] text-white p-2 rounded-xl shrink-0 mt-1 shadow-md shadow-blue-100">
            <Shield size={20} fill="currentColor" className="text-white" />
          </div>
          <div>
            <span className="font-black text-[#1E4D8C] block mb-2 text-sm tracking-widest uppercase">{t.payment.secureTitle}</span>
            <p className="text-base text-gray-600 leading-relaxed font-medium">
              {t.payment.secureDesc}
            </p>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-50 max-w-md mx-auto z-10">
        <button
          onClick={handlePayment}
          disabled={!phone || phone.length < 8 || isProcessing}
          className={`w-full font-black py-5 px-8 rounded-sm transition-all uppercase tracking-[0.15em] text-sm flex justify-between items-center shadow-xl ${
            phone && phone.length >= 8 && !isProcessing
              ? 'bg-[#E8620A] text-white hover:bg-[#d55809] shadow-orange-200' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
          }`}
        >
          <span>{t.payment.payNowBtn}</span>
          <div className="flex items-center gap-3">
            <span className="font-black">{displayAmount} {selectedCountry.currency}</span>
            <ArrowRight size={20} strokeWidth={3} />
          </div>
        </button>
      </div>

      {/* Processing Modal */}
      <AnimatePresence>
        {isProcessing && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl border border-gray-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 mb-8">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-gray-100 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"></circle>
                    <motion.circle 
                      className="text-[#1E4D8C] stroke-current" 
                      strokeWidth="10" 
                      strokeLinecap="round" 
                      cx="50" cy="50" r="40" 
                      fill="transparent" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * progress) / 100}
                      transform="rotate(-90 50 50)"
                    ></motion.circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[#1E4D8C]">
                    <Lock size={32} fill="currentColor" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-black text-[#1A1A1A] mb-4 tracking-tighter uppercase">{t.payment.processingTitle}</h2>
                <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">
                  {t.payment.processingDesc}
                  <br/><br/>
                  <span className="font-black text-[#E8620A] uppercase tracking-widest text-xs">{t.payment.pinPrompt}</span>
                </p>
                
                <div className="w-full mb-10">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">{t.payment.statusEncrypting}</span>
                    <span className="text-sm font-black text-[#1A1A1A]">{progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-[#1E4D8C] rounded-full transition-all duration-300 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[#1E4D8C] text-[10px] font-bold tracking-[0.2em] uppercase">
                  <Shield size={16} fill="currentColor" className="text-[#1E4D8C]" />
                  <span>{t.payment.bankGrade}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {error && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">{t.payment.failedTitle}</h2>
                <p className="text-gray-600 text-sm mb-8 leading-relaxed">
                  {error === 'solde insuffisant' ? t.payment.insufficientBalance : error}
                </p>
                <button 
                  onClick={() => setError('')}
                  className="w-full bg-[#1A1A1A] text-white font-bold py-3.5 px-4 rounded-lg hover:bg-black transition-colors uppercase tracking-wide text-sm"
                >
                  {t.common.retry}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
