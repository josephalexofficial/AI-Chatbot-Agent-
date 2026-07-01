import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatRequestBody {
  message?: string;
  history?: ChatMessage[];
}

interface VercelLikeRequest {
  method?: string;
  body?: ChatRequestBody;
}

interface VercelLikeResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
    end: () => void;
  };
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new GoogleGenAI({ apiKey });
}

function setCorsHeaders(res: VercelLikeResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function loadSystemInstruction(): string {
  const identityPath = path.join(process.cwd(), 'api', 'identity.md');
  return fs.readFileSync(identityPath, 'utf-8');
}

function buildContents(history: ChatMessage[], message: string) {
  const prior = history.map((entry) => ({
    role: entry.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: entry.content }],
  }));

  return [
    ...prior,
    {
      role: 'user' as const,
      parts: [{ text: message }],
    },
  ];
}

export default async function handler(
  req: VercelLikeRequest,
  res: VercelLikeResponse,
): Promise<void> {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { message, history = [] } = req.body ?? {};

  if (!message?.trim()) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    return;
  }

  try {
    const systemInstruction = loadSystemInstruction();
    const contents = buildContents(history, message.trim());

    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const reply = response.text ?? 'I was unable to generate a response. Please try again.';

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
}

export async function readJsonBody(req: IncomingMessage): Promise<ChatRequestBody> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw) return {};

  return JSON.parse(raw) as ChatRequestBody;
}

export function createDevAdapter(
  req: IncomingMessage,
  res: ServerResponse,
  body: ChatRequestBody,
): Promise<void> {
  const adapter: VercelLikeResponse = {
    setHeader: (name, value) => {
      res.setHeader(name, value);
    },
    status: (code) => ({
      json: (payload) => {
        res.statusCode = code;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
      },
      end: () => {
        res.statusCode = code;
        res.end();
      },
    }),
  };

  return handler({ method: req.method, body }, adapter);
}
