import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Moon, Send, Sparkles, Sun, X } from 'lucide-react';
import { ChatMarkdown } from './components/ChatMarkdown';

type Theme = 'light' | 'dark';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi — I'm **Alex Joseph AI**. Ask me about my engineering work, projects, certifications, or published articles.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, chatOpen]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const sendMessage = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      const trimmed = input.trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      };

      const history = messages
        .filter((message) => message.id !== 'welcome')
        .map((message) => ({ role: message.role, content: message.content }));

      setMessages((current) => [...current, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, history }),
        });

        const data = (await response.json()) as { reply?: string; error?: string };

        if (!response.ok) {
          const apiError = data.error ?? 'Request failed';
          const friendlyError =
            apiError === 'GEMINI_API_KEY is not configured'
              ? 'The AI agent is not configured yet. Add your GEMINI_API_KEY to a .env file in the project root, then restart the dev server.'
              : apiError;

          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: friendlyError,
            },
          ]);
          return;
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.reply ?? 'No response received.',
        };

        setMessages((current) => [...current, assistantMessage]);
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              'I could not reach the chat service. Make sure the dev server is running, or reach Alex directly at josephmudavia@gmail.com.',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages],
  );

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(event as unknown as FormEvent);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`hero-glow relative flex h-[100dvh] flex-col overflow-hidden transition-theme duration-theme ease-theme ${
        isDark ? 'bg-ultradark text-white' : 'bg-white text-obsidian'
      }`}
    >
      <header className="relative z-10 flex shrink-0 items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
        <p className="text-sm font-semibold tracking-[0.18em] text-electric sm:text-[0.8rem]">
          ALEX JOSEPH
        </p>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition-theme duration-theme ease-theme active:scale-95 dark:border-white/10 md:hover:border-electric md:hover:text-electric"
        >
          {isDark ? <Sun className="h-[1.15rem] w-[1.15rem]" /> : <Moon className="h-[1.15rem] w-[1.15rem]" />}
        </button>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-24 pt-2 sm:px-8 sm:pb-28">
        <div className="w-full max-w-[52rem] text-center">
          <h1 className="text-[clamp(1.85rem,6.5vw,4.25rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
            Building{' '}
            <span className="bg-gradient-to-r from-electric to-[#3B82F6] bg-clip-text text-transparent">
              clean digital solutions
            </span>{' '}
            to solve real-world problems.
          </h1>
        </div>
      </main>

      {!chatOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          aria-label="Open Alex Joseph AI chat"
          className="fixed bottom-5 right-5 z-50 flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-full bg-electric text-white shadow-[0_12px_40px_-8px_rgba(0,86,210,0.55)] transition-transform duration-200 active:scale-95 sm:bottom-7 sm:right-7 md:hover:scale-105"
        >
          <Sparkles className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" aria-hidden />
        </button>
      )}

      <div
        className={`fixed z-50 transition-all duration-300 ease-in-out ${
          chatOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        } inset-0 md:inset-auto md:bottom-6 md:right-6`}
      >
        <div
          className={`flex h-full w-full flex-col overflow-hidden border transition-theme duration-theme ease-theme md:h-[min(78dvh,620px)] md:w-[min(calc(100vw-3rem),28rem)] md:rounded-[1.35rem] md:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.35)] ${
            isDark
              ? 'border-white/10 bg-[#0F1420] text-white'
              : 'border-black/[0.08] bg-white text-obsidian'
          }`}
        >
          <div
            className={`flex shrink-0 items-center justify-between border-b px-4 py-3.5 sm:px-5 sm:py-4 ${
              isDark
                ? 'border-white/10 bg-gradient-to-r from-electric/10 to-transparent'
                : 'border-black/[0.06] bg-gradient-to-r from-electric/[0.06] to-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-electric text-xs font-bold text-white">
                AJ
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-inherit bg-emerald-400" />
              </div>
              <div>
                <p className="text-[0.95rem] font-semibold tracking-tight">Alex Joseph AI</p>
                <p className="text-xs opacity-55">Knowledge assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-2 transition-transform duration-200 active:scale-95 md:hover:bg-black/5 dark:md:hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="chat-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {message.role === 'assistant' && (
                  <div
                    className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isDark ? 'bg-electric/20 text-electric' : 'bg-electric/10 text-electric'
                    }`}
                  >
                    AJ
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.875rem] sm:max-w-[85%] sm:px-4 sm:py-3 sm:text-[0.9rem] ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-electric text-white shadow-md shadow-electric/20'
                      : isDark
                        ? 'rounded-bl-md border border-white/[0.06] bg-white/[0.04]'
                        : 'rounded-bl-md border border-black/[0.05] bg-[#F8FAFC]'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <ChatMarkdown content={message.content} isDark={isDark} />
                  ) : (
                    <p className="whitespace-pre-wrap leading-[1.65]">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div
                  className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDark ? 'bg-electric/20 text-electric' : 'bg-electric/10 text-electric'
                  }`}
                >
                  AJ
                </div>
                <div
                  className={`rounded-2xl rounded-bl-md border px-4 py-3.5 ${
                    isDark
                      ? 'border-white/[0.06] bg-white/[0.04]'
                      : 'border-black/[0.05] bg-[#F8FAFC]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-electric" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-electric [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-electric [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className={`shrink-0 border-t p-3.5 sm:p-4 ${
              isDark ? 'border-white/10 bg-[#0B0F19]/50' : 'border-black/[0.06] bg-[#FAFBFC]'
            }`}
            style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}
          >
            <div
              className={`flex items-end gap-2 rounded-2xl border p-2 ${
                isDark
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-black/[0.08] bg-white shadow-sm'
              }`}
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Ask about projects, experience, or tech stack..."
                rows={1}
                className={`max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed outline-none ${
                  isDark ? 'placeholder:text-white/35' : 'placeholder:text-obsidian/40'
                }`}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric text-white transition-transform duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 md:hover:brightness-110"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
