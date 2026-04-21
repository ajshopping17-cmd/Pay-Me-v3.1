import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import jsPDF from 'jspdf';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

export default function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const transaction = location.state?.transaction;
  const [whatsappLink, setWhatsappLink] = useState('https://wa.me/message/56MOPW4EFCR3M1');

  useEffect(() => {
    if (!transaction) {
      navigate('/');
    }

    const fetchConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'admin_config', 'main'));
        if (configDoc.exists() && configDoc.data().whatsappLink) {
          setWhatsappLink(configDoc.data().whatsappLink);
        }
      } catch (error) {
        console.error("Error fetching config", error);
      }
    };
    fetchConfig();
  }, [transaction, navigate]);

  if (!transaction) return null;

  const generateReceipt = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(t.success.receiptTitle, 20, 20);
    doc.setFontSize(12);
    doc.text(t.success.receiptProduct, 20, 35);
    doc.text(t.success.transactionId + ': ' + transaction.reference, 20, 45);
    doc.text(t.success.date + ': ' + new Date().toLocaleDateString(), 20, 55);
    doc.text(t.success.amount + ': ' + transaction.amount + ' ' + transaction.currency, 20, 65);
    doc.text(t.success.status + ': ' + t.success.confirmed, 20, 75);
    doc.text(t.success.payerNumber + ': ' + transaction.phone, 20, 85);
    doc.save('recu-payme-' + transaction.reference + '.pdf');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white relative">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-white">
        <div className="flex flex-col">
          <span className="font-black text-2xl tracking-tighter text-[#1A1A1A] leading-none">PAY-ME</span>
          <span className="text-[8px] font-bold text-gray-400 tracking-[0.2em] uppercase">BY ORANGE BANK</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#1A1A1A]"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </header>
      <div className="h-1.5 w-24 bg-[#1E4D8C] ml-6 mb-8 rounded-full"></div>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-24">
        <div className="bg-white p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] mb-8 border-l-[12px] border-[#1E4D8C]">
          <div className="flex items-center gap-6 mb-10">
            <div className="w-16 h-16 bg-[#F0F7FF] rounded-2xl flex items-center justify-center text-[#1E4D8C] shadow-sm">
              <CheckCircle2 size={36} fill="currentColor" className="text-white" />
            </div>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-[#1E4D8C] w-full rounded-full" />
            </div>
          </div>

          <h1 className="text-4xl font-black text-[#1A1A1A] mb-4 tracking-tighter leading-[0.9] uppercase">
            {t.success.title}
          </h1>
          
          <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">
            {t.success.description}
          </p>

          <div className="bg-[#F9F9F9] rounded-2xl p-8 mb-10 border border-gray-50">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">{t.success.transactionId}</span>
              <span className="text-sm font-black text-[#1A1A1A] tracking-tight">{transaction.reference}</span>
            </div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">{t.success.activationDate}</span>
              <span className="text-sm font-black text-[#1A1A1A] tracking-tight">{new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">{t.success.creditStatus}</span>
              <div className="flex items-center gap-2 text-[#1E4D8C] font-black text-xs uppercase tracking-widest">
                <Shield size={16} fill="currentColor" className="text-[#1E4D8C]" />
                <span>{t.success.active}</span>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">{t.success.repaymentProgress}</span>
              <span className="text-xs font-black text-[#1E4D8C] uppercase tracking-widest">0% {t.success.complete}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-[#1E4D8C] w-[2%] rounded-full" />
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={generateReceipt}
              className="w-full bg-[#E8620A] text-white font-black py-5 px-6 rounded-sm hover:bg-[#d55809] transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-orange-100"
            >
              {t.success.viewReceipt}
            </button>
            
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center bg-white text-[#1A1A1A] border-2 border-gray-100 font-black py-5 px-6 rounded-sm hover:border-gray-200 transition-all uppercase tracking-[0.2em] text-xs"
              >
                Contacter le support
              </a>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center px-6 leading-relaxed font-medium">
          {t.success.whatsappPrompt} <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="font-black text-[#E8620A] underline underline-offset-4 decoration-2">{t.success.whatsappLinkText}</a>
        </p>
      </main>
      
      <footer className="p-10 text-center">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <Shield size={16} />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">SECURE FINANCIAL INSTRUMENT</span>
        </div>
      </footer>
    </div>
  );
}
