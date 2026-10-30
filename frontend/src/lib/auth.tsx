"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api, setSessionExpiredHandler } from "./api";
import type { SessionUser, User } from "./types";

const STORAGE_KEY = "gappay:user";

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  login: (phone: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function writeStored(user: SessionUser | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage mavjud bo'lmasligi mumkin */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUserState] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const setUser = useCallback((next: SessionUser | null) => {
    setUserState(next);
    writeStored(next);
  }, []);

  useEffect(() => {
    // localStorage faqat brauzerda mavjud — hydration'dan keyin o'qiymiz
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserState(readStored());
    setReady(true);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      router.replace("/login");
    });
    return () => setSessionExpiredHandler(null);
  }, [router, setUser]);

  const login = useCallback(
    async (phone: string, password: string) => {
      const data = await api.post<SessionUser>(
        "/auth/login",
        { phone, password },
        { skipRefresh: true },
      );
      setUser(data);
      return data;
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", undefined, { skipRefresh: true });
    } catch {
      /* cookie allaqachon eskirgan bo'lishi mumkin */
    }
    setUser(null);
    router.replace("/login");
  }, [router, setUser]);

  const refreshUser = useCallback(async () => {
    const current = readStored();
    if (!current) return;
    const fresh = await api.get<User>(`/user/${current.id}`);
    setUser({ ...current, ...fresh });
  }, [setUser]);

  const value = useMemo(
    () => ({ user, ready, login, logout, refreshUser, setUser }),
    [user, ready, login, logout, refreshUser, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
