import styles from "./CourseSelector.module.css";
import { COURSES } from "@/lib/courses";

export default function CourseSelector({ selectedCourse, onSelect }) {
  return (
    <fieldset className={styles.selector}>
      <legend className={styles.label}>Select course</legend>
      <div className={styles.options}>
        {COURSES.map((course) => (
          <button
            key={course}
            type="button"
            className={`${styles.option} ${selectedCourse === course ? styles.selected : ""}`}
            aria-pressed={selectedCourse === course}
            onClick={() => onSelect(course)}
          >
            {course}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
