import type { CorsOptions } from 'cors';

export const allowedCorsOrigins = [
  'http://localhost:4200',
  'https://copa-nova-era-overwatch.web.app',
];

export const corsOptions: CorsOptions = {
  origin: allowedCorsOrigins,
};
