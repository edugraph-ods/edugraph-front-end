import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { COURSES, Course, CourseStatus } from './use-course';

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
}

export const useDashboard = (): UseDashboardReturn => {
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [selectedCareer, setSelectedCareer] = useState<string>('');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [expandedCycles, setExpandedCycles] = useState<number[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const router = useRouter();


  const cycles = useMemo(() => {
    const cyclesSet = new Set<number>();
    COURSES.forEach(course => cyclesSet.add(course.cycle));
    return Array.from(cyclesSet).sort((a, b) => a - b);
  }, []);


  const updateFilteredCourses = useCallback((cycle: number | null) => {
    if (!cycle) {
      setFilteredCourses([]);
      return;
    }
    setFilteredCourses(COURSES.filter(course => course.cycle === cycle));
  }, []);


  const handleCareerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const career = e.target.value;
    setSelectedCareer(career);
  }, []);


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
    // Toggle selection
    const newSelectedId = selectedCourseId === courseId ? null : courseId;
    setSelectedCourseId(newSelectedId);
    
    // Find the selected course
    const course = COURSES.find(c => c.id === courseId);
    if (course) {
      // Update the selected cycle to the course's cycle
      setSelectedCycle(course.cycle);
      // Ensure the cycle is expanded
      setExpandedCycles(prev => 
        prev.includes(course.cycle) ? prev : [...prev, course.cycle]
      );
    }
    
    // Update filtered courses based on the selection
    if (newSelectedId) {
      updateFilteredCourses(course?.cycle || null);
    } else {
      updateFilteredCourses(null);
    }
  }, [selectedCourseId, updateFilteredCourses]);


  const handleLogout = useCallback(() => {
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
    selectedCourseId,
    expandedCycles,
    filteredCourses,
    courses,
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
  };
};