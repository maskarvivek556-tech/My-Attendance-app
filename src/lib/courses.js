export const COURSE_SEMESTERS = {
  BCA: 6,
  BBA: 6,
  MCA: 4,
};

export const COURSES = Object.keys(COURSE_SEMESTERS);

export function getCourseSemesters(course) {
  const count = COURSE_SEMESTERS[normalizeCourse(course)] || 0;
  return Array.from({ length: count }, (_, index) => index + 1);
}

export function normalizeCourse(course) {
  return typeof course === "string" ? course.trim().toUpperCase() : "";
}

export function normalizeSemester(semester) {
  const value = Number(semester);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function getStudentSemester(student) {
  return normalizeSemester(student?.semester) || 1;
}

export function isSubjectAssignedToFaculty(subject, faculty) {
  if (!faculty?.email) return false;
  const facultyEmail = faculty.email.trim().toLowerCase();
  return (
    (subject.facultyEmail && subject.facultyEmail.trim().toLowerCase() === facultyEmail) ||
    (subject.facultyId != null && String(subject.facultyId) === String(faculty.id)) ||
    (!subject.facultyId && !subject.facultyEmail &&
      subject.faculty?.trim().toLowerCase() === faculty.name?.trim().toLowerCase())
  );
}
