import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  // Format timestamp manually
  const formattedTime = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(message.timestamp);

  // Clases base para el texto dependiendo del remitente
  const textColor = isUser ? 'text-white' : 'text-gray-800';
  const linkColor = isUser ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col p-3 rounded-2xl shadow-sm overflow-hidden ${
          isUser 
            ? 'bg-blue-600 rounded-br-none' 
            : 'bg-white border border-gray-200 rounded-bl-none'
        }`}>
          <div className={`text-sm ${textColor}`}>
            <ReactMarkdown
              components={{
                // Párrafos
                p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed whitespace-pre-wrap" {...props} />,
                
                // Listas
                ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                
                // Encabezados
                h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1" {...props} />,
                
                // Texto con énfasis
                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                
                // Enlaces
                a: ({node, ...props}) => (
                  <a 
                    className={`underline decoration-1 underline-offset-2 ${linkColor}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    {...props} 
                  />
                ),
                
                // Código inline y bloques
                code: ({node, inline, className, children, ...props}: any) => {
                  if (inline) {
                    return (
                      <code 
                        className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                          isUser ? 'bg-blue-700 text-blue-50' : 'bg-gray-100 text-gray-700'
                        }`} 
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="my-2 rounded-md overflow-hidden bg-gray-900 text-gray-100">
                      <div className="overflow-x-auto p-3">
                        <code className="block text-xs font-mono whitespace-pre" {...props}>
                          {children}
                        </code>
                      </div>
                    </div>
                  );
                },
                
                // Citas
                blockquote: ({node, ...props}) => (
                  <blockquote 
                    className={`border-l-4 pl-3 py-1 my-2 italic ${
                      isUser ? 'border-blue-400 text-blue-100' : 'border-gray-300 text-gray-600'
                    }`} 
                    {...props} 
                  />
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
          <span className={`text-[10px] mt-1 self-end ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;