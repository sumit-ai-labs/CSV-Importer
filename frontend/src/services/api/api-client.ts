import axios from 'axios';
import { env } from '../../config/env';

export const apiInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
