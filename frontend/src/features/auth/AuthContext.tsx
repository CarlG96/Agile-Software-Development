import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest } from "./api";
import { decodeJwt } from "./jwt";
import type { AuthUser } from "./types";

interface AuthContextValue {
  status: "anonymous" | "authenticated";
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Token is held in memory only: it is lost on a hard refresh and is never renewed after the 8 hour expiry.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const logout = useCallback(() => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const { token: newToken } = await loginRequest(email, password);
      const decoded = decodeJwt(newToken);
      const authenticatedUser: AuthUser = {
        userId: decoded.userId,
        role: decoded.role,
        managerId: decoded.managerId,
      };

      setToken(newToken);
      setUser(authenticatedUser);

      const msUntilExpiry = decoded.exp * 1000 - Date.now();
      logoutTimer.current = setTimeout(logout, Math.max(msUntilExpiry, 0));

      return authenticatedUser;
    },
    [logout],
  );

  const value: AuthContextValue = {
    status: token ? "authenticated" : "anonymous",
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
