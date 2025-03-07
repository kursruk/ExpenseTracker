import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  locale: string;
  username: string;
  password: string;
  currency: string;
}

interface SettingsStore extends Settings {
  updateSettings: (settings: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      locale: 'en',
      username: '',
      password: '',
      currency: 'USD',
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
    }),
    {
      name: 'expense-tracker-settings',
    }
  )
);

export const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  RUB: '₽',
  RSD: 'RSD'
};