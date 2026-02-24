import { create } from 'zustand';

type User = { id: string; name: string; role: string; mustChangePassword?: boolean };

type State = {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (payload: { token: string; refreshToken: string; user: User }) => void;
  logout: () => void;
};

export const useAuthStore = create<State>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  setAuth: ({ token, refreshToken, user }) => set({ token, refreshToken, user }),
  logout: () => set({ token: null, refreshToken: null, user: null }),
}));
