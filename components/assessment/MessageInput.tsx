import React, { useState } from 'react';

interface MessageInputProps {
  disabled: boolean;
  busy?: boolean;
  onSend: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ disabled, busy = false, onSend }) => {
  const [draft, setDraft] = useState('');

  const send = () => {
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="border-t border-brand-navy/10 pt-4 mt-4">
      <label htmlFor="assessment-reply" className="sr-only">
        Your reply
      </label>
      <textarea
        id="assessment-reply"
        value={draft}
        disabled={disabled || busy}
        rows={3}
        placeholder={disabled ? 'This conversation is complete.' : 'Write your reply in your own words'}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
        className="w-full bg-white border border-brand-navy/15 px-4 py-3 text-base text-brand-navy font-light leading-relaxed placeholder:text-brand-stone/80 focus:outline-none focus:border-brand-gold resize-y min-h-[5.5rem] disabled:bg-brand-sand/40 disabled:text-brand-stone"
      />
      <div className="mt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-[11px] text-brand-stone font-light">Enter to send. Shift + Enter for a new line.</p>
        <button
          type="button"
          onClick={send}
          disabled={disabled || busy || !draft.trim()}
          className="px-6 py-3 bg-brand-navy text-white text-sm font-medium hover:bg-brand-charcoal transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
