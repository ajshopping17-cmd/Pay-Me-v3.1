import express from "express";
import cors from "cors";
import { PaymentOperation } from "@hachther/mesomb";

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

// Helpers for operators
function getMesombService(phone: string, country: string = 'CM') {
  const p = phone.replace(/(?!^\+)[^\d]/g, '').replace('+', '');
  
  // Cameroon specific (MeSomb uses MTN or ORANGE)
  if (country.toUpperCase() === 'CM') {
    if (/^(237)?(67|68|650|651|652|653|654)\d{6}$/.test(p) || p.length === 9 && /^(67|68|650|651|652|653|654)/.test(p)) {
      return 'MTN';
    }
    return 'ORANGE';
  }
  
  // Senegal (MeSomb uses ORANGE, FREE, EXPRESSO)
  if (country.toUpperCase() === 'SN') {
    if (/^(77|78)/.test(p)) return 'ORANGE';
    if (/^(76)/.test(p)) return 'FREE';
    if (/^(70)/.test(p)) return 'EXPRESSO';
  }

  return 'ORANGE'; // Default
}

// API Routes
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.post("/initiate-payment", async (req, res) => {
  console.log("Received payment request:", req.body);
  const { phone, amount, currency, countryCode, email, userId } = req.body;

  if (!phone || !amount || !currency) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  // Sanitize phone number: keep only digits
  let sanitizedPhone = phone.replace(/(?!^\+)[^\d]/g, '').replace('+', '');

  // Strip country codes since gateways usually expect the local number
  const finalCountry = (countryCode || 'CM').toUpperCase();

  if (sanitizedPhone.startsWith('237') && sanitizedPhone.length >= 12) {
    sanitizedPhone = sanitizedPhone.replace(/^237/, '');
  } else if (sanitizedPhone.startsWith('221') && sanitizedPhone.length >= 12) {
    sanitizedPhone = sanitizedPhone.replace(/^221/, '');
  } else if (sanitizedPhone.startsWith('225') && sanitizedPhone.length >= 12) {
    sanitizedPhone = sanitizedPhone.replace(/^225/, '');
  }

  if (sanitizedPhone.length < 8 || sanitizedPhone.length > 10) {
    return res.status(400).json({ error: 'Numéro de téléphone local invalide' });
  }

  const transactionId = `TXN_${Date.now()}`;

  try {
    let paymentData: any = {};

    // ===== TOUT VIA MESOMB (Cameroun, Sénégal, etc.) =====
    const meAppKey = (process.env.MESOMB_APPLICATION_KEY || '').trim();
    const meAccKey = (process.env.MESOMB_ACCESS_KEY || '').trim();
    const meSecKey = (process.env.MESOMB_SECRET_KEY || '').trim();

    console.log("MeSomb Keys Check:", {
      appKeyLength: meAppKey.length,
      accKeyPrefix: meAccKey.substring(0, 4),
      secKeyPrefix: meSecKey.substring(0, 4),
      appKeyPrefix: meAppKey.substring(0, 4)
    });

    if (!meAppKey || !meAccKey || !meSecKey) {
      return res.status(500).json({ error: 'Clés API MeSomb manquantes (MESOMB_APPLICATION_KEY, MESOMB_ACCESS_KEY, MESOMB_SECRET_KEY) dans les Settings.' });
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

    paymentData = {
      reference: transactionId,
      gatewayRef: (response as any).transaction?.pk || (response as any).transaction?.uuid || transactionId,
      status: response.isOperationSuccess() ? 'success' : 'pending',
      provider: 'mesomb'
    };
    
    if (!response.isOperationSuccess() && response.isTransactionSuccess() === false) {
        const rawResponse = (response as any).raw;
        throw new Error(rawResponse?.detail || rawResponse?.message || 'Erreur de paiement MeSomb (Vérifiez vos clés et votre solde)');
    }

    const payment = {
      status: paymentData.status,
      reference: paymentData.reference,
      gatewayRef: paymentData.gatewayRef,
      provider: paymentData.provider,
      amount,
      currency,
      phone: sanitizedPhone
    };

    res.status(200).json({ reference: payment.reference, payment });

  } catch (error: any) {
    console.error("Payment initiation error:", error);
    res.status(500).json({ error: error.message || 'Une erreur est survenue lors de l\'initiation du paiement' });
  }
});

router.get("/payment-status/:reference", async (req, res) => {
  const { reference } = req.params;
  const { provider, gatewayRef } = req.query; 
  
  console.log(`Checking status for ${reference} via ${provider}`);

  if (!provider) {
     return res.status(400).json({ error: 'Provider inconnu' });
  }

  try {
    let currentStatus = 'pending';

    if (provider === 'mesomb') {
      const meAppKey = (process.env.MESOMB_APPLICATION_KEY || '').trim();
      const meAccKey = (process.env.MESOMB_ACCESS_KEY || '').trim();
      const meSecKey = (process.env.MESOMB_SECRET_KEY || '').trim();

      if (meAppKey && meAccKey && meSecKey) {
        const client = new PaymentOperation({
          applicationKey: meAppKey, 
          accessKey: meAccKey, 
          secretKey: meSecKey
        });

        try {
          const txs = await client.getTransactions([(gatewayRef as string) || reference]);
          if (txs && txs.length > 0) {
            const rawStatus = txs[0].status;
            if (rawStatus === 'SUCCESS') currentStatus = 'success';
            else if (rawStatus === 'FAIL') currentStatus = 'failed';
            else currentStatus = 'pending';
          }
        } catch (e) {
          console.error("MeSomb status check failed:", e);
        }
      }
    }

    res.status(200).json({ status: currentStatus, transaction: { reference, gatewayRef } });
  } catch (error: any) {
    console.error("Status check error:", error);
    res.status(500).json({ error: error.message || 'Erreur lors de la vérification du statut' });
  }
});

router.post("/payment-webhook", async (req, res) => {
  // Webhook for NotchPay
  const { reference, status, event } = req.body;
  // Process webhook...
  res.status(200).json({ received: true });
});

// App Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Server-side Error caught by middleware:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Mount the router under /api
app.use("/api", router);

export default app;
