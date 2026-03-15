// File: frontend/src/components/StartupAdvisorChat.tsx
// Floating AI chatbot that appears on all dashboards

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './StartupAdvisorChat.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  sources?: string[];
  suggestions?: string[];
}

interface StartupAdvisorChatProps {
  ideaId: number;
}

const StartupAdvisorChat: React.FC<StartupAdvisorChatProps> = ({ ideaId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [dataCompleteness, setDataCompleteness] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load suggested questions when opened
  useEffect(() => {
    if (isOpen && suggestedQuestions.length === 0) {
      loadSuggestedQuestions();
      loadContext();
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const loadSuggestedQuestions = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/v1/startup-advisor/suggested-questions/${ideaId}`
      );
      setSuggestedQuestions(response.data.questions);
    } catch (error) {
      console.error('Failed to load suggested questions:', error);
    }
  };

  const loadContext = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/v1/startup-advisor/context/${ideaId}`
      );
      setDataCompleteness(response.data.data_completeness);
    } catch (error) {
      console.error('Failed to load context:', error);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: textToSend
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/startup-advisor/chat',
        {
          idea_id: ideaId,
          message: textToSend,
          conversation_history: messages
        }
      );

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp,
        sources: response.data.sources,
        suggestions: response.data.suggestions
      };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    
    // Welcome message on first open
    if (!isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm your AI startup advisor. I know everything about your startup from the validation results. What would you like to discuss?"
      }]);
    }
  };

  return (
    <div className="startup-advisor-container">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button 
          className="chat-toggle-button"
          onClick={toggleChat}
          title="Chat with AI Advisor"
        >
          <span className="chat-icon">🤖</span>
          <span className="chat-badge">{dataCompleteness}%</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-title">🤖 AI Startup Advisor</span>
              <span className="chat-status">
                {dataCompleteness}% data loaded
              </span>
            </div>
            <button 
              className="chat-close-button"
              onClick={toggleChat}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`chat-message ${message.role}`}
              >
                <div className="message-content">
                  {message.content}
                </div>
                
                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="message-sources">
                    <span className="sources-label">Sources:</span>
                    {message.sources.map((source, i) => (
                      <span key={i} className="source-tag">{source}</span>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="message-suggestions">
                    <span className="suggestions-label">Suggested actions:</span>
                    <ul>
                      {message.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="message-content loading">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {messages.length === 1 && suggestedQuestions.length > 0 && (
              <div className="suggested-questions">
                <p className="suggested-label">You might want to ask:</p>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="suggested-question-button"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-container">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Ask me anything about your startup..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="chat-send-button"
              onClick={() => sendMessage()}
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartupAdvisorChat;