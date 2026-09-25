import React, { useState } from 'react';
import { api } from '../api/client';
import type { AvailableSuspectState } from '../api/client';

interface InterrogationPanelProps {
  sessionId: string;
  suspect: AvailableSuspectState;
  onClose: () => void;
  onStateUpdate: () => void;
}

interface ChatMessage {
  sender: 'detective' | 'suspect';
  text: string;
}

export const InterrogationPanel: React.FC<InterrogationPanelProps> = ({
  sessionId,
  suspect,
  onClose,
  onStateUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'suspect',
      text: `Investigation file open. I am ready to answer your questions, Detective.`,
    },
  ]);
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userText = question.trim();
    setQuestion('');
    setError(null);
    setMessages((prev) => [...prev, { sender: 'detective', text: userText }]);
    setLoading(true);

    try {
      const response = await api.interrogateSuspect(sessionId, suspect.id, userText);
      setMessages((prev) => [...prev, { sender: 'suspect', text: response.response }]);
      onStateUpdate(); // Refresh session state (since interviewing a suspect counts towards progression)
    } catch (err: any) {
      setError(err.message || 'Interrogation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg w-full flex flex-col h-80vh border font-typewriter bg-charcoal text-light">
        {/* Modal Header */}
        <div className="flex-between border-bottom p-3">
          <div>
            <h2 className="text-accent uppercase text-lg font-bold">{suspect.name}</h2>
            <p className="text-muted text-xs uppercase">{suspect.relationship_to_victim}</p>
          </div>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {/* Suspect Info Card */}
        <div className="p-3 border-bottom bg-black-opacity text-sm">
          <p className="mb-1"><strong>Profile Description:</strong></p>
          <p className="text-muted text-xs leading-relaxed">{suspect.public_description}</p>
        </div>

        {/* Chat Feed */}
        <div className="flex-grow overflow-y-auto p-3 space-y-3 chat-feed">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble-wrapper ${msg.sender}`}>
              <div className="chat-bubble-sender uppercase text-xs mb-1">
                {msg.sender === 'detective' ? 'Detective' : suspect.name}
              </div>
              <div className="chat-bubble-text text-sm">
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble-wrapper suspect opacity-70">
              <div className="chat-bubble-sender uppercase text-xs mb-1">
                {suspect.name}
              </div>
              <div className="chat-bubble-text text-sm italic">
                {suspect.name} is considering your question...
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner text-xs">
              <strong>INTERROGATION ERROR:</strong> {error}
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleAsk} className="p-3 border-top bg-black-opacity flex gap-2">
          <input
            type="text"
            className="chat-input flex-grow text-sm p-2 bg-charcoal border text-light font-typewriter"
            placeholder="Type your question for the suspect..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            required
          />
          <button
            type="submit"
            className="btn btn-accent px-4 uppercase text-sm"
            disabled={loading || !question.trim()}
          >
            {loading ? 'ASKING...' : 'ASK'}
          </button>
        </form>
      </div>
    </div>
  );
};
