import React from 'react';
import { type Message } from '@/services/chatService';

interface ConversationProps {
  userId: string;
  messages?: Message[];
}

export default function Conversation({ userId, messages = [] }: ConversationProps) {
  return (
    <div className="conversation-container">
      {/* Chat messages UI (placeholder) */}
      <div className="messages-list">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}>{msg.content || ''}</div>
        ))}
      </div>
    </div>
  );
}
