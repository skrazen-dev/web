import { trpc } from "@/lib/trpc";

const JWT_STORAGE_KEY = "app_jwt_token";

export function getStoredJwt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(JWT_STORAGE_KEY);
}

export function setStoredJwt(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(JWT_STORAGE_KEY, token);
  else localStorage.removeItem(JWT_STORAGE_KEY);
}

export function useAuth() {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setStoredJwt(null);
      utils.auth.me.setData(undefined, null);
    },
  });
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setStoredJwt(data.token);
      void utils.auth.me.invalidate();
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setStoredJwt(data.token);
      void utils.auth.me.invalidate();
    },
  });

  return {
    user: meQuery.data ?? null,
    loading: meQuery.isLoading,
    error: meQuery.error,
    isAuthenticated: Boolean(meQuery.data),
    logout: () => logoutMutation.mutate(),
    login: (email: string, password: string) =>
      loginMutation.mutateAsync({ email, password }),
    register: (email: string, password: string, name?: string) =>
      registerMutation.mutateAsync({ email, password, name }),
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    token: getStoredJwt(),
  };
}