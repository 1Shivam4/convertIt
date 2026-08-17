"use client";

import { Moon } from "lucide-react";
import { useApplicationStore } from "../app/store/useApplicationStore";

export default function ToggleTheme() {
  const { setTheme, theme } = useApplicationStore();

  function handleChangeTheme() {
    const themeChanged = theme === "light" ? "dark" : "light";

    setTheme(themeChanged);
  }

  console.log(theme);
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="p-2 text-slate-400 hover:text-white rounded-md transition-colors hover:bg-white/5"
      onClick={handleChangeTheme}
    >
      <Moon className="w-4 h-4" />
    </button>
  );
}
