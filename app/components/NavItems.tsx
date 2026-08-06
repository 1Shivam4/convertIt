"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { navbarItems } from "../utils/vars";
import { NavbarItemsProps } from "../utils/typeDefinitions";

export default function NavItems() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navbarItems.map((item: NavbarItemsProps) => {
        const isOpen = activeMenu === item.name;

        return (
          <div
            key={item.name}
            className="relative"
            onMouseEnter={() => setActiveMenu(item.name)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isOpen ? "text-white bg-white/10" : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{item.name}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-white" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isOpen && item.itemsList && item.itemsList.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-72 rounded-xl bg-[#141822]/95 border border-white/10 shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-white/5 mb-1 flex items-center gap-2">
                  <Image
                    src={item.icon}
                    width={16}
                    height={16}
                    alt={item.name}
                    className="w-4 h-4 opacity-80"
                  />
                  <span>{item.name} Tools</span>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {item.itemsList.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.location}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-red-500/50 group-hover:bg-red-500/10 transition-colors">
                        <Image
                          src={subItem.icon}
                          width={18}
                          height={18}
                          alt={subItem.name}
                          className="w-4 h-4"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200 group-hover:text-red-400 transition-colors">
                          {subItem.name}
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">
                          {subItem.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
