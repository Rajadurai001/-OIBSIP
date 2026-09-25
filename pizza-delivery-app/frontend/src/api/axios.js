import axios from 'axios';

// Two instances so a user token and an admin token are never mixed up -
// each attaches its own token from localStorage under its own key.
const api = axios.create({ baseURL: '/api' });
const adminApi = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export { api, adminApi };
