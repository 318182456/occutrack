/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ASSETS: Fetcher;
  KV: KVNamespace;
}

const CORS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ok = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });
const err = (msg: string, s = 400) => ok({ error: msg }, s);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname, searchParams } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (pathname.startsWith('/api/')) {
      try {
        // KV User Auth Endpoints
        if (pathname === '/api/auth/register' && request.method === 'POST') {
          const { username, password } = await request.json() as any;
          if (!username || !password) {
            return err('账号和密码不能为空', 400);
          }
          const userKey = username.trim().toLowerCase();
          const key = `occutrack:auth:${userKey}`;
          const existing = await env.KV.get(key);
          if (existing) {
            return err('该账号已存在，请换一个昵称或直接登录', 400);
          }
          const userId = crypto.randomUUID();
          await env.KV.put(key, JSON.stringify({ password: password.trim(), userId }));
          await env.KV.put(`occutrack:user:${userId}`, JSON.stringify([]));
          return ok({ userId, username: username.trim() });
        }

        if (pathname === '/api/auth/login' && request.method === 'POST') {
          const { username, password } = await request.json() as any;
          if (!username || !password) {
            return err('账号和密码不能为空', 400);
          }
          const userKey = username.trim().toLowerCase();
          const key = `occutrack:auth:${userKey}`;
          const val = await env.KV.get(key);
          if (!val) {
            return err('账号或密码错误', 400);
          }
          const account = JSON.parse(val);
          if (account.password !== password.trim()) {
            return err('账号或密码错误', 400);
          }
          return ok({ userId: account.userId, username: username.trim() });
        }

        // KV Data Sync Endpoints
        if (pathname === '/api/data') {
          if (request.method === 'GET') {
            const userId = searchParams.get('userId');
            if (!userId) {
              return err('Missing userId parameter', 400);
            }
            const key = `occutrack:user:${userId}`;
            const val = await env.KV.get(key);
            if (!val) {
              return ok([]);
            }
            return ok(JSON.parse(val));
          }

          if (request.method === 'POST') {
            const { userId, data } = await request.json() as any;
            if (!userId || !data) {
              return err('Missing userId or data body parameters', 400);
          }
            const key = `occutrack:user:${userId}`;
            await env.KV.put(key, JSON.stringify(data));
            return ok({ success: true });
          }

          return err('Method not allowed', 405);
        }

        return err('Endpoint not found', 404);
      } catch (error: any) {
        console.error('Error handling API request:', error);
        return err(error.message || 'Server error', 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
