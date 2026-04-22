import express from "express";
import cors from "cors";
import { PaymentOperation } from "@hachther/mesomb";
import serverless from "serverless-http";

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

// Helpers for operators
function getMesombService(phone: string, country: string = 'CM') {
  const p = phone.replace(/(?!^\+)[^\d]/g, '').replace('+', '');
  
  if (country.toUpperCase() === 'CM') {
    if (/^(237)?(67|68|650|651|652|653|654)\d{6}$/.test(p) || p.length === 9 && /^(67|68|650|651|652|653|654)/.test(p)) {
      return 'MTN';
    }
    return 'ORANGE';
  }
  
  if (country.toUpperCase() === 'SN') {
    if (/^(77|78)/.test(p)) return 'ORANGE';
    if (/^(76)/.test(p)) return 'FREE';
    if (/^(70)/.test(p)) return 'EXPRESSO';
  }

  return 'ORANGE';
}

router.get("/health", (req, res) => {
  console.log("Health check reached");
  res.json({ status: "ok", env: "netlify" });
});

router.post("/initiate-payment", async (req, res) => {
  console.log("Initiate payment reached");
  const { phone, amount, currency, countryCode, email } = req.body;

  if (!phone || !amount || !currency) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  let sanitizedPhone = phone.replace(/(?!^\+)[^\d]/g, '').replace('+', '');
  const finalCountry = (countryCode || 'CM').toUpperCase();

  if (sanitizedPhone.startsWith('237') && sanitizedPhone.length >= 12) {
    sanitizedPhone = sanitizedPhone.replace(/^237/, '');
  } else if (sanitizedPhone.startsWith('221') && sanitizedPhone.length >= 12) {
    sanitizedPhone = sanitizedPhone.replace(/^221/, '');
  } else if (sanitizedPhone.startsWith('225') && sanitizedPhone.length >= 12) {
    sanitizedPhone = sanitizedPhone.replace(/^225/, '');
  }

  const transactionId = `TXN_${Date.now()}`;

  try {
    const meAppKey = (process.env.MESOMB_APPLICATION_KEY || '').trim();
    const meAccKey = (process.env.MESOMB_ACCESS_KEY || '').trim();
    const meSecKey = (process.env.MESOMB_SECRET_KEY || '').trim();

    if (!meAppKey || !meAccKey || !meSecKey) {
      return res.status(500).json({ error: 'Clés MeSomb manquantes sur Netlify' });
    }

    const client = new PaymentOperation({
      applicationKey: meAppKey, 
      accessKey: meAccKey, 
      secretKey: meSecKey
    });

    const service = getMesombService(sanitizedPhone, finalCountry);

    const response = await client.makeCollect({
      amount: amount,
      service: service,
      payer: sanitizedPhone,
      country: finalCountry,
      currency: currency,
      message: 'Pay-Me TikTak', 
      customer: {
        email: email || 'anonymous@pay-me.local'
      }
    });

    const paymentData = {
      reference: transactionId,
      gatewayRef: (response as any).transaction?.pk || (response as any).transaction?.uuid || transactionId,
      status: response.isOperationSuccess() ? 'success' : 'pending',
      provider: 'mesomb'
    };
    
    if (!response.isOperationSuccess() && response.isTransactionSuccess() === false) {
        const rawResponse = (response as any).raw;
        throw new Error(rawResponse?.detail || rawResponse?.message || 'Erreur MeSomb');
    }

    res.status(200).json({ 
      reference: paymentData.reference, 
      payment: {
        ...paymentData,
        amount,
        currency,
        phone: sanitizedPhone
      } 
    });

  } catch (error: any) {
    const message = error.message || 'Erreur initiation';
    let errorCode = 'ERR_GENERAL';
    if (message.includes('solde') || message.includes('insufficient')) errorCode = 'ERR_INSUFFICIENT_BALANCE';
    else if (message.includes('expired')) errorCode = 'ERR_TIMEOUT';
    else if (message.includes('Invalid credentials')) errorCode = 'ERR_INVALID_CONFIG';
    
    res.status(500).json({ error: message, errorCode });
  }
});

router.get("/payment-status/:reference", async (req, res) => {
  const { reference } = req.params;
  const { provider, gatewayRef } = req.query; 

  try {
    let currentStatus = 'pending';
    let failReason = '';

    if (provider === 'mesomb') {
      const meAppKey = (process.env.MESOMB_APPLICATION_KEY || '').trim();
      const meAccKey = (process.env.MESOMB_ACCESS_KEY || '').trim();
      const meSecKey = (process.env.MESOMB_SECRET_KEY || '').trim();

      if (meAppKey && meAccKey && meSecKey) {
        const client = new PaymentOperation({
          applicationKey: meAppKey, accessKey: meAccKey, secretKey: meSecKey
        });

        const txs = await client.getTransactions([(gatewayRef as string) || reference]);
        if (txs && txs.length > 0) {
          const tx = txs[0] as any;
          if (tx.status === 'SUCCESS') currentStatus = 'success';
          else if (tx.status === 'FAIL') {
            currentStatus = 'failed';
            failReason = tx.message || tx.detail || 'Transaction échouée';
          }
        }
      }
    }

    res.status(200).json({ status: currentStatus, reason: failReason, transaction: { reference, gatewayRef } });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur statut' });
  }
});

app.use("/api", router);
app.use("/", router);

export const handler = serverless(app);
