import { create } from "zustand";

interface ApplicationStoreProps {
  theme: string;
  setTheme: (theme: string) => void;
}

export const useApplicationStore = create<ApplicationStoreProps>((set) => ({
  theme: "light",
  setTheme: (theme) => set({ theme: theme }),
}));
