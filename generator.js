const express = require('express');
const path = require('path');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const cors = require('cors'); // Add this for external access

const app = express();
app.use(express.json());
app.use(cors()); // Allow other websites to call your API

// 1. GENERATE ROUTE: Does not store anything.
// It creates a secret, turns it into a QR, and sends BOTH back.
app.post('/api/setup', async (req, res) => {
    const { label = "User", issuer = "MyApp" } = req.body;
    
    const newSecret = speakeasy.generateSecret({ 
        name: `${issuer}:${label}`,
        issuer: issuer 
    });

    const qrImage = await QRCode.toDataURL(newSecret.otpauth_url);

    // The "Other Website" must receive this and save 'secret' in THEIR database
    res.json({
        secret: newSecret.base32,
        qr_image: qrImage
    });
});

// 2. VERIFY ROUTE: Does not use a global 'secret' variable.
// It expects the secret to be sent in the request body.
app.post('/api/verify', (req, res) => {
    const { token, secret } = req.body; // Secret comes from the client now

    if (!token || !secret) {
        return res.status(400).json({ error: "Missing token or secret" });
    }

    const verified = speakeasy.totp.verify({
        secret: secret, // Use the secret passed in the request
        encoding: 'base32',
        token: token,
        window: 1 
    });

    res.json({ 
        success: verified, 
        message: verified ? "✅ Verified" : "❌ Invalid" 
    });
});

// This tells Express to serve your index.html when you go to http://localhost:3000
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log('Running locally on port 3000'));
}

module.exports = app; 