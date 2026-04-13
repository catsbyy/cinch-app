import { motion } from "framer-motion";
import styles from "./ChoiceCard.module.css";

type Props = {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick: () => void;
  icon?: string; // эмодзи или короткий символ
};

export function ChoiceCard({ title, subtitle, selected, onClick, icon }: Props) {
  return (
    <motion.button
      type="button"
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      onClick={onClick}
      /* 👇 добавляем */
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        e.currentTarget.style.setProperty("--mx", `${x}px`);
        e.currentTarget.style.setProperty("--my", `${y}px`);
      }}
      /* 👇 начальные значения */
      style={
        {
          "--mx": "50%",
          "--my": "50%",
        } as React.CSSProperties
      }
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className={styles.top}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <div className={styles.text}>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      </div>

      <div className={styles.glow} aria-hidden="true" />
    </motion.button>
  );
}
