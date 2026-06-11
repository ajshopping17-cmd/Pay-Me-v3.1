import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Shield, Download, MessageSquare, ArrowLeft, FileText, Smartphone, Calendar, BadgeCheck, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { PayMeLogo } from '../context/Logos';

export default function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [whatsappLink, setWhatsappLink] = useState('https://wa.me/message/56MOPW4EFCR3M1');

  // Handle transaction persistence to avoid losing data on page refresh
  const [transaction, setTransaction] = useState<any>(() => {
    if (location.state?.transaction) {
      sessionStorage.setItem('lastSuccessTransaction', JSON.stringify(location.state.transaction));
      return location.state.transaction;
    }
    const stored = sessionStorage.getItem('lastSuccessTransaction');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (!transaction) {
      navigate('/');
      return;
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

  // Map fee amount to corresponding TikTak+ credit details
  const getCreditDetails = (amountPaid: number, currency: string) => {
    if (amountPaid <= 6000) {
      return {
        creditAmount: `25 000 ${currency}`,
        fee: `${amountPaid} ${currency}`,
        duration: language === 'fr' ? "3 Mois" : "3 Months",
        netAmount: `25 000 ${currency}`,
        repaymentMonthly: `8 333 ${currency} / ${language === 'fr' ? 'Mois' : 'Month'}`,
        apr: "0.00%",
        commission: `0 ${currency}`,
      };
    } else if (amountPaid <= 11000) {
      return {
        creditAmount: `50 000 ${currency}`,
        fee: `${amountPaid} ${currency}`,
        duration: language === 'fr' ? "3 Mois" : "3 Months",
        netAmount: `50 000 ${currency}`,
        repaymentMonthly: `16 666 ${currency} / ${language === 'fr' ? 'Mois' : 'Month'}`,
        apr: "0.00%",
        commission: `0 ${currency}`,
      };
    } else if (amountPaid <= 16000) {
      return {
        creditAmount: `100 000 ${currency}`,
        fee: `${amountPaid} ${currency}`,
        duration: language === 'fr' ? "6 Mois" : "6 Months",
        netAmount: `100 000 ${currency}`,
        repaymentMonthly: `16 666 ${currency} / ${language === 'fr' ? 'Mois' : 'Month'}`,
        apr: "0.00%",
        commission: `0 ${currency}`,
      };
    } else if (amountPaid <= 25000) {
      return {
        creditAmount: `150 000 ${currency}`,
        fee: `${amountPaid} ${currency}`,
        duration: language === 'fr' ? "6 Mois" : "6 Months",
        netAmount: `150 000 ${currency}`,
        repaymentMonthly: `25 000 ${currency} / ${language === 'fr' ? 'Mois' : 'Month'}`,
        apr: "0.00%",
        commission: `0 ${currency}`,
      };
    } else {
      return {
        creditAmount: `500 000 ${currency}`,
        fee: `${amountPaid} ${currency}`,
        duration: language === 'fr' ? "12 Mois" : "12 Months",
        netAmount: `500 000 ${currency}`,
        repaymentMonthly: `41 666 ${currency} / ${language === 'fr' ? 'Mois' : 'Month'}`,
        apr: "0.00%",
        commission: `0 ${currency}`,
      };
    }
  };

  const details = getCreditDetails(transaction.amount, transaction.currency);

  const generateReceipt = () => {
    const docPdf = new jsPDF();
    const dateFormatted = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Outer Border
    docPdf.setDrawColor(232, 98, 10); // Code Orange
    docPdf.setLineWidth(1.5);
    docPdf.rect(10, 10, 190, 277);

    // Decorative Orange Bank Header Strip
    docPdf.setFillColor(30, 77, 140); // Bank blue
    docPdf.rect(11, 11, 188, 12, 'F');
    
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(10);
    docPdf.setTextColor(255, 255, 255);
    docPdf.text("PAY-ME BY ORANGE BANK - SECURED TRANSACTION RECEIPT", 15, 19);

    // Main Logo & Header
    docPdf.setTextColor(30, 77, 140); // Bank Blue
    docPdf.setFontSize(26);
    docPdf.text("PAY-ME", 20, 42);
    
    docPdf.setTextColor(150, 150, 150);
    docPdf.setFontSize(8);
    docPdf.text("BY ORANGE BANK", 20, 47);

    // Header Right: Invoice Details
    docPdf.setTextColor(80, 80, 80);
    docPdf.setFontSize(8);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`${t.success.transactionId.toUpperCase()}: ${transaction.reference}`, 110, 36);
    docPdf.text(`${t.success.activationDate.toUpperCase()}: ${dateFormatted}`, 110, 42);
    docPdf.text(`SERVICE GATEWAY: MESOMB CO`, 110, 48);

    // Separator line
    docPdf.setDrawColor(220, 220, 220);
    docPdf.setLineWidth(0.5);
    docPdf.line(20, 55, 190, 55);

    // Title
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(16);
    docPdf.setTextColor(232, 98, 10); // Orange
    docPdf.text(language === 'fr' ? "REÇU OFFICIEL D'OFFRE DE CRÉDIT TIKTAK+" : "OFFICIAL TIKTAK+ CREDIT RECEIPT", 20, 68);

    // Subtitle
    docPdf.setFont("helvetica", "italic");
    docPdf.setFontSize(9);
    docPdf.setTextColor(120, 120, 120);
    docPdf.text(language === 'fr' 
      ? "Ce document confirme l'activation de votre ligne de crédit après acquittement des frais."
      : "This document confirms your credit line activation upon payment of subscription fees.", 
      20, 74
    );

    // Draw Detailed Table / Grid
    docPdf.setFillColor(250, 250, 250);
    docPdf.rect(20, 83, 170, 128, 'F');
    docPdf.setDrawColor(230, 230, 230);
    docPdf.rect(20, 83, 170, 128, 'S');

    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(11);
    docPdf.setTextColor(30, 77, 140);
    docPdf.text(language === 'fr' ? "DÉTAILS DU COMPTE ET DU CRÉDIT" : "CREDIT & ACCOUNT DETAILS", 25, 92);
    docPdf.line(25, 95, 185, 95);

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(10);
    docPdf.setTextColor(60, 60, 60);

    const rows = [
      [language === 'fr' ? "Montant de crédit sollicité" : "Requested credit line", details.creditAmount],
      [language === 'fr' ? "Frais de souscription payés" : "Subscription fees paid", details.fee],
      [language === 'fr' ? "Remboursement mensuel" : "Monthly repayment", details.repaymentMonthly],
      [language === 'fr' ? "Durée de remboursement" : "Repayment duration", details.duration],
      [language === 'fr' ? "Statut du crédit" : "Credit account status", language === 'fr' ? "ACTIF (TRANSFERT ET DÉCAISSEMENT)" : "ACTIVE (DISBURSEMENT TRANSFERRED)"],
      [language === 'fr' ? "Numéro bénéficiaire Orange" : "Beneficiary Orange number", transaction.phone || "N/A"],
      [language === 'fr' ? "Référence transaction" : "Transaction referenece", transaction.reference],
      [language === 'fr' ? "Autorisation de la banque" : "Orange Bank approval", transaction.gatewayRef || "N/A"],
    ];

    let yOffset = 105;
    rows.forEach(([label, val]) => {
      docPdf.setFont("helvetica", "bold");
      docPdf.text(label, 25, yOffset);
      docPdf.setFont("helvetica", "normal");
      docPdf.text(val, 115, yOffset);
      
      // dotted line helper
      docPdf.setDrawColor(240, 240, 240);
      docPdf.line(25, yOffset + 3, 185, yOffset + 3);
      yOffset += 11;
    });

    // Repayment Progress Box (decorative card inside PDF)
    docPdf.setFillColor(240, 247, 255);
    docPdf.rect(20, 218, 170, 32, 'F');
    docPdf.setDrawColor(30, 77, 140);
    docPdf.rect(20, 218, 170, 32, 'S');

    docPdf.setTextColor(30, 77, 140);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(10);
    docPdf.text(language === 'fr' ? "IMPORTANT : DÉBUT DU TRANSFERT TIKTAK+" : "IMPORTANT: TIKTAK+ DISBURSEMENT START", 25, 226);
    
    docPdf.setTextColor(80, 80, 80);
    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(8.5);
    
    const noteTextFr = "Félicitations ! Votre paiement a été reçu. Le transfert de vos fonds de crédit a été initié et commencera à arriver sur votre compte Orange Money dans environ 15 minutes. Veuillez conserver ce reçu et cliquer sur le bouton d'assistance WhatsApp pour finaliser l'enregistrement.";
    const noteTextEn = "Congratulations! Your payment was received. Your credit funds transfer has been initiated and will arrive in your Orange Money account in approximately 15 minutes. Please keep this receipt and click the WhatsApp support button to complete registration.";
    
    const splitNote = docPdf.splitTextToSize(language === 'fr' ? noteTextFr : noteTextEn, 160);
    docPdf.text(splitNote, 25, 233);

    // Stamp / Authorized Signature
    docPdf.setTextColor(180, 180, 180);
    docPdf.setFontSize(7);
    docPdf.text("DOCUMENT GÉNÉRÉ ÉLECTRONIQUEMENT - PAY-ME BY ORANGE BANK - APPROUVÉ CO", 20, 267);

    docPdf.save('Recu-PayMe-' + transaction.reference + '.pdf');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-gray-50/50 relative">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="flex flex-col">
          <span className="font-black text-2xl tracking-tighter text-[#1A1A1A] leading-none">PAY-ME</span>
          <span className="text-[8px] font-bold text-gray-400 tracking-[0.2em] uppercase">BY ORANGE BANK</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center text-gray-700"
            title="Home"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Main Success Area */}
      <main className="flex-1 px-4 py-8 max-w-md w-full mx-auto">
        {/* Animated header card */}
        <div className="bg-white rounded-[24px] p-8 visual-receipt-shadow mb-8 border border-gray-100 text-center relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 bg-emerald-100/50 rounded-full blur-xl scale-125 animate-pulse"></div>
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100 relative z-10 shadow-sm">
              <CheckCircle2 size={36} className="animate-bounce" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-[#1A1A1A] mb-2 tracking-tight leading-none uppercase">
            {t.success.title}
          </h1>
          <p className="text-gray-500 font-semibold mb-1 text-sm tracking-wide">
            {language === 'fr' ? "FÉLICITATIONS ! TRANSCRIPTION TIKTAK+ VALIDÉE" : "CONGRATULATIONS! TIKTAK+ TRANSFER VALIDATED"}
          </p>
          <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
            {language === 'fr' 
              ? "Votre versement a été approuvé. Votre virement micro-crédit Orange est en cours de déblocage." 
              : "Your payment has been approved. Your Orange microcode transfer is being unlocked."}
          </p>
        </div>

        {/* Improved visual receipt styled nicely like a professional bank statement / voucher */}
        <div className="bg-white rounded-[24px] overflow-hidden border border-gray-150-custom relative shadow-[0_12px_40px_-15px_rgba(0,0,0,0.06)]">
          {/* Top colored aesthetic bar */}
          <div className="h-6 bg-[#1E4D8C] flex items-center justify-between px-6 text-[8px] text-white/90 font-bold tracking-[0.15em] uppercase">
            <span>Orange Bank Official Statement</span>
            <span className="flex items-center gap-1">
              <Shield size={9} fill="currentColor" /> Secured
            </span>
          </div>

          {/* Receipt Content Header */}
          <div className="p-6 border-b border-dashed border-gray-200 bg-gray-50/50 text-center relative">
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gray-50/50 rounded-full z-10 border border-gray-100"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-gray-50/50 rounded-full z-10 border border-gray-100"></div>
            
            <div className="flex justify-center mb-2">
              <PayMeLogo />
            </div>
            
            <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">
              {language === 'fr' ? "REÇU OFFICIEL DE TRANSACTON" : "OFFICIAL TRANSACTION RECEIPT"}
            </p>
            <p className="text-lg font-black text-[#1A1A1A] mt-1 tracking-tight">
              {details.creditAmount} <span className="text-xs text-gray-400 uppercase font-bold">TikTak+ Credit Line</span>
            </p>
          </div>

          {/* Details Table */}
          <div className="p-6 space-y-4 text-sm">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.success.transactionId}</span>
              <span className="text-xs font-black text-[#1A1A1A] font-mono select-all bg-gray-50 px-2 py-1 rounded border border-gray-100">{transaction.reference}</span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{language === 'fr' ? "Montant Souscrit" : "Granted Credit Line"}</span>
              <span className="text-sm font-extrabold text-[#1E4D8C]">{details.creditAmount}</span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{language === 'fr' ? "Frais de souscription payés" : "Subscription Fees Paid"}</span>
              <span className="text-sm font-extrabold text-orange-600">{details.fee}</span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{language === 'fr' ? "Durée de remboursement" : "Repayment Duration"}</span>
              <span className="text-sm font-medium text-gray-700">{details.duration}</span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{language === 'fr' ? "Mensualité" : "Monthly Repayment"}</span>
              <span className="text-sm font-bold text-gray-850">{details.repaymentMonthly}</span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{language === 'fr' ? "Intérêt / Commission (APR)" : "Interest Rate (APR)"}</span>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">0.00%</span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.success.payerNumber}</span>
              <span className="text-sm font-bold text-gray-800 font-mono">{transaction.phone || "---"}</span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.success.activationDate}</span>
              <span className="text-sm font-bold text-gray-800">{new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="flex justify-between items-center pt-2.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.success.creditStatus}</span>
              <span className="flex items-center gap-1.5 text-[#1E4D8C] font-black text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <BadgeCheck size={16} fill="currentColor" className="text-[#1E4D8C] text-white" />
                <span>{t.success.active}</span>
              </span>
            </div>
          </div>

          {/* Repayment progression progress track */}
          <div className="px-6 pb-6 pt-2 bg-gray-50/50 border-t border-gray-100">
            <div className="mb-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">{t.success.repaymentProgress}</span>
                <span className="text-[11px] font-black text-[#1E4D8C] uppercase tracking-widest">0% {t.success.complete}</span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden p-0.5 mt-2">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-[2%] rounded-full" />
              </div>
            </div>
            <p className="text-[10.5px] font-semibold text-gray-400 leading-normal mb-1">
              {language === 'fr' 
                ? "*Votre transfert commencera à arriver sur votre compte Orange Money d'ici 15 Minutes." 
                : "*Your credit transfer will arrive in your Orange Money wallet within 15 mins."}
            </p>
          </div>
        </div>

        {/* CTA Actions Section */}
        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={generateReceipt}
            className="w-full bg-[#E8620A] text-white font-black py-4.5 px-6 rounded-xl hover:bg-[#d55809] transition-all uppercase tracking-[0.15em] text-xs shadow-xl shadow-orange-100 flex items-center justify-center gap-3"
          >
            <Download size={18} strokeWidth={2.5} />
            {t.success.viewReceipt}
          </button>
          
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center bg-[#25D366] text-white font-black py-4.5 px-6 rounded-xl hover:bg-[#20ba59] transition-all uppercase tracking-[0.15em] text-xs shadow-xl shadow-green-100 gap-3 border border-green-500/10"
            >
              <MessageSquare size={18} fill="currentColor" strokeWidth={2.5} />
              {t.success.contactSupport}
              <ExternalLink size={14} className="opacity-70" />
            </a>
          )}
        </div>

        {/* Footer Prompt */}
        <p className="text-xs text-gray-500 text-center px-4 leading-relaxed mt-6 font-medium">
          {t.success.whatsappPrompt} <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="font-black text-[#E8620A] underline underline-offset-4 decoration-2">{t.success.whatsappLinkText}</a>
        </p>
      </main>
      
      <footer className="py-8 text-center bg-gray-50 border-t border-gray-100 mt-auto">
        <div className="flex items-center justify-center gap-2.5 text-gray-400 mb-2">
          <Shield size={15} />
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase">SECURE FINANCIAL STRUCUTRE</span>
        </div>
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest leading-loose">
          © 2026 PAY-ME BY ORANGE BANK. {t.common.allRightsReserved}.
        </p>
      </footer>
    </div>
  );
}

