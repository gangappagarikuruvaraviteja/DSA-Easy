// Spring Boot API Service Layer
// Configure VITE_SPRING_API_URL in your environment or it defaults to localhost:8081

import { SPRING_API_BASE_URL } from "@/config/backend";

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

// ── Token management ──

let authToken: string | null = localStorage.getItem("token") || localStorage.getItem("spring_jwt_token");

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("spring_jwt_token", token);
  } else {
    localStorage.removeItem("token");
    localStorage.removeItem("spring_jwt_token");
  }
};

export const getAuthToken = () => authToken;

// ── Core request function ──

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, isFormData = false } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  const config: RequestInit = {
    method,
    signal: controller.signal,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${SPRING_API_BASE_URL}${endpoint}`, config);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please check if backend is running.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  if (response.status === 401) {
    setAuthToken(null);
    window.location.href = "/auth";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
      const text = await response.text();
      let message = "Request failed";

      if (text.trim()) {
        try {
          const error = JSON.parse(text);
          message = error.message || error.error || text;
        } catch {
          message = text;
        }
      }

      if ((response.status === 401 || response.status === 403) && message === "Request failed") {
        message = "Invalid email or password";
      }

      if (response.status === 409 && message === "Request failed") {
        message = "An account with that email or username already exists";
      }

      throw new Error(message || `HTTP ${response.status}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

// ── Generic CRUD helper ──

export function createCrudApi<T>(resource: string) {
  return {
    getAll: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<T[]>(`/${resource}${query}`);
    },
    getById: (id: string | number) => request<T>(`/${resource}/${id}`),
    create: (data: Partial<T>) =>
      request<T>(`/${resource}`, { method: "POST", body: data }),
    update: (id: string | number, data: Partial<T>) =>
      request<T>(`/${resource}/${id}`, { method: "PUT", body: data }),
    delete: (id: string | number) =>
      request<void>(`/${resource}/${id}`, { method: "DELETE" }),
  };
}

// ── Auth API ──

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  register: (email: string, password: string, username: string) =>
    request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: { email, password, username },
    }),

  me: () => request<any>("/auth/me"),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
    }),
};

// ── Domain APIs for AlgoCoach ──

// Problems — GET /api/problems, GET /api/problems/:id
export const problemsApi = {
  ...createCrudApi<any>("problems"),
  getByTopic: (topic: string) =>
    request<any[]>(`/problems?topic=${encodeURIComponent(topic)}`),
  getByDifficulty: (difficulty: string) =>
    request<any[]>(`/problems?difficulty=${encodeURIComponent(difficulty)}`),
  search: (query: string) =>
    request<any[]>(`/problems?search=${encodeURIComponent(query)}`),
  getFiltered: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/problems?${query}`);
  },
};

// User progress — GET /api/progress, POST /api/progress
export const progressApi = {
  getAll: () => request<any[]>("/progress"),
  getByProblemId: (problemId: number) =>
    request<any>(`/progress/${problemId}`),
  markSolved: (problemId: number) =>
    request<any>("/progress", {
      method: "POST",
      body: { problemId, solved: true },
    }),
};

// Profiles — GET /api/profiles/me, PUT /api/profiles/me
export const profilesApi = {
  getMe: () => request<any>("/profiles/me"),
  update: (data: any) =>
    request<any>("/profiles/me", { method: "PUT", body: data }),
  getLeaderboard: () => request<any[]>("/profiles/leaderboard"),
};

// Daily challenge — GET /api/daily-challenge
export const dailyChallengeApi = {
  getToday: () => request<any>("/daily-challenge"),
  markSolved: () =>
    request<any>("/daily-challenge/solve", { method: "POST" }),
};

// Code validation — POST /api/validate-code
export const validateCodeApi = {
  run: (data: {
    code: string;
    language: string;
    problemTitle: string;
    problemDescription: string;
    examples: { input: string; output: string }[];
    constraints: string[];
  }) =>
    request<any>("/validate-code/run", { method: "POST", body: data }),

  submit: (data: {
    code: string;
    language: string;
    problemTitle: string;
    problemDescription: string;
    examples: { input: string; output: string }[];
    constraints: string[];
  }) =>
    request<any>("/validate-code/submit", { method: "POST", body: data }),
};

// File upload
export const uploadApi = {
  upload: (file: File, endpoint = "/files/upload") => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ url: string; filename: string }>(endpoint, {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },
};

// Topics — GET /api/topics
export const topicsApi = {
  getAll: () => request<{ topic: string; count: number }[]>("/topics"),
};
