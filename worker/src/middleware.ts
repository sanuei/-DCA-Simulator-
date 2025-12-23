import { Context, Next } from 'hono';
import { Bindings } from './types';
import { errorResponse } from './utils';
import { verify } from 'hono/jwt';

export const adminAuth = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  const adminPassword = c.env.ADMIN_PASSWORD;
  const providedPassword = c.req.header('X-Admin-Password');

  if (!adminPassword || providedPassword !== adminPassword) {
    return errorResponse(c, 'Unauthorized Admin Access', 401);
  }

  await next();
};

export const userAuth = async (c: Context<{ Bindings: Bindings, Variables: { userId: string } }>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(c, 'Missing or invalid Authorization header', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    if (!payload.sub) {
      throw new Error('Invalid token payload');
    }
    c.set('userId', payload.sub as string);
    await next();
  } catch (e) {
    return errorResponse(c, 'Invalid or expired token', 401);
  }
};

