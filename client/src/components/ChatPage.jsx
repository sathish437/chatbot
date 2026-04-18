import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Load initial greeting or history functionality could go here
    useEffect(() => {
        const savedMessages = localStorage.getItem('chatHistory');
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        } else {
            // Initial greeting if no history
            setMessages([{
                id: 'init',
                text: "Hello! I am SupportBot. How can I help you today?",
                isUser: false,
                timestamp: new Date().toISOString()
            }]);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }, [messages]);

    const handleSendMessage = async (text) => {
        if (!text.trim()) return;

        const newUserMsg = {
            id: Date.now(),
            text: text,
            isUser: true,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setIsLoading(true);

        try {
            const response = await axios.post('/api/chat', { message: text });

            const botMsg = {
                id: Date.now() + 1,
                text: response.data.reply,
                isUser: false,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMsg = {
                id: Date.now() + 1,
                text: "Sorry, something went wrong. Please try again later.",
                isUser: false,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        setMessages([{
            id: Date.now(),
            text: "Chat cleared. How can I help you?",
            isUser: false,
            timestamp: new Date().toISOString()
        }]);
        localStorage.removeItem('chatHistory');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center shadow-md">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    SupportBot
                </h1>
                <button
                    onClick={handleClearChat}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                    Clear Chat
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-2xl p-4 rounded-tl-none animate-pulse">
                            <span className="text-gray-400 text-sm">Typing...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <InputBar onSend={handleSendMessage} />
        </div>
    );
};

export default ChatPage;
