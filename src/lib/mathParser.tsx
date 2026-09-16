import React from 'react';
import katex from 'katex';

interface MathProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const MathView: React.FC<MathProps> = ({ math, block = false, className = '' }) => {
  if (!math) return null;

  try {
    // Sanitize common issues like escaped backslashes from JSON
    const sanitized = math
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, ' ')
      .trim();

    const html = katex.renderToString(sanitized, {
      displayMode: block,
      throwOnError: false,
      output: 'html',
    });

    return (
      <span
        className={`math-rendered inline-block ${block ? 'my-2 w-full text-center overflow-x-auto' : ''} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (err) {
    // Fallback if KaTeX fails
    return (
      <code className={`font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded text-sm ${className}`}>
        {math}
      </code>
    );
  }
};

/**
 * Parses mixed text containing LaTeX math delimiters:
 * $$...$$ for block math, and $...$ or \(...\) for inline math
 */
export const MixedMathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split by $$...$$ and $...$
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g);

  return (
    <span className={`inline ${className}`}>
      {parts.map((part, idx) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const rawMath = part.slice(2, -2);
          return <MathView key={idx} math={rawMath} block={true} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const rawMath = part.slice(1, -1);
          return <MathView key={idx} math={rawMath} block={false} />;
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
};
