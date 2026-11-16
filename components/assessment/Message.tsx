import React from 'react';
import { assistantParagraphs } from '../../assessment/messageFormat';
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
      {fromVisitor ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-light text-white/95">{message.text}</p>
      ) : (
        <div className="space-y-2">
          {assistantParagraphs(message.text).map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed font-light text-brand-charcoal">
              {paragraph.map((run, runIndex) =>
                run.bold ? (
                  <strong key={runIndex} className="font-semibold">
                    {run.text}
                  </strong>
                ) : (
                  <span key={runIndex}>{run.text}</span>
                ),
              )}
            </p>
          ))}
        </div>
      )}
    </article>
  );
};

export default Message;
