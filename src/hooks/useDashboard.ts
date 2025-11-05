import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Course, CourseStatus } from './use-course';

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
    plannedCourseIds: string[];
    totalPlannedCredits: number;
    creditLimit: number | null;
    isOverCreditLimit: boolean;
    selectionError?: string;

    handleCareerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleClearFilters: () => void;
    handleLogout: () => void;
    toggleCycle: (cycle: number) => void;
    handleSelectCycle: (cycle: number | null) => void;
    handleCourseSelect: (courseId: string) => void;
    toggleCourseStatus: (courseId: string, e: React.MouseEvent) => void;
    updateCourseStatus: (courseId: string, status: CourseStatus) => void;
    togglePlannedCourse: (courseId: string) => void;

    CAREERS: typeof CAREERS;
    cycles: number[];
}

export const useDashboard = (): UseDashboardReturn & { setCoursesList: (courses: Course[]) => void; careers: { id: string; name: string }[]; setCreditLimit: (n: number | null) => void } => {
    const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCareer, setSelectedCareer] = useState<string>('');
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [expandedCycles, setExpandedCycles] = useState<number[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [plannedCourseIds, setPlannedCourseIds] = useState<string[]>([]);
    const [selectionError, setSelectionError] = useState<string>("");
    const [creditLimit, setCreditLimit] = useState<number | null>(null);
    const router = useRouter();

    const cycles = useMemo(() => {
        const cyclesSet = new Set<number>();
        courses.forEach(course => cyclesSet.add(course.cycle));
        return Array.from(cyclesSet).sort((a, b) => a - b);
    }, [courses]);

    const careers = useMemo(() => {
        const values = new Set<string>();
        courses.forEach(c => { if (c.career) values.add(c.career); });
        return Array.from(values).sort().map(v => ({ id: v, name: v }));
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

    useEffect(() => {
        const statuses: Record<string, CourseStatus> = {};
        for (const c of courses) statuses[c.id] = c.status;
        try { localStorage.setItem('eg_statuses', JSON.stringify(statuses)); } catch {}
    }, [courses]);

    useEffect(() => {
        try { localStorage.setItem('eg_planned', JSON.stringify(plannedCourseIds)); } catch {}
    }, [plannedCourseIds]);

    useEffect(() => {
        try { localStorage.setItem('eg_career', selectedCareer || ''); } catch {}
    }, [selectedCareer]);

    useEffect(() => {
        try {
            if (typeof creditLimit === 'number' && creditLimit > 0) {
                localStorage.setItem('eg_credit', String(creditLimit));
            } else {
                localStorage.removeItem('eg_credit');
            }
        } catch {}
    }, [creditLimit]);

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
        const course = courses.find(c => c.id === courseId);
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
    }, [selectedCourseId, updateFilteredCourses, courses]);

    const handleLogout = useCallback(() => {
        router.push('/');
    }, [router]);

    const handleClearFilters = useCallback(() => {
        setSelectedCycle(null);
        setSelectedCareer('');
        setExpandedCycles([]);
        setFilteredCourses([]);
        setSelectedCourseId(null);
        setPlannedCourseIds([]);
    }, []);

    const updateCourseStatus = useCallback((courseId: string, status: CourseStatus) => {
        setCourses(prevCourses => {
            const map = new Map(prevCourses.map(c => [c.id, c] as const));
            const target = map.get(courseId);
            if (target && status === 'approved') {
                const approvedSet = new Set(prevCourses.filter(c => c.status === 'approved').map(c => c.id));
                const ok = (target.prerequisites || []).every(p => approvedSet.has(p));
                if (!ok) {
                    setSelectionError(`No se puede aprobar ${courseId} sin prerrequisitos aprobados`);
                    return prevCourses;
                }
            }
            return prevCourses.map(course => course.id === courseId ? { ...course, status } : course);
        });
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

    const togglePlannedCourse = useCallback((courseId: string) => {
        setPlannedCourseIds(prev => {
            if (prev.includes(courseId)) {
                return prev.filter(id => id !== courseId);
            }
            const course = courses.find(c => c.id === courseId);
            if (!course) return prev;
            const approvedSet = new Set(courses.filter(c => c.status === 'approved').map(c => c.id));
            const ok = (course.prerequisites || []).every(p => approvedSet.has(p));
            if (!ok) {
                setSelectionError(`Seleccione primero los prerrequisitos de ${courseId}`);
                return prev;
            }
            return [...prev, courseId];
        });
    }, [courses]);

    const totalPlannedCredits = useMemo(() => {
        if (plannedCourseIds.length === 0) return 0;
        const map = new Map(courses.map(c => [c.id, c.credits] as const));
        return plannedCourseIds.reduce((sum, id) => sum + (map.get(id) || 0), 0);
    }, [plannedCourseIds, courses]);

    const isOverCreditLimit = typeof creditLimit === 'number' ? totalPlannedCredits > creditLimit : false;

    const setCoursesList = useCallback((list: Course[]) => {
        const storedStatuses = (() => {
            try { return JSON.parse(localStorage.getItem('eg_statuses') || '{}') as Record<string, CourseStatus>; } catch { return {}; }
        })();
        const storedPlanned = (() => {
            try { return JSON.parse(localStorage.getItem('eg_planned') || '[]') as string[]; } catch { return []; }
        })();
        const storedCareer = localStorage.getItem('eg_career') || '';
        const storedCredit = localStorage.getItem('eg_credit');
        const merged = list.map(c => ({ ...c, status: storedStatuses[c.id] || c.status }));
        setCourses(merged);
        setSelectedCycle(null);
        setFilteredCourses([]);
        setExpandedCycles([]);
        setSelectedCourseId(null);
        setPlannedCourseIds(Array.isArray(storedPlanned) ? storedPlanned.filter(id => merged.some(c => c.id === id)) : []);
        if (storedCareer) setSelectedCareer(storedCareer);
        if (storedCredit) {
            const v = Number(storedCredit);
            if (Number.isFinite(v) && v > 0) setCreditLimit(v); else setCreditLimit(null);
        }
    }, []);

    return {
        selectedCycle,
        selectedCareer,
        selectedCourseId,
        expandedCycles,
        filteredCourses,
        courses,
        plannedCourseIds,
        totalPlannedCredits,
        creditLimit,
        isOverCreditLimit,
        selectionError,
        handleCareerChange,
        handleClearFilters,
        handleLogout,
        toggleCycle,
        handleSelectCycle,
        handleCourseSelect,
        toggleCourseStatus,
        updateCourseStatus,
        togglePlannedCourse,
        CAREERS,
        cycles,
        setCoursesList,
        careers,
        setCreditLimit,
    };
};