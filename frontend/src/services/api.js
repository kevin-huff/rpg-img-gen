import axios from 'axios'
import { getApiUrl } from '../utils/environment'

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true, // Include cookies for sessions
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on authentication error
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
)

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  getStatus: () => api.get('/auth/status'),
}

// Scenes API
export const scenesAPI = {
  getAll: (params = {}) => api.get('/scenes', { params }),
  getById: (id) => api.get(`/scenes/${id}`),
  create: (data) => api.post('/scenes', data),
  update: (id, data) => api.put(`/scenes/${id}`, data),
  delete: (id) => api.delete(`/scenes/${id}`),
}

// Characters API
export const charactersAPI = {
  getAll: (params = {}) => api.get('/characters', { params }),
  getById: (id) => api.get(`/characters/${id}`),
  create: (data) => api.post('/characters', data),
  update: (id, data) => api.put(`/characters/${id}`, data),
  delete: (id) => api.delete(`/characters/${id}`),
}

// Templates API
export const templatesAPI = {
  getAll: (params = {}) => api.get('/templates', { params }),
  getById: (id) => api.get(`/templates/${id}`),
  generate: (data) => api.post('/templates/generate', data),
  delete: (id) => api.delete(`/templates/${id}`),
}

// Images API
export const imagesAPI = {
  getAll: (params = {}) => api.get('/images', { params }),
  getActive: () => api.get('/images/active'),
  upload: (formData) => api.post('/images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  activate: (id) => api.put(`/images/${id}/activate`),
  hide: () => api.put('/images/hide'),
  setCaption: (caption) => api.put('/images/caption', { caption }),
  delete: (id) => api.delete(`/images/${id}`),
}

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
}

export default api
