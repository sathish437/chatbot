import { motion } from 'framer-motion';

const MessageBubble = ({ message }) => {
    const isUser = message.isUser;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-lg ${isUser
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none'
                        : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
                    }`}
            >
                <p className="text-sm md:text-base leading-relaxed">{message.text}</p>
                <div className={`text-[10px] mt-1 opacity-70 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </motion.div>
    );
};

export default MessageBubble;
