import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const alertsApi = {
  getAll: () => apiClient.get('/alerts'),
  getById: (id: number) => apiClient.get('/alerts/' + id),
  getStats: () => apiClient.get('/alerts/stats/summary'),
  updateStatus: (id: number, status: string) => 
    apiClient.put('/alerts/' + id + '/status?status=' + status),
};

export const incidentsApi = {
  getAll: () => apiClient.get('/incidents'),
  getById: (id: number) => apiClient.get('/incidents/' + id),
  updateStatus: (id: number, status: string) => 
    apiClient.put('/incidents/' + id + '?status=' + status),
};

export const mitreApi = {
  getTechniques: () => apiClient.get('/mitre/techniques'),
};

export const correlationApi = {
  correlate: () => apiClient.get('/correlate'),
};
