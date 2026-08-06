"use client";
import { useApplicationStore } from "../store/useApplicationStore";
import styles from "./nav_info.module.css";

export default function NavInfo() {
  const { navItem } = useApplicationStore();

  return <div className={styles.nav_info_wrapper}></div>;
}
