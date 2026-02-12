import React, { useState, FormEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10">
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escriba una consulta estratégica o pegue un discurso para analizar..."
          disabled={isLoading}
          className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 border border-transparent focus:border-slate-500 focus:bg-white rounded-full py-3 px-5 outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="bg-slate-800 hover:bg-slate-900 disabled:bg-gray-400 text-white p-3 rounded-full shadow-lg transition-transform transform active:scale-95 flex items-center justify-center"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;