import Sidebar from "@/components/Sidebar";
import styles from "./WorkspaceShell.module.css";

export default function WorkspaceShell({ children }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
