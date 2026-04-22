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
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
    return model;
}

router.post("/", async (req, res) => {
    try {
        console.log("📩 Chat request received");
        
        // Validate request body
        if (!req.body || typeof req.body.message !== 'string') {
            console.error("❌ Invalid request body:", req.body);
            return res.status(400).json({ 
                reply: "Invalid request: message is required",
                error: "Bad request" 
            });
        }
        
        const userMsg = req.body.message;
        console.log("📝 User message:", userMsg.substring(0, 50));

        // Save user message
        chatHistory.push({ role: "user", content: userMsg });

        // Get context (with error handling)
        let context = "";
        try {
            context = getContext(userMsg);
            console.log("📚 Context retrieved:", context ? "yes" : "no");
        } catch (ctxErr) {
            console.error("❌ getContext error:", ctxErr.message);
            context = "";
        }

        // Build prompt
        const priorConversation = chatHistory.slice(0, -1).map(m => m.role + ": " + m.content).join("\n");
        const fullPrompt = `${systemPrompt}\n\nContext Data:\n${context || "None"}\n\nPrior Conversation:\n${priorConversation}\n\nUser: ${userMsg}\nAssistant:`;
        console.log("🤖 Calling Gemini...");

        // Call Gemini (lazy init)
        const geminiModel = getModel();
        const result = await geminiModel.generateContent(fullPrompt);
        const reply = result.response.text();
        console.log("✅ Gemini response received, length:", reply.length);

        // Save bot reply
        chatHistory.push({ role: "assistant", content: reply });

        // Send response
        res.json({ reply });

    } catch (err) {
        console.error("❌ Chat error:");
        console.error("Type:", err.constructor.name);
        console.error("Message:", err.message);
        console.error("Stack:", err.stack);
        res.status(500).json({ 
            reply: "Sorry, I encountered an error: " + err.message,
            error: err.message,
            type: err.constructor.name
        });
    }
});

module.exports = router;
