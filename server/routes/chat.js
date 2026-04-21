const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const systemPrompt = require("../config/prompt");
const getContext = require("../utils/getContext");

let chatHistory = [];
let model = null;

// ✅ Lazy initialization - create model only when needed
function getModel() {
    if (!model) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
    return model;
}

router.post("/", async (req, res) => {
    try {
        const userMsg = req.body.message;

        // Save user message
        chatHistory.push({ role: "user", content: userMsg });

        // Get context
        const context = getContext(userMsg);

        // Build prompt
        const fullPrompt = `${systemPrompt}\n\nContext Data:\n${context || "None"}\n\nPrior Conversation:\n${chatHistory.slice(0, -1).map(m => m.role + ": " + m.content).join("\n")}\n\nUser: ${userMsg}\nAssistant:`;

        // Call Gemini (lazy init)
        const geminiModel = getModel();
        const result = await geminiModel.generateContent(fullPrompt);
        const reply = result.response.text();

        // Save bot reply
        chatHistory.push({ role: "assistant", content: reply });

        // Send response with delay
        setTimeout(() => {
            res.json({ reply });
        }, 800);

    } catch (err) {
        console.error("❌ Chat error:", err.message);
        res.status(500).json({ reply: "Sorry, I encountered an error. Please try again." });
    }
});

module.exports = router;
