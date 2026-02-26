import { defineSecret } from 'firebase-functions/params';

export const JWT_SECRET = defineSecret('JWT_SECRET');
export const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
export const APP_URL = defineSecret('APP_URL');

export const AUTH_SECRETS = [JWT_SECRET, RESEND_API_KEY, APP_URL];
