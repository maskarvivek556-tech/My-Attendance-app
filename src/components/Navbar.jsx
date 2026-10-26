"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  MessageCircle,
  CircleHelp,
  LogOut,
  Bell,
  X,
  Send,
  CheckCheck,
  Clock,
  Users,
  CalendarCheck,
  BookOpen,
  ChevronRight,
} from "lucide-react";

import {
  clearSession,
  dashboardForRole,
  getSessionSnapshot,
  parseSession,
  subscribeToSession,
} from "@/lib/session";

import { readData } from "@/lib/api";
import { readAccounts } from "@/lib/auth";
import { isSubjectAssignedToFaculty, normalizeCourse } from "@/lib/courses";
import useHydrated from "@/lib/useHydrated";
import styles from "./Navbar.module.css";

const pagesByRole = {
  admin: [
    {
      title: "Admin Dashboard",
      href: "/admin",
      terms: "overview dashboard administration",
    },
    {
      title: "Manage Faculty",
      href: "/admin/faculty",
      terms: "faculty staff teacher",
    },
    {
      title: "Manage Subjects",
      href: "/admin/subjects",
      terms: "subjects courses classes",
    },
    {
      title: "Accounts",
      href: "/admin/accounts",
      terms: "accounts users access",
    },
    {
      title: "Attendance Requests",
      href: "/admin/attendance-requests",
      terms: "review faculty correction changes missed attendance requests",
    },
  ],

  faculty: [
    {
      title: "Faculty Dashboard",
      href: "/faculty",
      terms: "overview dashboard",
    },
    {
      title: "Manage Students",
      href: "/faculty/students",
      terms: "students student records learners",
    },
    {
      title: "Mark Attendance",
      href: "/faculty/attendance",
      terms: "attendance present absent camera photo",
    },
    {
      title: "Attendance Reports",
      href: "/faculty/reports",
      terms: "reports dates attendance records",
    },
  ],

  student: [
    {
      title: "Student Portal",
      href: "/students",
      terms: "my attendance portal records history",
    },
  ],
};

