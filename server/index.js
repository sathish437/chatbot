const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for deployed URL
const corsOptions = {
    origin: ['https://chatbot-iwkx.onrender.com', 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

const chatRoute = require('./routes/chat');

// Root route - serve a simple status page
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'SupportBot API Server is running',
        endpoints: {
            health: '/api/health',
            chat: '/api/chat'
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/chat', chatRoute);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Deployed URL: https://chatbot-iwkx.onrender.com`);
});
