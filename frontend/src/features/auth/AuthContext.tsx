import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest, logout as logoutRequest, refreshSession } from "./api";
import { decodeJwt } from "./jwt";
import type { AuthUser } from "./types";

interface AuthContextValue {
  status: "checking" | "anonymous" | "authenticated";
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Access tokens stay in memory; the backend owns hard-refresh restoration through an HTTP-only refresh cookie.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue["status"]>("checking");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearSession = useCallback(() => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const applyToken = useCallback(
    (newToken: string): AuthUser => {
      const decoded = decodeJwt(newToken);
      const authenticatedUser: AuthUser = {
        userId: decoded.userId,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role,
        managerId: decoded.managerId,
      };

      setToken(newToken);
      setUser(authenticatedUser);
      setStatus("authenticated");

      const msUntilExpiry = decoded.exp * 1000 - Date.now();
      logoutTimer.current = setTimeout(clearSession, Math.max(msUntilExpiry, 0));

      return authenticatedUser;
    },
    [clearSession],
  );

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      try {
        const response = await refreshSession();
        if (!isActive) {
          return;
        }

        if (response) {
          applyToken(response.token);
          return;
        }
      } catch {
        // If the refresh check fails, treat the user as signed out.
      }

      if (isActive) {
        clearSession();
      }
    }

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, [applyToken, clearSession]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const { token: newToken } = await loginRequest(email, password);
      return applyToken(newToken);
    },
    [applyToken],
  );

  const value: AuthContextValue = {
    status,
    user,
    token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
