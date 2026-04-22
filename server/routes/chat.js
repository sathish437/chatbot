const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const systemPrompt = require("../config/prompt");
const getContext = require("../utils/getContext");

let chatHistory = [];
let genAI;
let model;

// 🔥 Initialize Gemini (clean + stable)
function getGeminiModel() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY missing");
    }

    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // ✅ FIXED MODEL
        console.log("✅ Gemini initialized (2.5-flash)");
    }

    return model;
}

// 🚀 MAIN CHAT ROUTE
router.post("/", async (req, res) => {
    const start = Date.now();

    try {
        console.log("\n📩 New request:", req.body);

        // ✅ Validate input
        const userMsg = req.body?.message;
        if (!userMsg || typeof userMsg !== "string") {
            return res.status(400).json({
                reply: "❌ Invalid message"
            });
        }

        const cleanMsg = userMsg.trim();

        // ✅ Save history (limit)
        chatHistory.push({ role: "user", content: cleanMsg });
        chatHistory = chatHistory.slice(-10); // 🔥 optimized

        // ✅ Context
        let context = "";
        try {
            context = getContext(cleanMsg);
        } catch (e) {
            console.warn("Context error:", e.message);
        }

        // ✅ Build prompt (simple & safe)
        const historyText = chatHistory
            .map(m => `${m.role}: ${m.content}`)
            .join("\n");

        const fullPrompt = `
${systemPrompt}

Context:
${context || "None"}

Conversation:
${historyText}

User: ${cleanMsg}
Assistant:
        `;

        console.log("🤖 Calling Gemini...");

        const gemini = getGeminiModel();

        // 🔥 SIMPLIFIED API CALL (LESS ERROR)
        const result = await gemini.generateContent(fullPrompt);

        const response = await result.response;
        const reply = response.text();

        if (!reply) {
            throw new Error("Empty response from Gemini");
        }

        // ✅ Save reply
        chatHistory.push({ role: "assistant", content: reply });

        console.log("✅ Response OK:", reply.substring(0, 60));

        res.json({ reply });

    } catch (err) {
        console.error("🔥 ERROR:", err);

        let message = "⚠️ Server error. Please try again.";

        if (err.message.includes("API_KEY")) {
            message = "⚠️ API key issue. Contact admin.";
        }

        if (err.message.includes("model")) {
            message = "⚠️ AI model unavailable.";
        }

        res.status(500).json({ reply: message });
    }
});

// ✅ STATUS
router.get("/status", (req, res) => {
    res.json({
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        history: chatHistory.length
    });
});

// ✅ CLEAR CHAT
router.post("/clear", (req, res) => {
    chatHistory = [];
    res.json({ reply: "Chat cleared" });
});

module.exports = router;