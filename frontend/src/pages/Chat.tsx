import { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { ChatMessage } from '@/types';

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      const response = await api.createChatSession();
      setSessionId(response.data.sessionId);
      
      // Add welcome message
      setMessages([{
        messageId: '1',
        sessionId: response.data.sessionId,
        role: 'assistant',
        content: 'Hello! I\'m your insurance advisor assistant. How can I help you today?',
        timestamp: new Date().toISOString(),
      }]);
    } catch (error: any) {
      console.error('Error initializing chat:', error);

      if (error?.response?.status === 404) {
        setSessionId('offline-session');
        setMessages([{
          messageId: '1',
          sessionId: 'offline-session',
          role: 'assistant',
          content: 'Chat service is temporarily unavailable. You can continue using policies and other available sections while backend chat routes are being restored.',
          timestamp: new Date().toISOString(),
        }]);
        toast.error('Chat service is currently unavailable');
        return;
      }

      toast.error('Failed to initialize chat');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      messageId: Date.now().toString(),
      sessionId,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (sessionId === 'offline-session') {
        const assistantMessage: ChatMessage = {
          messageId: (Date.now() + 1).toString(),
          sessionId,
          role: 'assistant',
          content: 'Live chat backend is unavailable right now. Please try again later after the chat route is restored.',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.error('Live chat is unavailable');
        return;
      }

      const response = await api.sendMessage({
        message: inputMessage,
        sessionId,
      });

      const assistantMessage: ChatMessage = {
        messageId: (Date.now() + 1).toString(),
        sessionId,
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">AI Chat Support</h1>
        <p className="text-gray-600 mt-2">Ask me anything about your insurance</p>
      </div>

      <div className="card flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.messageId}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-100' : 'text-gray-500'}`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="input flex-1"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="btn btn-primary flex items-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;

// Made with Bob
