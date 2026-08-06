import NavInfo from "../components/NavInfo";
import styles from "../page.module.css";

export default function PublicPage() {
  return (
    <div className={styles.hero_container}>
      <NavInfo />

      <div className={styles.hero}>
        <div className="flex flex-col items-start md:w-1/2 ">
          <h2 className="">Convert Any File</h2>
          <p>
            Drop a file and pick what to turn it into. CloudConvert handles 200+
            formats across documents, images, audio, video, archives and more —
            straight from your browser.
          </p>
        </div>

        <div
          className={`${styles.hero_file_convert} w-1/2
        `}
        >
          <div className="w-11 border-2 border-slate-600"></div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
