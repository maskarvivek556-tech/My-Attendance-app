
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthGate from "@/components/AuthGate";
import AnimatedBackdrop from "@/components/AnimatedBackdrop";
import WorkspaceShell from "@/components/WorkspaceShell";

export const metadata = {
  title: "AttendEase | Attendance Management",
  description:
    "Student, faculty and attendance management system",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AnimatedBackdrop />
        <Navbar />
        <WorkspaceShell>
          <AuthGate>{children}</AuthGate>
        </WorkspaceShell>
      </body>
    </html>
  );
}
