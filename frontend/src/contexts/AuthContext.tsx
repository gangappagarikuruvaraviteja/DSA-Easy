import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { USE_SPRING_BOOT, SPRING_API_BASE_URL } from '@/config/backend';
import { setAuthToken } from '@/services/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function readResponseBody<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as T;
  }
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await readResponseBody<any>(res);
  if (body?.message || body?.error) {
    return body.message || body.error;
  }

  if (res.status === 401 || res.status === 403) {
    return 'Invalid email or password';
  }

  if (res.status === 409) {
    return 'An account with that email or username already exists';
  }

  if (res.status === 400) {
    return 'Please check your input and try again';
  }

  return fallback;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_SPRING_BOOT) {
      // Check if Spring Boot token exists
      const token = localStorage.getItem("token") || localStorage.getItem("spring_jwt_token");
      if (token) {
        // Verify token by calling /api/auth/me
        fetch(`${SPRING_API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(async (res) => {
            const userData = await readResponseBody<any>(res);
            if (!res.ok) {
              throw new Error(userData.message || "Invalid token");
            }
            return userData;
          })
          .then((userData) => {
            setAuthToken(token);
            setUser({
              id: userData.id,
              email: userData.email,
              user_metadata: { username: userData.username, display_name: userData.displayName },
            } as any);
          })
          .catch(() => {
            setAuthToken(null);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      // Supabase auth flow
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    if (USE_SPRING_BOOT) {
      const res = await fetch(`${SPRING_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, "Registration failed"));
      }
      const data = await readResponseBody<any>(res);
      setAuthToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        user_metadata: { username: data.user.username, display_name: data.user.displayName },
      } as any);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: username },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (USE_SPRING_BOOT) {
      const res = await fetch(`${SPRING_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, "Login failed"));
      }
      const data = await readResponseBody<any>(res);
      setAuthToken(data.token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        user_metadata: { username: data.user.username, display_name: data.user.displayName },
      } as any);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  };

  const signOut = async () => {
    if (USE_SPRING_BOOT) {
      const token = localStorage.getItem("token") || localStorage.getItem("spring_jwt_token");
      if (token) {
        try {
          await fetch(`${SPRING_API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // Ignore logout network issues and clear local session anyway.
        }
      }
      setAuthToken(null);
      setUser(null);
    } else {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
