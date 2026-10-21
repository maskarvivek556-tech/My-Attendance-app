
import styles from "./DashboardCard.module.css";

export default function DashboardCard({
  title,
  value,
  description,
}) {
  return (
    <article className={styles.card}>
      <p className={styles.title}>{title}</p>
      <h2 className={styles.value}>{value}</h2>
      {description && (
        <p className={styles.description}>{description}</p>
      )}
    </article>
  );
}
