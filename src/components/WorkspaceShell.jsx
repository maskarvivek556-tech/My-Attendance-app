"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import styles from "./WorkspaceShell.module.css";

export default function WorkspaceShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`${styles.shell} ${
        collapsed ? styles.collapsed : ""
      }`}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />

      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}