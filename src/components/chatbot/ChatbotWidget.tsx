import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftEllipsisIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';
import { chatbotService, Message } from '../../services/chatbotService';
import ChatMessage from './ChatMessage';

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Halo! Saya SIPOMA Assistant. Bagaimana saya bisa membantu operasional pabrik Anda hari ini?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(newMessages);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Maaf, terjadi kesalahan saat menghubungi server AI. Silakan coba sesaat lagi.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            className={`pointer-events-auto mb-4 bg-white dark:bg-slate-900 shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded ? 'w-[80vw] h-[80vh] sm:w-[600px]' : 'w-[90vw] h-[500px] sm:w-[400px]'
            }`}
          >
            {/* Header */}
            <div className="bg-ubuntu-aubergine p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-ubuntu-orange p-1.5 rounded-xl shadow-inner">
                  <SparklesIcon className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">SIPOMA Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-white/70 uppercase font-medium">
                      Grok x.AI Powered
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
                >
                  {isExpanded ? (
                    <ArrowsPointingInIcon className="h-5 w-5" />
                  ) : (
                    <ArrowsPointingOutIcon className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50 scrollbar-thin">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  role={msg.role as 'user' | 'assistant'}
                  content={msg.content}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 flex gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-ubuntu-orange animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-ubuntu-orange animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-ubuntu-orange animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="relative flex items-center">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Tanyakan sesuatu..."
                  rows={1}
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl focus:ring-2 focus:ring-ubuntu-orange resize-none text-sm transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className={`absolute right-2 p-2 rounded-xl transition-all ${
                    inputValue.trim() && !isLoading
                      ? 'bg-ubuntu-orange text-white shadow-lg'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="text-[9px] text-center text-slate-400 mt-2">
                Peringatan: AI dapat membuat kesalahan. Harap verifikasi info penting.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto p-4 bg-ubuntu-aubergine text-white rounded-2xl shadow-2xl flex items-center gap-3 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-ubuntu-orange/40 to-transparent translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
        <div className="relative z-10 flex items-center gap-3">
          <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
          <span className="font-bold tracking-tight text-sm pr-1">SIPOMA AI</span>
        </div>
      </motion.button>
    </div>
  );
};

export default ChatbotWidget;