function buildSearchResults(query, session) {
  const normalized = query.trim().toLowerCase();

  if (!normalized || !session) {
    return [];
  }

  const pages = pagesByRole[session.role] || [];

  const results = pages
    .filter((page) =>
      `${page.title} ${page.terms}`.toLowerCase().includes(normalized)
    )
    .map((page) => ({ ...page, kind: "Page" }));

  const matches = (values) =>
    values.filter((value) =>
      String(value ?? "").toLowerCase().includes(normalized)
    );

  const addRecord = (title, detail, href) => {
    results.push({ title, detail, href, kind: "Record" });
  };

  const subjectCatalog = readData("subjects", []);

  const facultyMember =
    session.role === "faculty"
      ? readData("faculty", []).find(
          (person) =>
            person.email?.toLowerCase() === session.email?.toLowerCase()
        )
      : null;

  const visibleSubjects =
    session.role === "admin"
      ? subjectCatalog
      : subjectCatalog.filter(
          (subject) =>
            facultyMember &&
            isSubjectAssignedToFaculty(subject, facultyMember)
        );

  if (session.role === "admin" || session.role === "faculty") {
    matches(
      readData("students", []).flatMap((student) => {
        const fields = [
          student.name,
          student.rollNo,
          student.email,
          student.course,
        ];

        return fields.some((field) =>
          String(field ?? "").toLowerCase().includes(normalized)
        )
          ? [student]
          : [];
      })
    )
      .slice(0, 5)
      .forEach((student) => {
        addRecord(
          student.name,
          `Student · Roll no. ${student.rollNo}`,
          session.role === "admin" ? "/admin" : "/faculty/students"
        );
      });

    if (session.role === "admin") {
      matches(
        readData("attendanceChangeRequests", []).flatMap((request) =>
          [
            request.studentName,
            request.rollNo,
            request.subject,
            request.date,
            request.status,
          ].some((field) =>
            String(field ?? "").toLowerCase().includes(normalized)
          )
            ? [request]
            : []
        )
      )
        .slice(0, 5)
        .forEach((request) => {
          addRecord(
            `${request.studentName} · ${request.status} request`,
            `Attendance change · ${request.subject} · ${request.date}`,
            "/admin/attendance-requests"
          );
        });

      matches(
        readData("faculty", []).flatMap((person) =>
          [person.name, person.email, person.department].some((field) =>
            String(field ?? "").toLowerCase().includes(normalized)
          )
            ? [person]
            : []
        )
      )
        .slice(0, 5)
        .forEach((person) => {
          addRecord(
            person.name,
            `Faculty · ${person.department || person.email}`,
            "/admin/faculty"
          );
        });

      matches(
        readAccounts().flatMap((account) =>
          [account.name, account.email, account.role, account.rollNo].some(
            (field) =>
              String(field ?? "").toLowerCase().includes(normalized)
          )
            ? [account]
            : []
        )
      )
        .slice(0, 5)
        .forEach((account) => {
          addRecord(
            account.name,
            `Account · ${account.role} · ${account.email}`,
            "/admin/accounts"
          );
        });
    }

    matches(
      visibleSubjects.flatMap((subject) =>
        [subject.name, subject.faculty].some((field) =>
          String(field ?? "").toLowerCase().includes(normalized)
        )
          ? [subject]
          : []
      )
    )
      .slice(0, 5)
      .forEach((subject) => {
        addRecord(
          subject.name,
          `Subject · ${subject.course || "Course not assigned"} · ${
            subject.semester
              ? `Semester ${subject.semester}`
              : "Semester not assigned"
          } · ${subject.faculty || "Faculty not assigned"}`,
          session.role === "admin" ? "/admin/subjects" : "/faculty/attendance"
        );
      });

    const visibleSubjectIds = new Set(
      visibleSubjects.map((subject) => String(subject.id))
    );

    const allAttendance = readData("attendance", []);

    const visibleAttendance =
      session.role === "admin"
        ? allAttendance
        : allAttendance.filter((record) =>
            record.subjectId != null
              ? visibleSubjectIds.has(String(record.subjectId))
              : visibleSubjects.some(
                  (subject) =>
                    subject.name === record.subject &&
                    (!record.course ||
                      normalizeCourse(subject.course) ===
                        normalizeCourse(record.course)) &&
                    (!record.semester ||
                      Number(subject.semester) === Number(record.semester))
                )
          );

    matches(
      visibleAttendance.flatMap((record) =>
        [
          record.studentName,
          record.rollNo,
          record.subject,
          record.date,
          record.status,
        ].some((field) =>
          String(field ?? "").toLowerCase().includes(normalized)
        )
          ? [record]
          : []
      )
    )
      .slice(0, 5)
      .forEach((record) => {
        addRecord(
          `${record.studentName} · ${record.status}`,
          `Attendance · ${record.subject} · ${record.date}`,
          session.role === "admin" ? "/admin" : "/faculty/reports"
        );
      });
  } else if (session.role === "student") {
    const ownStudent = readData("students", []).find(
      (student) =>
        String(student.rollNo ?? "").toLowerCase() ===
          String(session.rollNo ?? "").toLowerCase() &&
        String(student.email ?? "").toLowerCase() ===
          String(session.email ?? "").toLowerCase()
    );

    const ownRecords = readData("attendance", []).filter(
      (record) => ownStudent && record.studentId === ownStudent.id
    );

    if (
      ownStudent &&
      [
        ownStudent.name,
        ownStudent.rollNo,
        ownStudent.email,
        ownStudent.course,
      ].some((field) =>
        String(field ?? "").toLowerCase().includes(normalized)
      )
    ) {
      addRecord(
        ownStudent.name,
        `Your student profile · Roll no. ${ownStudent.rollNo}`,
        "/students"
      );
    }

    matches(
      ownRecords.flatMap((record) =>
        [record.subject, record.date, record.status].some((field) =>
          String(field ?? "").toLowerCase().includes(normalized)
        )
          ? [record]
          : []
      )
    )
      .slice(0, 5)
      .forEach((record) => {
        addRecord(
          `${record.subject} · ${record.status}`,
          `Attendance · ${record.date}`,
          "/students"
        );
      });
  }

  return results.slice(0, 8);
}

