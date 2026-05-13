import type { AuthContext } from './middleware/auth';

declare module 'elysia' {
  interface SingletonBase {
    derive: {
      auth: AuthContext | null;
    };
  }
}