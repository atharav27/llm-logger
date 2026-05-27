"use client";

// components/chat/MarkdownMessage.tsx
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  // ── Headings ──
  h1: ({ children, ...props }) => (
    <h1 className="text-xl font-bold mt-4 mb-2 text-zinc-200" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-lg font-bold mt-3 mb-2 text-zinc-200" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-base font-bold mt-3 mb-1 text-zinc-200" {...props}>{children}</h3>
  ),

  // ── Paragraphs ──
  p: ({ children, ...props }) => (
    <p className="mb-3 last:mb-0 leading-relaxed" {...props}>{children}</p>
  ),

  // ── Bold / Italic ──
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-zinc-200" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }) => <em className="italic" {...props}>{children}</em>,

  // ── Lists ──
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside mb-3 space-y-1 ml-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside mb-3 space-y-1 ml-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>{children}</li>
  ),

  // ── Code (inline + block) ──
  code: ({ children, className, node, ...props }: any) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code
          className="block bg-zinc-900 text-green-300 p-4 rounded-lg text-sm font-mono overflow-x-auto my-3 whitespace-pre"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-zinc-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre className="bg-zinc-900 rounded-lg my-3 overflow-x-auto" {...props}>
      {children}
    </pre>
  ),

  // ── Blockquotes ──
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-4 border-purple-500 pl-4 my-3 text-zinc-400 italic" {...props}>
      {children}
    </blockquote>
  ),

  // ── Horizontal Rule ──
  hr: (props) => <hr className="border-zinc-700 my-4" {...props} />,

  // ── Links ──
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-400 underline hover:text-purple-300 transition-colors"
      {...props}
    >
      {children}
    </a>
  ),

  // ── Tables ──
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse" {...props}>{children}</table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border border-zinc-700 bg-zinc-800 px-3 py-2 text-left font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-zinc-700 px-3 py-2" {...props}>{children}</td>
  ),
};

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}
