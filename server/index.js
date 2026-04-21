require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔐 Validate API Key at startup
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY missing in server/.env");
    process.exit(1);
}

// ✅ Debug (safe)
console.log("🔑 API Key loaded:", !!process.env.GEMINI_API_KEY);

// 🌐 CORS
const corsOptions = {
    origin: [
        'https://chatbot-iwkx.onrender.com',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// 📦 Routes
const chatRoute = require('./routes/chat');

// 🩺 Health Check (IMPROVED)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        geminiConfigured: !!process.env.GEMINI_API_KEY
    });
});

app.use('/api/chat', chatRoute);

// 🧑‍� Serve frontend ONLY in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

// ❌ Global Error Handler (IMPORTANT)
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err.message);
    res.status(500).json({
        error: "Internal Server Error"
    });
});

// 🚀 Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
