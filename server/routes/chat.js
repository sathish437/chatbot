const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const systemPrompt = require("../config/prompt");
const getContext = require("../utils/getContext");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

let chatHistory = [];

router.post("/", async (req, res) => {
  try {
    const userMsg = req.body.message;

    // 1. Save user message
    chatHistory.push({ role: "user", content: userMsg });

    // 2. Fetch context
    const context = getContext(userMsg);

    // 3. AI Call
    let reply = "";
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      reply = "⚠️ Server Error Prevented: The Gemini API Key is missing! Please open `server/.env` and paste your actual API Key into `GEMINI_API_KEY`. Once saved, I will automatically connect to my AI brain.";
    } else {
      const fullPrompt = `${systemPrompt}\n\nContext Data:\n${context || "None"}\n\nPrior Conversation:\n${chatHistory.slice(0, -1).map(m => m.role + ": " + m.content).join("\n")}\n\nUser: ${userMsg}\nAssistant:`;
      const result = await model.generateContent(fullPrompt);
      reply = result.response.text();
    }

    // 4. Save bot reply
    chatHistory.push({ role: "assistant", content: reply });

    // 5. Send response with artificial delay for realism
    setTimeout(() => {
      res.json({ reply });
    }, 800);

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error details: " + err.message });
  }
});

module.exports = router;
