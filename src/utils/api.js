import axios from 'axios';
import toast from 'react-hot-toast';

const config = window.ecareConfig || { apiUrl: '', nonce: '' };

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'X-WP-Nonce': config.nonce,
    'Content-Type': 'application/json',
  },
});

// Sanitize URLs to prevent double slashes (e.g., v1//payouts -> v1/payouts)
api.interceptors.request.use((config) => {
  // Remove leading slash from relative paths so axios doesn't double-slash with baseURL
  if (config.url && config.url.startsWith('/')) {
    config.url = config.url.substring(1);
  }
  // Collapse any remaining double slashes after the protocol (http:// is protected)
  if (config.url) {
    config.url = config.url.replace(/([^:])\/\/+/g, '$1/');
  }
  return config;
});

// Helper for generic API operations with toast
export const apiOp = async (operation, successMsg, errorMsg) => {
  try {
    const response = await operation();
    if (successMsg) {
      if (typeof successMsg === 'object') {
        toast.success(successMsg.text, { icon: successMsg.icon });
      } else {
        toast.success(successMsg);
      }
    }
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message || errorMsg;
    toast.error(msg);
    throw error;
  }
};

export default api;