function getChatReply(message) {
  const text = message.toLowerCase();

  if (
    text.includes("attendance") ||
    text.includes("present") ||
    text.includes("photo")
  ) {
    return "To record attendance, open Mark Attendance, select a course, semester, and assigned subject, then use the matching student roster. Capture a photo to mark a student Present. Save Attendance when finished.";
  }

  if (text.includes("student")) {
    return "Open Students from the sidebar to add, edit, or remove student records. Assign each student to a course and semester.";
  }

  if (text.includes("report")) {
    return "Open Reports from the sidebar to review attendance records. You can filter reports by course, semester, date, subject, and status.";
  }

  if (
    text.includes("subject") ||
    text.includes("faculty") ||
    text.includes("account")
  ) {
    return "Administrators can manage faculty, subjects, and accounts from the sidebar. Faculty can view assigned subjects and manage attendance.";
  }

  if (
    text.includes("login") ||
    text.includes("password") ||
    text.includes("sign")
  ) {
    return "If you cannot sign in, verify your email and password. Contact your administrator if your account needs to be created or reset.";
  }

  return "I can help with attendance, student records, reports, subjects, faculty, accounts, or sign-in. Tell me which area you need help with.";
}

/*
  Demo notifications.
  These can later be connected to your real notification data/API.
*/
const initialNotifications = [
  {
    id: 1,
    title: "Welcome to AttendEase",
    message: "Your workspace is ready to use.",
    time: "Just now",
    type: "general",
    read: false,
    href: null,
  },
  {
    id: 2,
    title: "Attendance reminder",
    message: "Remember to review your attendance records.",
    time: "5 minutes ago",
    type: "attendance",
    read: false,
    href: null,
  },
  {
    id: 3,
    title: "Workspace update",
    message: "Check the dashboard for the latest information.",
    time: "10 minutes ago",
    type: "general",
    read: false,
    href: null,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();

  const sessionSnapshot = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null
  );

  const session = useMemo(
    () => parseSession(sessionSnapshot),
    [sessionSnapshot]
  );

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [chatInput, setChatInput] = useState("");

  const [chatMessages, setChatMessages] = useState([
    {
      from: "assistant",
      text: "Hi! I’m the AttendEase helper. Ask me about attendance, students, or reports.",
    },
  ]);

  const [notifications, setNotifications] = useState(initialNotifications);

  const results = useMemo(
    () => buildSearchResults(query, session),
    [query, session]
  );

  const authenticatedPath = pathname !== "/" && pathname !== "/login";

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  function logout() {
    if (clearSession()) {
      router.replace("/login");
    }
  }

  function sendChatMessage(event) {
    event.preventDefault();

    const text = chatInput.trim();

    if (!text) return;

    setChatMessages((messages) => [
      ...messages,
      { from: "user", text },
      { from: "assistant", text: getChatReply(text) },
    ]);

    setChatInput("");
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") {
      setSearchOpen(false);
      event.currentTarget.blur();
    } else if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      setSearchOpen(false);
      setQuery("");
      router.push(results[0].href);
    }
  }

  function openNotifications() {
    setPanel((current) =>
      current === "notifications" ? null : "notifications"
    );
  }

  function markAllNotificationsRead() {
    setNotifications((items) =>
      items.map((item) => ({ ...item, read: true }))
    );
  }

  function markNotificationRead(id) {
    setNotifications((items) =>
      items.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  }

  function openNotification(notification) {
    markNotificationRead(notification.id);
    setPanel(null);

    if (notification.href) {
      router.push(notification.href);
    }
  }

  return (
    <>
      <header className={styles.header}>
        <Link
          href={session ? dashboardForRole(session.role) : "/login"}
          className={styles.logo}
        >
          <span className={styles.logoIcon}>A</span>

          <span>
            Attend<span className={styles.logoAccent}>Ease</span>
          </span>
        </Link>

        {hydrated && session && authenticatedPath && (
          <>
            <div className={styles.searchArea}>
              <label className={styles.searchBox}>
                <Search size={19} aria-hidden="true" />

                <input
                  type="search"
                  role="combobox"
                  value={query}
                  placeholder="Search pages and records..."
                  aria-label="Search pages and records"
                  aria-expanded={searchOpen && Boolean(query.trim())}
                  aria-autocomplete="list"
                  aria-controls="site-search-results"
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  onBlur={() =>
                    setTimeout(() => setSearchOpen(false), 150)
                  }
                />

                {query && (
                  <button
                    type="button"
                    className={styles.clearSearch}
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                  >
                    <X size={17} />
                  </button>
                )}
              </label>

              {searchOpen && query.trim() && (
                <div
                  className={styles.searchResults}
                  id="site-search-results"
                  role="listbox"
                  aria-label="Search results"
                >
                  {results.length ? (
                    results.map((result, index) => (
                      <Link
                        key={`${result.href}-${result.title}-${index}`}
                        href={result.href}
                        className={styles.searchResult}
                        role="option"
                        onClick={() => {
                          setSearchOpen(false);
                          setQuery("");
                        }}
                      >
                        <span className={styles.resultTitle}>
                          {result.title}
                        </span>

                        <span className={styles.resultDetail}>
                          {result.detail || result.kind}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className={styles.noResults}>
                      No matching pages or records found.
                    </p>
                  )}
                </div>
              )}
            </div>

            <nav
              className={styles.actions}
              aria-label="Account and support"
            >
              <button
                type="button"
                className={styles.utilityButton}
                onClick={() => setPanel("chat")}
                title="Chat"
              >
                <MessageCircle size={17} />
                <span>Chat</span>
              </button>

              <button
                type="button"
                className={styles.utilityButton}
                onClick={() => setPanel("help")}
                title="Help"
              >
                <CircleHelp size={17} />
                <span>Help</span>
              </button>

              <div className={styles.notificationWrapper}>
                <button
                  type="button"
                  className={`${styles.iconButton} ${
                    panel === "notifications" ? styles.iconButtonActive : ""
                  }`}
                  onClick={openNotifications}
                  aria-label={`Notifications, ${unreadCount} unread`}
                  aria-expanded={panel === "notifications"}
                  title="Notifications"
                >
                  <Bell size={20} />

                  {unreadCount > 0 && (
                    <span className={styles.notificationBadge}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {panel === "notifications" && (
                  <section
                    className={styles.notificationDropdown}
                    aria-label="Notifications"
                  >
                    <div className={styles.notificationHeader}>
                      <div>
                        <h2>Notifications</h2>

                        <p>
                          {unreadCount > 0
                            ? `${unreadCount} unread notification${
                                unreadCount > 1 ? "s" : ""
                              }`
                            : "You are all caught up"}
                        </p>
                      </div>

                      <button
                        type="button"
                        className={styles.markAllButton}
                        onClick={markAllNotificationsRead}
                        disabled={unreadCount === 0}
                        title="Mark all as read"
                      >
                        <CheckCheck size={16} />
                        <span>Read all</span>
                      </button>
                    </div>

                    <div className={styles.notificationList}>
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <button
                            type="button"
                            key={notification.id}
                            className={`${styles.notificationItem} ${
                              !notification.read
                                ? styles.notificationUnread
                                : ""
                            }`}
                            onClick={() =>
                              openNotification(notification)
                            }
                          >
                            <span
                              className={`${styles.notificationIcon} ${
                                notification.type === "attendance"
                                  ? styles.attendanceIcon
                                  : styles.generalIcon
                              }`}
                            >
                              {notification.type === "attendance" ? (
                                <CalendarCheck size={19} />
                              ) : (
                                <BookOpen size={19} />
                              )}
                            </span>

                            <span className={styles.notificationText}>
                              <strong>{notification.title}</strong>

                              <span>{notification.message}</span>

                              <small>
                                <Clock size={12} />
                                {notification.time}
                              </small>
                            </span>

                            {!notification.read && (
                              <span
                                className={styles.unreadDot}
                                aria-label="Unread"
                              />
                            )}

                            <ChevronRight
                              className={styles.notificationArrow}
                              size={15}
                            />
                          </button>
                        ))
                      ) : (
                        <div className={styles.emptyNotifications}>
                          <Bell size={28} />
                          <strong>No notifications</strong>
                          <p>New notifications will appear here.</p>
                        </div>
                      )}
                    </div>

                    <div className={styles.notificationFooter}>
                      <span>
                        <Users size={14} />
                        AttendEase updates
                      </span>
                    </div>
                  </section>
                )}
              </div>

              <button
                className={styles.logoutButton}
                onClick={logout}
                type="button"
                title="Log out"
              >
                <LogOut size={17} />
                <span>Log out</span>
              </button>
            </nav>
          </>
        )}
      </header>

      {panel === "chat" && (
        <div
          className={styles.panelBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPanel(null);
          }}
        >
          <section
            className={styles.chatPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-title"
          >
            <header className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <span className={styles.panelTitleIcon}>
                  <MessageCircle size={20} />
                </span>

                <div>
                  <h2 id="chat-title">AttendEase Chat</h2>
                  <p>In-app help assistant</p>
                </div>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label="Close chat"
                onClick={() => setPanel(null)}
              >
                <X size={20} />
              </button>
            </header>

            <div className={styles.chatHistory} aria-live="polite">
              {chatMessages.map((message, index) => (
                <p
                  key={`${message.from}-${index}`}
                  className={
                    message.from === "user"
                      ? styles.userMessage
                      : styles.assistantMessage
                  }
                >
                  {message.text}
                </p>
              ))}
            </div>

            <form className={styles.chatForm} onSubmit={sendChatMessage}>
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask a question..."
                aria-label="Your chat message"
              />

              <button type="submit" disabled={!chatInput.trim()}>
                <Send size={16} />
                <span>Send</span>
              </button>
            </form>
          </section>
        </div>
      )}

      {panel === "help" && (
        <div
          className={styles.panelBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPanel(null);
          }}
        >
          <section
            className={`${styles.chatPanel} ${styles.helpPanel}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
          >
            <header className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <span className={styles.panelTitleIcon}>
                  <CircleHelp size={21} />
                </span>

                <div>
                  <h2 id="help-title">Help &amp; quick guide</h2>
                  <p>How to use AttendEase</p>
                </div>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label="Close help"
                onClick={() => setPanel(null)}
              >
                <X size={20} />
              </button>
            </header>

            <div className={styles.helpContent}>
              <section>
                <h3>Find things quickly</h3>
                <p>
                  Use the top search bar to find pages and available records.
                  Select a result to open it.
                </p>
              </section>

              {session?.role !== "student" && (
                <section>
                  <h3>Take attendance</h3>
                  <p>
                    Choose a date and subject, then open the camera for each
                    student. Save attendance when finished.
                  </p>
                </section>
              )}

              {session?.role === "faculty" && (
                <section>
                  <h3>Manage students and reports</h3>
                  <p>
                    Use the sidebar to maintain student records and review
                    attendance reports.
                  </p>
                </section>
              )}

              {session?.role === "admin" && (
                <section>
                  <h3>Manage your workspace</h3>
                  <p>
                    Use the sidebar to manage faculty, subjects, accounts,
                    and attendance change requests.
                  </p>
                </section>
              )}

              {session?.role === "student" && (
                <section>
                  <h3>View your attendance</h3>
                  <p>
                    Your portal shows your attendance summary, profile, and
                    attendance history.
                  </p>
                </section>
              )}

              <section>
                <h3>Need more assistance?</h3>
                <p>
                  Open Chat and describe the page or task you need help with.
                </p>
              </section>
            </div>
          </section>
        </div>
      )}
    </>
  );
}