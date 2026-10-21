"use client";

import { useEffect, useRef } from "react";
import styles from "./AnimatedBackdrop.module.css";

export default function AnimatedBackdrop() {
  const backdropRef = useRef(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return undefined;

    let animationFrame = 0;
    function moveGlow(event) {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        const x = Math.round((event.clientX / window.innerWidth) * 100);
        const y = Math.round((event.clientY / window.innerHeight) * 100);
        backdrop.style.setProperty("--pointer-x", `${x}%`);
        backdrop.style.setProperty("--pointer-y", `${y}%`);
        animationFrame = 0;
      });
    }

    window.addEventListener("pointermove", moveGlow, { passive: true });
    return () => {
      window.removeEventListener("pointermove", moveGlow);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className={styles.backdrop} ref={backdropRef} aria-hidden="true">
      <span className={styles.orbOne} />
      <span className={styles.orbTwo} />
      <span className={styles.orbThree} />
      <span className={styles.pointerGlow} />
    </div>
  );
}
