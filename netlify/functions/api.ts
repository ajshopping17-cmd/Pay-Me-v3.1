import serverless from "serverless-http";
import express from "express";

const app = express();
app.use(express.json());

// Simplification maximale pour tester la connectivité
app.post("/api/initiate-payment", async (req, res) => {
  console.log("!!!DEBUG: initiate-payment reached!!!");
  return res.status(200).json({ 
    status: "ok", 
    message: "Minimal endpoint reached",
    receivedBody: req.body 
  });
});

app.get("/api/payment-status/:reference", async (req, res) => {
  console.log("!!!DEBUG: payment-status reached!!!");
  return res.status(200).json({ 
    status: "pending", 
    message: "Minimal status check reached" 
  });
});

export const handler = serverless(app);
