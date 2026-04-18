const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const chatRoute = require('./routes/chat');

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/chat', chatRoute);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
