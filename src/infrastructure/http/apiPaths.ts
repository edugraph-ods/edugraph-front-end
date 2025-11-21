const rawPrefix = (process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1").trim();
const sanitizedPrefix = rawPrefix.endsWith("/") ? rawPrefix.slice(0, -1) : rawPrefix;

const joinPaths = (base: string, path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
};

const pathFromEnv = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : fallback;
};

const replaceTokens = (template: string, tokens: Record<string, string>) => {
  let result = template;
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replaceAll(`{${key}}`, value).replaceAll(`:${key}`, value);
  }
  return result;
};

export const withPrefix = (path: string) => joinPaths(sanitizedPrefix, path);

// Authentication
export const PATH_SIGN_UP = pathFromEnv(process.env.NEXT_PUBLIC_PATH_SIGN_UP, withPrefix("/sign-up"));
export const PATH_SIGN_IN = pathFromEnv(process.env.NEXT_PUBLIC_PATH_SIGN_IN, withPrefix("/sign-in"));

// Users 
export const PATH_USERS_RECOVERY_CODE = pathFromEnv(
  process.env.NEXT_PUBLIC_PATH_USERS_RECOVERY_CODE,
  withPrefix("/users/recovery-code")
);
export const PATH_USERS_VERIFY_RECOVERY_CODE = pathFromEnv(
  process.env.NEXT_PUBLIC_PATH_USERS_VERIFY_RECOVERY_CODE,
  withPrefix("/users/verify-recovery-code")
);
export const PATH_USERS_RESET_PASSWORD = pathFromEnv(
  process.env.NEXT_PUBLIC_PATH_USERS_RESET_PASSWORD,
  withPrefix("/users/reset-password")
);

// Students
export const PATH_STUDENTS_ME = pathFromEnv(process.env.NEXT_PUBLIC_PATH_STUDENTS_ME, withPrefix("/students/me"));

// Universities
export const PATH_UNIVERSITIES = pathFromEnv(process.env.NEXT_PUBLIC_PATH_UNIVERSITIES, withPrefix("/universities"));
const UNIVERSITIES_CAREERS_TEMPLATE = pathFromEnv(
  process.env.NEXT_PUBLIC_PATH_UNIVERSITIES_CAREERS,
  withPrefix("/universities/{university_id}/careers")
);
export const buildUniversityCareersPath = (universityId: string) =>
  replaceTokens(UNIVERSITIES_CAREERS_TEMPLATE, {
    university_id: encodeURIComponent(universityId),
  });

// Careers
export const PATH_CAREERS = pathFromEnv(process.env.NEXT_PUBLIC_PATH_CAREERS, withPrefix("/careers"));
const CAREER_COURSES_TEMPLATE = pathFromEnv(
  process.env.NEXT_PUBLIC_PATH_CAREERS_COURSES,
  withPrefix("/careers/{career_id}/courses")
);
const CAREER_PROGRESS_TEMPLATE = pathFromEnv(
  process.env.NEXT_PUBLIC_PATH_CAREERS_PROGRESS,
  withPrefix("/careers/{career_id}/progress")
);
export const buildCareerCoursesPath = (careerId: string) =>
  replaceTokens(CAREER_COURSES_TEMPLATE, {
    career_id: encodeURIComponent(careerId),
  });
export const buildCareerProgressPath = (careerId: string) =>
  replaceTokens(CAREER_PROGRESS_TEMPLATE, {
    career_id: encodeURIComponent(careerId),
  });

// Courses
const COURSE_BY_ID_TEMPLATE = pathFromEnv(
  process.env.NEXT_PUBLIC_PATH_COURSES_BY_ID,
  withPrefix("/courses/{course_id}")
);
export const buildCourseByIdPath = (courseId: string) =>
  replaceTokens(COURSE_BY_ID_TEMPLATE, {
    course_id: encodeURIComponent(courseId),
  });
