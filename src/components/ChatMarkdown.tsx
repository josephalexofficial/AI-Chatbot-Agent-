import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMarkdownProps {
  content: string;
  isDark: boolean;
  inverted?: boolean;
}

export function ChatMarkdown({ content, isDark, inverted = false }: ChatMarkdownProps) {
  const linkClass = inverted
    ? 'font-medium underline decoration-white/40 underline-offset-2'
    : 'font-medium text-electric underline decoration-electric/30 underline-offset-2';

  const codeClass = inverted
    ? 'rounded bg-white/15 px-1.5 py-0.5 text-[0.85em] font-mono'
    : isDark
      ? 'rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] font-mono text-white/90'
      : 'rounded bg-black/[0.06] px-1.5 py-0.5 text-[0.85em] font-mono text-obsidian';

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2.5 last:mb-0 leading-[1.65] [&:not(:first-child)]:mt-0">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic opacity-90">{children}</em>,
        ul: ({ children }) => (
          <ul className="my-2.5 space-y-1.5 pl-4 [list-style-type:disc] marker:text-electric">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-2.5 space-y-1.5 pl-4 [list-style-type:decimal] marker:font-medium marker:text-electric">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-[1.6] pl-0.5">{children}</li>,
        h1: ({ children }) => (
          <h3 className="mb-2 mt-1 text-base font-bold tracking-tight">{children}</h3>
        ),
        h2: ({ children }) => (
          <h4 className="mb-2 mt-3 text-sm font-bold tracking-tight">{children}</h4>
        ),
        h3: ({ children }) => (
          <h5 className="mb-1.5 mt-2.5 text-sm font-semibold">{children}</h5>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {children}
          </a>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <code className="block overflow-x-auto font-mono text-[0.8em] leading-relaxed">
                {children}
              </code>
            );
          }
          return <code className={codeClass}>{children}</code>;
        },
        pre: ({ children }) => (
          <pre
            className={`my-2.5 overflow-x-auto rounded-xl border px-3 py-2.5 text-xs ${
              inverted
                ? 'border-white/15 bg-white/10'
                : isDark
                  ? 'border-white/10 bg-black/20'
                  : 'border-black/8 bg-black/[0.03]'
            }`}
          >
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote
            className={`my-2.5 border-l-2 pl-3 italic opacity-90 ${
              inverted ? 'border-white/40' : 'border-electric/50'
            }`}
          >
            {children}
          </blockquote>
        ),
        hr: () => (
          <hr
            className={`my-3 border-0 border-t ${
              inverted ? 'border-white/15' : isDark ? 'border-white/10' : 'border-black/8'
            }`}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
