import { useState } from 'react';

const InputBar = ({ onSend }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onSend(input);
            setInput('');
        }
    };

    const handleQuickReply = (text) => {
        onSend(text);
    };

    const quickReplies = ["Hello", "What can you do?", "Pricing"];

    return (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
            {/* Quick Replies */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {quickReplies.map((reply, index) => (
                    <button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        className="whitespace-nowrap px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-full transition-colors border border-gray-600"
                    >
                        {reply}
                    </button>
                ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 placeholder-gray-500"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default InputBar;
