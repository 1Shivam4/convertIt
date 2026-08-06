import { create } from "zustand";
import { NavbarItemsProps } from "../utils/typeDefinitions";
import { navbarItems } from "../utils/vars";

interface ApplicationStoreProps {
  theme: string;
  setTheme: (theme: string) => void;
  navItem: NavbarItemsProps | null;
  setNavItem: (name: string | null) => void;
}

export const useApplicationStore = create<ApplicationStoreProps>((set) => ({
  theme: "light",
  setTheme: (theme) => set({ theme: theme }),
  navItem: null,
  setNavItem: (name) =>
    set({ navItem: navbarItems.find((nav) => nav.name === name) }),
}));
