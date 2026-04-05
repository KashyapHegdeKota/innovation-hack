import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

// Request interceptor — use demo token for now (swap back to Firebase later)
apiClient.interceptors.request.use(
  async (config) => {
    config.headers.Authorization = "Bearer demo-user-001";
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
