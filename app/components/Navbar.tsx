import Image from "next/image";
import styles from "./navbar.module.css";
import NavItems from "./NavItems";

export default function Navbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className="flex items-center gap-2">
          <Image
            src="/icons/loop.svg"
            width={32}
            height={32}
            alt="logo"
            loading="eager"
            className={styles.logo}
          />
          <h1 className={styles.heading}> ConvertIt</h1>
        </div>

        <NavItems />

        <div className="flex gap-2">
          <button className="btn">Signup</button>
          <button className="btn">Login</button>
        </div>
      </nav>
    </header>
  );
}
