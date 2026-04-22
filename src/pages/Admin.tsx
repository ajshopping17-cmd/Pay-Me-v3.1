import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs, deleteDoc, Timestamp, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Save, History, Trash2, RefreshCw } from 'lucide-react';

interface Transaction {
  id: string;
  reference: string;
  phone: string;
  amount: number;
  currency: string;
  country: string;
  status: string;
  createdAt: any;
  userId: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [whatsappLink, setWhatsappLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'admin_config', 'main'));
        if (configDoc.exists()) {
          setWhatsappLink(configDoc.data().whatsappLink || '');
        }
      } catch (error) {
        console.error("Error fetching config", error);
      }
    };

    const fetchTransactions = async () => {
      setIsLoadingTransactions(true);
      try {
        // Cleanup old transactions (older than 72 hours)
        const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
        const qCleanup = query(collection(db, 'transactions'), where('createdAt', '<', Timestamp.fromDate(seventyTwoHoursAgo)));
        const cleanupSnapshot = await getDocs(qCleanup);
        
        const deletePromises = cleanupSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Fetch recent transactions
        const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const txs: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          txs.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setTransactions(txs);
      } catch (error) {
        console.error("Error fetching transactions", error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchConfig();
    fetchTransactions();
  }, [navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'admin_config', 'main'), {
        whatsappLink,
        accessCode: '3173', // In a real app, this should be hashed and managed securely
        updatedAt: serverTimestamp()
      }, { merge: true });
      setMessage('Configuration sauvegardée avec succès.');
    } catch (error: any) {
      console.error("Error saving config", error);
      setMessage('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-sm relative">
      <header className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-[#1A1A1A]" />
          </button>
          <span className="font-bold text-lg text-[#1A1A1A]">Espace Administrateur</span>
        </div>
      </header>

      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Configuration</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Lien WhatsApp (Support)
          </label>
          <input
            type="url"
            value={whatsappLink}
            onChange={(e) => setWhatsappLink(e.target.value)}
            placeholder="https://wa.me/..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E8620A] focus:ring-1 focus:ring-[#E8620A]"
          />
          <p className="text-xs text-gray-500 mt-2">Ce lien sera utilisé sur la page de succès pour rediriger les utilisateurs vers le support.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[#1A1A1A] text-white font-bold py-3.5 px-4 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 mb-10"
        >
          <Save size={20} />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>

        <div className="border-t border-gray-100 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <History size={22} className="text-[#E8620A]" />
              Historique des Transactions
            </h2>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Reset 72h auto
            </div>
          </div>

          {isLoadingTransactions ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <RefreshCw size={24} className="animate-spin mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest">Chargement...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm font-medium">Aucune transaction récente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Référence</div>
                      <div className="text-sm font-mono font-bold text-[#1A1A1A]">{tx.reference}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-600' : 
                      tx.status === 'failed' ? 'bg-red-100 text-red-600' : 
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {tx.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Montant</div>
                      <div className="text-sm font-bold text-[#1A1A1A]">{tx.amount} {tx.currency}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Téléphone</div>
                      <div className="text-sm font-bold text-[#1A1A1A]">{tx.phone}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                    <div className="text-[10px] text-gray-400 font-medium">
                      {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString() : 'Date inconnue'}
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">
                      {tx.country}
                    </div>
                  </div>
                  {tx.status === 'failed' && (
                    <div className="mt-3 pt-3 border-t border-red-50">
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Raison de l'échec</div>
                      <div className="text-xs font-medium text-red-600">
                        {tx.failReason || 'Solde insuffisant / Délai de la requête expirée'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
