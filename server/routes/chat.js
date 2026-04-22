const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const systemPrompt = require("../config/prompt");
const getContext = require("../utils/getContext");

let chatHistory = [];
let genAI = null;
let model = null;

// ✅ Initialize Gemini with error handling
function initGemini() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error("❌ GEMINI_API_KEY is not set");
            return false;
        }
        
        if (!genAI) {
            genAI = new GoogleGenerativeAI(apiKey);
            // Try gemini-1.5-flash first, fallback to gemini-pro if needed
            try {
                model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                console.log("✅ Gemini initialized with gemini-1.5-flash");
            } catch (modelErr) {
                console.warn("⚠️ gemini-1.5-flash not available, trying gemini-pro");
                model = genAI.getGenerativeModel({ model: "gemini-pro" });
                console.log("✅ Gemini initialized with gemini-pro");
            }
        }
        
        return true;
    } catch (err) {
        console.error("❌ Failed to initialize Gemini:", err.message);
        return false;
    }
}

// ✅ Get model (with initialization check)
function getModel() {
    if (!model) {
        const success = initGemini();
        if (!success) {
            throw new Error("Gemini API not initialized - check GEMINI_API_KEY");
        }
    }
    return model;
}

router.post("/", async (req, res) => {
    const startTime = Date.now();
    
    try {
        console.log("\n📩 ===== CHAT REQUEST =====");
        console.log("⏰ Time:", new Date().toISOString());
        
        // 1. Validate request body
        if (!req.body) {
            console.error("❌ Request body is missing");
            return res.status(400).json({ 
                reply: "Invalid request: no body provided",
                error: "Missing body" 
            });
        }
        
        if (typeof req.body.message !== 'string') {
            console.error("❌ Message is not a string:", typeof req.body.message);
            return res.status(400).json({ 
                reply: "Invalid request: message must be a string",
                error: "Invalid message type" 
            });
        }
        
        const userMsg = req.body.message.trim();
        if (!userMsg) {
            console.error("❌ Message is empty");
            return res.status(400).json({ 
                reply: "Please enter a message",
                error: "Empty message" 
            });
        }
        
        console.log("📝 User message:", userMsg.substring(0, 100));

        // 2. Save user message
        chatHistory.push({ role: "user", content: userMsg });
        
        // Limit chat history to prevent token overflow
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }

        // 3. Get context (with error handling)
        let context = "";
        try {
            context = getContext(userMsg);
            console.log("📚 Context found:", context ? "yes" : "no");
        } catch (ctxErr) {
            console.error("❌ getContext error (non-critical):", ctxErr.message);
            context = "";
        }

        // 4. Build prompt
        const priorConversation = chatHistory
            .slice(0, -1)
            .map(m => `${m.role}: ${m.content}`)
            .join("\n");
            
        const fullPrompt = `${systemPrompt}

Context Data:
${context || "None"}

Prior Conversation:
${priorConversation}

User: ${userMsg}
Assistant:`;

        console.log("🤖 Calling Gemini API...");

        // 5. Call Gemini with timeout and error handling
        const geminiModel = getModel();
        
        const result = await geminiModel.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
            }
        });
        
        // Extract response text safely
        let reply = "";
        try {
            reply = result.response.text();
        } catch (textErr) {
            console.error("❌ Error extracting response text:", textErr.message);
            reply = "I'm sorry, I couldn't generate a proper response. Please try again.";
        }
        
        if (!reply || reply.trim() === "") {
            reply = "I apologize, but I couldn't formulate a response. Could you rephrase your question?";
        }
        
        console.log("✅ Gemini response length:", reply.length);

        // 6. Save bot reply
        chatHistory.push({ role: "assistant", content: reply });

        // 7. Send response
        const duration = Date.now() - startTime;
        console.log("⏱️ Request completed in", duration, "ms\n");
        
        res.json({ reply });

    } catch (err) {
        const duration = Date.now() - startTime;
        console.error("\n❌ ===== CHAT ERROR =====");
        console.error("⏱️ Duration:", duration, "ms");
        console.error("Type:", err.constructor.name);
        console.error("Message:", err.message);
        
        if (err.message && err.message.includes("API key not valid")) {
            console.error("🔑 API Key Error: The GEMINI_API_KEY is invalid or revoked");
        }
        if (err.message && err.message.includes("model")) {
            console.error("🤖 Model Error: The Gemini model may not be available");
        }
        
        // Don't expose internal details to client
        let userMessage = "Sorry, I encountered an error. Please try again in a moment.";
        
        if (process.env.NODE_ENV === 'development') {
            userMessage += ` (Debug: ${err.message})`;
        }
        
        res.status(500).json({ 
            reply: userMessage,
            error: process.env.NODE_ENV === 'development' ? err.message : "Internal error"
        });
    }
});

// ✅ Health check for chat route
router.get("/status", (req, res) => {
    const initialized = initGemini();
    res.json({
        status: initialized ? "ready" : "not_ready",
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        chatHistoryLength: chatHistory.length
    });
});

// ✅ Clear chat history (useful for testing)
router.post("/clear", (req, res) => {
    chatHistory = [];
    res.json({ reply: "Chat history cleared. How can I help you?" });
});

module.exports = router;
