import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import { apiService } from '../services/api';
import { LogOut, Bot, RefreshCw, LayoutDashboard } from 'lucide-react';

interface ChatInterfaceProps {
  token: string;
  user: User;
  onLogout: () => void;
  onBackToHome: () => void;
}

// Función auxiliar para generar IDs de sesión
const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'session-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ token, user, onLogout, onBackToHome }) => {
  // Generar un Session ID aleatorio inicial
  const [sessionId, setSessionId] = useState(generateSessionId);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      text: `Bienvenido al panel, ${user.name}. Soy su analista de estrategia política basado en IA. Estoy listo para evaluar discursos, tendencias electorales o escenarios de crisis. ¿Por dónde empezamos?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);

  const handleSendMessage = async (text: string) => {
    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setError(null);

    // 2. Show "Typing..."
    setIsBotTyping(true);

    try {
      // 3. POST to Webhook with sessionId
      const response = await apiService.sendMessage(text, sessionId, token);

      // 4. Add Bot Response
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error("Failed to send message", err);
      setError('Error de conexión con el servidor de análisis. Intente nuevamente.');
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm("¿Desea reiniciar la sesión de análisis?")) {
      const newId = generateSessionId();
      setSessionId(newId);
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          text: `Sesión reiniciada, ${user.name}. ¿Qué nuevo escenario o discurso desea analizar?`,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
      setError(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToHome}
            className="p-2 hover:bg-gray-100 rounded-lg text-slate-600 transition-colors"
            title="Volver al Panel"
          >
            <LayoutDashboard size={20} />
          </button>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 hidden sm:flex">
             <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-none mb-1">Consultor Político AI</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full block"></span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Sistema Activo</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-xs text-gray-400 hidden lg:block" title="ID de Caso">CASO: {sessionId.slice(0, 8).toUpperCase()}</span>
          
          <button 
            onClick={handleResetChat}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200"
            title="Nuevo Análisis"
          >
            <RefreshCw size={18} />
            <span className="hidden md:inline text-sm font-medium">Limpiar</span>
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

          <button 
            onClick={onLogout}
            className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        
        {/* Typing Indicator */}
        {isBotTyping && (
          <div className="flex w-full justify-start mb-4 animate-in fade-in duration-300">
             <div className="flex flex-row items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                </div>
             </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="w-full flex justify-center my-2">
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm shadow-sm border border-red-200">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <MessageInput onSendMessage={handleSendMessage} isLoading={isBotTyping} />

      {/* Footer Branding */}
      <div className="bg-white pb-3 pt-1 text-center">
        <p className="text-[10px] font-bold text-gray-300 tracking-[0.2em] uppercase">
          Powered by Informe Confidencial
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;