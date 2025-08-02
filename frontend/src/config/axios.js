import axios from 'axios'
import toast from 'react-hot-toast'

// Get base URL from environment variables or default to localhost
// In production (Vercel), use relative path to same domain; in development, use localhost
const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')

console.log('Environment:', import.meta.env.MODE)
console.log('Base URL:', BASE_URL)
console.log('VITE_REACT_APP_API_URL:', import.meta.env.VITE_REACT_APP_API_URL)

// Create and configure axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Log request for debugging
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful response for debugging
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data, error.config?.url)
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// Export the configured axios instance as default
export default axiosInstance