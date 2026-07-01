import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

function applyEnvToProcess(env: Record<string, string>): void {
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function apiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      applyEnvToProcess(env);

      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (!req.url?.startsWith('/api/chat')) {
            next();
            return;
          }

          try {
            applyEnvToProcess(env);
            const { readJsonBody, createDevAdapter } = await import('./api/chat');
            const body =
              req.method === 'POST' ? await readJsonBody(req) : undefined;
            await createDevAdapter(req, res, body ?? {});
          } catch (error) {
            console.error('API middleware error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        },
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), apiDevPlugin(env)],
    server: {
      port: 5173,
    },
  };
});
