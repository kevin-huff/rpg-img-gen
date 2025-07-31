// Environment-aware utility functions
export const getBaseUrl = () => {
  return import.meta.env.PROD ? window.location.origin : 'http://localhost:3000'
}

export const getApiUrl = () => {
  return import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'
}

export const getSocketUrl = () => {
  return import.meta.env.PROD ? window.location.origin : 'http://localhost:3000'
}
