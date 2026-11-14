import React from 'react';
import type { ChatMessage } from '../../assessment/types';

const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const fromVisitor = message.role === 'visitor';

  return (
    <article
      className={`max-w-[92%] sm:max-w-[80%] px-4 py-3 border ${
        fromVisitor
          ? 'ml-auto bg-brand-navy text-white border-brand-navy'
          : 'mr-auto bg-white text-brand-charcoal border-brand-navy/10'
      }`}
      aria-label={fromVisitor ? 'Your message' : 'Tegemea'}
    >
      <p className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5 ${fromVisitor ? 'text-brand-gold' : 'text-brand-gold'}`}>
        {fromVisitor ? 'You' : 'Tegemea'}
      </p>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${fromVisitor ? 'font-light text-white/95' : 'font-light'}`}>
        {message.text}
      </p>
    </article>
  );
};

export default Message;
