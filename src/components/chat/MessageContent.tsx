'use client';

import React from 'react';
import { Copy } from 'lucide-react';

type MessageContentProps = {
  content: string;
  searchQuery?: string;
};

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, searchQuery = '' }) => {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const fullCode = part.slice(3, -3).trim();
          const firstLineBreak = fullCode.indexOf('\n');
          const lang = firstLineBreak !== -1 ? fullCode.slice(0, firstLineBreak).toLowerCase() : '';
          const code = firstLineBreak !== -1 ? fullCode.slice(firstLineBreak + 1) : fullCode;

          return (
            <div key={i} className="my-4 group/code relative">
              <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-x border-t border-white/10 rounded-t-xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                  {lang || 'code'}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover/code:opacity-100"
                  title="Copy Code"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <pre className="p-4 bg-black/40 border border-white/10 rounded-b-xl overflow-x-auto font-mono text-sm text-blue-200/90 whitespace-pre scrollbar-hide">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        let processed: (string | React.ReactElement)[] = [part];

        // Inline code
        processed = processed.flatMap((p, j) => {
          if (typeof p !== 'string') return [p];
          return p.split(/(`[^`]+`)/g).map((bit, k) => {
            if (bit.startsWith('`') && bit.endsWith('`')) {
              return (
                <code key={`${j}-${k}`} className="bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-blue-300 font-mono text-[12px]">
                  {bit.slice(1, -1)}
                </code>
              );
            }
            return bit;
          });
        });

        // Bold
        processed = processed.flatMap((p, j) => {
          if (typeof p !== 'string') return [p];
          return p.split(/(\*\*[^*]+\*\*)/g).map((bit, k) => {
            if (bit.startsWith('**') && bit.endsWith('**')) {
              return <strong key={`${j}-${k}`} className="font-black text-white">{bit.slice(2, -2)}</strong>;
            }
            return bit;
          });
        });

        // Italic
        processed = processed.flatMap((p, j) => {
          if (typeof p !== 'string') return [p];
          return p.split(/(_[^_]+_)/g).map((bit, k) => {
            if (bit.startsWith('_') && bit.endsWith('_')) {
              return <em key={`${j}-${k}`} className="italic opacity-80 text-blue-100/90">{bit.slice(1, -1)}</em>;
            }
            return bit;
          });
        });

        // Search highlighting
        if (searchQuery.trim()) {
          processed = processed.flatMap((p, j) => {
            if (typeof p !== 'string') return [p];
            return p.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'ig')).map((bit, k) => {
              if (bit.toLowerCase() === searchQuery.toLowerCase()) {
                return (
                  <mark key={`${j}-${k}`} className="bg-blue-400 text-black font-black rounded-sm px-0.5">
                    {bit}
                  </mark>
                );
              }
              return bit;
            });
          });
        }

        processed = processed.flatMap((p, j) => {
          if (typeof p !== 'string') return [p];
          return p.split(URL_PATTERN).map((bit, k) => {
            if (/^https?:\/\/[^\s]+$/i.test(bit)) {
              return (
                <a
                  key={`${j}-${k}`}
                  href={bit}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300 underline decoration-blue-400/40 underline-offset-4 transition-colors hover:text-blue-200"
                >
                  {bit}
                </a>
              );
            }
            return bit;
          });
        });

        return <span key={i} className="leading-relaxed whitespace-pre-wrap break-words">{processed}</span>;
      })}
    </div>
  );
};
