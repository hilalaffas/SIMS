import { api } from './api';

export const getSystemLogs = async () => {
  try {
    // Tambahkan /api di depan admin/logs
    const response = await api.get('/api/admin/logs'); 
    return response;
  } catch (error) {
    throw error;
  }
};