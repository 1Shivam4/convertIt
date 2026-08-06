"use client";

import { navbarItems } from "../utils/vars";
import styles from "./navbar.module.css";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useApplicationStore } from "../store/useApplicationStore";

export default function NavItems() {
  const { navItem, setNavItem } = useApplicationStore();

  return (
    <ul className="flex gap-6">
      {navbarItems.map((item) => (
        <li
          key={item.icon}
          className={styles.nav_item}
          onMouseEnter={() => setNavItem(item.name)}
          onMouseLeave={() => setNavItem(null)}
        >
          <span>{item.name}</span>

          {navItem?.name === item.name ? <ChevronUp /> : <ChevronDown />}
        </li>
      ))}
    </ul>
  );
}
