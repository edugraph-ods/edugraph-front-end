import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { COURSES, Course, CourseStatus } from './use-course';
import { useGraphApi } from '@/hooks/use-graph';

export const CAREERS = [
  { id: 'cs', name: 'Ciencias de la Computación' },
  { id: 'se', name: 'Ingeniería de Software' },
  { id: 'it', name: 'Tecnologías de la Información' },
  { id: 'is', name: 'Ingeniería de Sistemas' },
];

interface UseDashboardReturn {
  selectedCycle: number | null;
  selectedCareer: string;
  selectedCourseId: string | null;
  expandedCycles: number[];
  filteredCourses: Course[];
  courses: Course[];
  visibleCourses: Course[];

  handleCareerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleClearFilters: () => void;
  handleLogout: () => void;
  toggleCycle: (cycle: number) => void;
  handleSelectCycle: (cycle: number | null) => void;
  handleCourseSelect: (courseId: string) => void;
  toggleCourseStatus: (courseId: string, e: React.MouseEvent) => void;
  updateCourseStatus: (courseId: string, status: CourseStatus) => void;

  CAREERS: typeof CAREERS;
  cycles: number[];
  careers: Array<{ id: string; name: string }>;
}

export const useDashboard = (): UseDashboardReturn => {
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [selectedCareer, setSelectedCareer] = useState<string>('');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [expandedCycles, setExpandedCycles] = useState<number[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const router = useRouter();
  const { getCourses, ingest } = useGraphApi();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        let backendCourses = await getCourses();
        if (!backendCourses || backendCourses.length === 0) {
          backendCourses = await ingest({});
        }
        if (cancelled) return;
        const extractCodes = (value: unknown): string[] => {
          const out = new Set<string>();
          if (typeof value === 'string') {
            const matches = value.match(/[A-Za-z]{2,}\d{1,}/g) || [];
            matches.forEach((m) => out.add(m.trim()));
          } else if (value && typeof value === 'object') {
            const v = value as { code?: unknown; id?: unknown; name?: unknown };
            const raw =
              (typeof v.code === 'string' ? v.code :
               typeof v.id === 'string' ? v.id :
               typeof v.name === 'string' ? v.name :
               '')
              .trim();
            if (raw) {
              const matches = raw.match(/[A-Za-z]{2,}\d{1,}/g) || [raw];
              matches.forEach((m) => out.add(m.trim()));
            }
          }
          return Array.from(out);
        };

        const getTrimmedString = (value: unknown): string =>
          typeof value === 'string' ? value.trim() : '';

        const codesMap = new Map<string, string>();
        (backendCourses || []).forEach((item) => {
          const rawCode = typeof item?.code === 'string' ? item.code.trim() : '';
          if (rawCode) {
            const normalized = rawCode.toLowerCase();
            if (!codesMap.has(normalized)) codesMap.set(normalized, rawCode);
          }
        });

        const mapPrereq = (value: string): string | null => {
          const raw = value.trim();
          if (!raw) return null;
          const normalized = raw.toLowerCase();
          if (codesMap.has(normalized)) return codesMap.get(normalized)!;
          const local = COURSES.find(cc => cc.id.toLowerCase() === normalized);
          if (local) return local.id;
          return raw;
        };

        const mapped: Course[] = (backendCourses || []).map((c) => {
          const code = (c.code || '').trim();
          const local = COURSES.find(cc => cc.id.toLowerCase() === code.toLowerCase());
          let normalizedPrereqs: string[] = [];
          if (Array.isArray(c.prerequisites)) {
            normalizedPrereqs = c.prerequisites.flatMap((p: unknown) => extractCodes(p));
          } else if (typeof c.prerequisites === 'string') {
            normalizedPrereqs = extractCodes(c.prerequisites);
          } else if (local?.prerequisites?.length) {
            normalizedPrereqs = [...local.prerequisites];
          }

          normalizedPrereqs = Array.from(new Set(normalizedPrereqs.map((id) => {
            const mappedId = mapPrereq(id);
            return mappedId ?? id;
          })));

          const rawUniversity = getTrimmedString((c as { university?: unknown }).university);
          const rawProgram = getTrimmedString((c as { program?: unknown }).program);
          const rawCareer = getTrimmedString((c as { career?: unknown }).career);

          const backendCredits = (typeof c.credits === 'number')
            ? c.credits
            : Number((c as unknown as { credits?: unknown }).credits) || 0;
          const localCredits = typeof local?.credits === 'number' ? local.credits : 0;
          const credits = localCredits > 0 ? localCredits : backendCredits;
          const cycle = (typeof c.cycle === 'number' && c.cycle > 0) ? c.cycle : (local?.cycle ?? c.cycle);
          const rawName = (() => {
            if (!c || typeof c !== 'object') return '';
            const record = c as Record<string, unknown>;
            const entries = Object.entries(record);
            const upperCode = code.toUpperCase();
            const blacklist = new Set([upperCode, 'Nombre del curso', 'Nombre del Curso', 'Nombre del curso']);

            const preferredKeys = [
              'name', 'Nombre del curso', 'nombre del curso',
              'nombre_curso', 'nombreCurso', 'course_name', 'courseName',
              'titulo', 'title', 'Nombre'
            ];
            for (const key of preferredKeys) {
              const raw = Object.prototype.hasOwnProperty.call(record, key)
                ? (record as Record<string, unknown>)[key]
                : undefined;
              const value = getTrimmedString(raw);
              if (value && !blacklist.has(value.trim())) return value;
            }

            for (const [key, value] of entries) {
              if (typeof value !== 'string') continue;
              const normalizedKey = key.toLowerCase().replace(/[\s_]+/g, '');
              if (normalizedKey.includes('nombre') && normalizedKey.includes('curso')) {
                const v = value.trim();
                if (v && !blacklist.has(v)) return v;
              }
            }

            const nameLike = entries
              .filter(([key, value]) => {
                if (typeof value !== 'string') return false;
                const normalizedKey = key.toLowerCase().replace(/[\s_]+/g, '');
                return normalizedKey.includes('name') || normalizedKey.includes('nombre');
              })
              .map(([, value]) => (value as string).trim())
              .filter((val) => val && !blacklist.has(val));
            if (nameLike.length) {
              nameLike.sort((a, b) => b.length - a.length);
              return nameLike[0];
            }

            const blacklistValues = new Set<string>([
              rawUniversity.toUpperCase(),
              rawProgram.toUpperCase(),
              rawCareer.toUpperCase(),
            ]);
            const candidateStrings = entries
              .filter(([, value]) => typeof value === 'string')
              .map(([, value]) => (value as string).trim())
              .filter((val) => {
                if (!val) return false;
                const up = val.toUpperCase();
                if (blacklist.has(up)) return false;
                if (blacklistValues.has(up)) return false;
                if (val.toLowerCase().startsWith('http')) return false;
                if (/^[A-Za-z]{2,}\d{2,}$/.test(val)) return false;
                return true;
              })
              .sort((a, b) => b.length - a.length);
            return candidateStrings[0] || '';
          })();
          const decodedName = (() => {
            if (!rawName) return '';
            const upperCode = code.toUpperCase();
            const normalizedName = rawName.replace(/\s+/g, ' ').trim();
            if (normalizedName.toUpperCase() === upperCode) {
              return local?.name ?? '';
            }
            if (normalizedName.toUpperCase().includes(upperCode)) {
              const parts = normalizedName.split(/[;,]|\s+-\s+|\(|\)/)
                .map(part => part.trim())
                .filter(Boolean);
              const candidate = parts.find(part => part && part.toUpperCase() !== upperCode);
              if (candidate) return candidate;
              return local?.name ?? '';
            }
            return normalizedName;
          })();
          const name = decodedName || local?.name || rawName || code;

          return {
            id: code,
            name,
            credits,
            cycle: typeof cycle === 'number' ? cycle : (local?.cycle ?? 0),
            prerequisites: normalizedPrereqs,
            career: rawCareer || undefined,
            university: rawUniversity || undefined,
            program: rawProgram || undefined,
            status: 'not_taken',
            isInStudyPlan: true,
          } as Course;
        });
        if (mapped.length > 0) {
          setCourses(mapped);
        }
      } catch {
      }
    };
    load();
    return () => { cancelled = true; };
  }, [getCourses, ingest]);

  const cycles = useMemo(() => {
    const cyclesSet = new Set<number>();
    courses.forEach(course => cyclesSet.add(course.cycle));
    return Array.from(cyclesSet).sort((a, b) => a - b);
  }, [courses]);

  const careers = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((c) => {
      const name = (c.career || '').trim();
      if (name) map.set(name.toLowerCase(), name);
    });
    return Array.from(map.values())
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, name }));
  }, [courses]);


  const updateFilteredCourses = useCallback((cycle: number | null) => {
    if (!cycle) {
      setFilteredCourses([]);
      return;
    }
    setFilteredCourses(courses.filter(course => course.cycle === cycle));
  }, [courses]);


  const handleCareerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const career = e.target.value;
    setSelectedCareer(career);
  }, []);

  const visibleCourses = useMemo(() => {
    const normalize = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const selected = normalize(selectedCareer);
    if (!selected) return courses;
    return courses.filter((course) => normalize(course.career || '') === selected);
  }, [courses, selectedCareer]);


  const handleSelectCycle = useCallback((cycle: number | null) => {
    setSelectedCycle(cycle);
    updateFilteredCourses(cycle);
  }, [updateFilteredCourses]);


  const toggleCycle = useCallback((cycle: number) => {
    setExpandedCycles(prev =>
      prev.includes(cycle)
        ? prev.filter(c => c !== cycle)
        : [...prev, cycle]
    );
  }, []);


  const handleCourseSelect = useCallback((courseId: string) => {
    const newSelectedId = selectedCourseId === courseId ? null : courseId;
    setSelectedCourseId(newSelectedId);
    
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCycle(course.cycle);
      setExpandedCycles(prev => 
        prev.includes(course.cycle) ? prev : [...prev, course.cycle]
      );
    }
    
    if (newSelectedId) {
      updateFilteredCourses(course?.cycle || null);
    } else {
      updateFilteredCourses(null);
    }
  }, [selectedCourseId, updateFilteredCourses, courses]);


  const handleLogout = useCallback(() => {
    try {
      if (typeof document !== 'undefined') {
        document.cookie = 'auth-token=; path=/; max-age=0';
      }
    } catch {
    }

    setSelectedCycle(null);
    setSelectedCareer('');
    setExpandedCycles([]);
    setFilteredCourses([]);
    setSelectedCourseId(null);
    router.push('/');
  }, [router]);


  const handleClearFilters = useCallback(() => {
    setSelectedCycle(null);
    setSelectedCareer('');
    setExpandedCycles([]);
    setFilteredCourses([]);
    setSelectedCourseId(null);
  }, []);


  const updateCourseStatus = useCallback((courseId: string, status: CourseStatus) => {
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course.id === courseId ? { ...course, status } : course
      )
    );
  }, []);

  const toggleCourseStatus = useCallback((courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const statusMap: Record<CourseStatus, CourseStatus> = {
      'not_taken': 'approved',
      'approved': 'failed',
      'failed': 'not_taken'
    };
    
    updateCourseStatus(courseId, statusMap[course.status || 'not_taken']);
  }, [courses, updateCourseStatus]);

  return {
    selectedCycle,
    selectedCareer,
    selectedCourseId,
    expandedCycles,
    filteredCourses,
    courses,
    visibleCourses,
    handleCareerChange,
    handleClearFilters,
    handleLogout,
    toggleCycle,
    handleSelectCycle,
    handleCourseSelect,
    toggleCourseStatus,
    updateCourseStatus,
    CAREERS,
    cycles,
    careers,
  };
};