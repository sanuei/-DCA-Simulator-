import { Context } from 'hono';

export const jsonResponse = (c: Context, data: any, status: number = 200) => {
  return c.json({
    success: true,
    data,
  }, status);
};

export const errorResponse = (c: Context, message: string, status: number = 400) => {
  return c.json({
    success: false,
    error: message,
  }, status);
};

export const generateId = () => {
  return crypto.randomUUID();
};

export const generateCode = (length: number = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, 1, O, 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

