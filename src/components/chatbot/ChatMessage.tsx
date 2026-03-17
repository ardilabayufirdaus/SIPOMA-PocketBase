import React from 'react';
import { motion } from 'framer-motion';
import { UserIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isAssistant = role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex w-full mb-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            isAssistant ? 'bg-ubuntu-orange text-white' : 'bg-ubuntu-darkAubergine text-white'
          } ${isAssistant ? 'mr-2' : 'ml-2'} shadow-md`}
        >
          {isAssistant ? (
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          ) : (
            <UserIcon className="h-5 w-5" />
          )}
        </div>

        <div
          className={`relative px-4 py-2 rounded-2xl shadow-sm border ${
            isAssistant
              ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
              : 'bg-ubuntu-orange text-white border-ubuntu-orange rounded-tr-none'
          }`}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          <span className="text-[10px] opacity-50 mt-1 block">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
