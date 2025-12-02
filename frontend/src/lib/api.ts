import axios, { AxiosHeaders } from "axios";

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type?: "personal" | "agent" | "admin";
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

// keep your interceptor if you added it
api.interceptors.request.use((config) => {
  const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (m) {
    const decoded = decodeURIComponent(m[1]);
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("X-XSRF-TOKEN", decoded);
    } else {
      config.headers = new AxiosHeaders(config.headers);
      (config.headers as AxiosHeaders).set("X-XSRF-TOKEN", decoded);
    }
  }
  return config;
});

export const initCsrf = () => api.get("/sanctum/csrf-cookie");
export const login  = (d:{email:string;password:string}) => api.post("/login", d);
export const me     = () => api.get<User>("/api/user");   // 👈 typed
export const logout = () => api.post("/logout");
