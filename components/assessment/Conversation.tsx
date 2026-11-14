import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../assessment/types';
import Message from './Message';

const Conversation: React.FC<{ messages: ChatMessage[] }> = ({ messages }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className="space-y-4" aria-live="polite">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default Conversation;
