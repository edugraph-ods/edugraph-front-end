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

        const mapped: Course[] = (backendCourses || []).map((c) => {
          const code = (c.code || '').trim();
          const local = COURSES.find(cc => cc.id.toLowerCase() === code.toLowerCase());
          const normalizedPrereqs = Array.isArray(c.prerequisites)
            ? c.prerequisites.flatMap((p: unknown) => extractCodes(p))
            : (local?.prerequisites || []);

          const backendCredits = (typeof c.credits === 'number')
            ? c.credits
            : Number((c as unknown as { credits?: unknown }).credits) || 0;
          const localCredits = typeof local?.credits === 'number' ? local.credits : 0;
          const credits = localCredits > 0 ? localCredits : backendCredits;
          const cycle = (typeof c.cycle === 'number' && c.cycle > 0) ? c.cycle : (local?.cycle ?? c.cycle);
          const name = (c.name && c.name.trim().length > 0) ? c.name : (local?.name ?? code);

          return {
            id: code,
            name,
            credits,
            cycle: typeof cycle === 'number' ? cycle : (local?.cycle ?? 0),
            prerequisites: normalizedPrereqs,
            career: c.career ?? undefined,
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
    setCourses([]);

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