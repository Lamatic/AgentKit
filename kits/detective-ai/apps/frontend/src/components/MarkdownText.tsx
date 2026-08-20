import React from 'react';

interface MarkdownTextProps {
  text: string | null | undefined;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');

  const renderInline = (inlineText: string): React.ReactNode[] => {
    // Basic bold parsing: **text**
    const parts = inlineText.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i}>{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="markdown-content">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
          return <h4 key={idx}>{renderInline(trimmed.slice(4))}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx}>{renderInline(trimmed.slice(3))}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={idx}>{renderInline(trimmed.slice(2))}</h2>;
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return <li key={idx} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem' }}>{renderInline(trimmed.slice(2))}</li>;
        }

        if (trimmed === '') {
          return <div key={idx} style={{ height: '0.5rem' }} />;
        }

        return <p key={idx} style={{ marginBottom: '0.75rem', lineHeight: '1.5' }}>{renderInline(line)}</p>;
      })}
    </div>
  );
};
