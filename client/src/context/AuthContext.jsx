import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { api, TOKEN_KEY } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveSession = useCallback(({ token, user: sessionUser }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(sessionUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(
    async (credentials) => {
      const response = await api.post("/auth/login", credentials);
      saveSession(response.data);
      return response.data.user;
    },
    [saveSession],
  );

  const register = useCallback(
    async (details) => {
      const response = await api.post("/auth/register", details);
      saveSession(response.data);
      return response.data.user;
    },
    [saveSession],
  );

  const updateProfile = useCallback(async (details) => {
    const response = await api.patch("/users/me", details);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const deleteAccount = useCallback(
    async (currentPassword) => {
      await api.delete("/users/me", { data: { currentPassword } });
      clearSession();
    },
    [clearSession],
  );

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isLoading,
      deleteAccount,
      login,
      logout: clearSession,
      register,
      updateProfile,
      user,
    }),
    [clearSession, deleteAccount, isLoading, login, register, updateProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
