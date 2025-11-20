import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Course, CourseStatus } from '@/domain/entities/course';
import { useAuth } from '@/presentation/hooks/useAuth';
import { clearAuthToken } from '@/shared/utils/authToken';
import { createDashboardPreferencesRepository } from '../infrastructure/repositories/DashboardPreferencesLocalRepository';
import { createGetStoredDashboardState } from '../application/useCases/dashboard/createGetStoredDashboardState';
import { createSaveDashboardState } from '../application/useCases/dashboard/createSaveDashboardState';
import { createClearDashboardState } from '../application/useCases/dashboard/createClearDashboardState';
import { createStaticCourseCatalogRepository } from '@/infrastructure/repositories/StaticCourseCatalogRepository';
import { createListCourses } from '@/application/useCases/courseCatalog/createListCourses';
import { createUpdateCourseStatus } from '@/application/useCases/dashboard/createUpdateCourseStatus';
import { createToggleCourseStatus } from '../application/useCases/dashboard/createToggleCourseStatus';
import { createTogglePlannedCourse } from '../application/useCases/dashboard/createTogglePlannedCourse';
import { createDashboardFiltersFacade } from '../application/useCases/dashboard/createDashboardFiltersFacade';
import type { DashboardState } from '../domain/entities/dashboard';

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
    statusColors: Record<CourseStatus, string>;
    statusLabels: Record<CourseStatus | 'all', string>;

    handleCareerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleClearFilters: () => void;
    handleLogout: () => Promise<void>;
    toggleCycle: (cycle: number) => void;
    handleSelectCycle: (cycle: number | null) => void;
    handleCourseSelect: (courseId: string) => void;
    toggleCourseStatus: (courseId: string, e: React.MouseEvent) => void;
    updateCourseStatus: (courseId: string, status: CourseStatus) => void;
    togglePlannedCourse: (courseId: string) => void;

    CAREERS: typeof CAREERS;
    cycles: number[];
}

const deriveStatuses = (courses: Course[]): Record<string, CourseStatus> => {
    return courses.reduce<Record<string, CourseStatus>>((acc, course) => {
        acc[course.id] = course.status;
        return acc;
    }, {});
};

export const useDashboard = (): UseDashboardReturn & { setCoursesList: (courses: Course[]) => void; careers: { id: string; name: string }[]; setCreditLimit: (n: number | null) => void; setSelectedCareerValue: (v: string) => void } => {
    const router = useRouter();
    const { signOut } = useAuth();

    const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCareer, setSelectedCareer] = useState<string>('');
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [expandedCycles, setExpandedCycles] = useState<number[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [plannedCourseIds, setPlannedCourseIds] = useState<string[]>([]);
    const [selectionError, setSelectionError] = useState<string>("");
    const [creditLimit, setCreditLimit] = useState<number | null>(null);
    const [hydratedPreferences, setHydratedPreferences] = useState(false);

    const preferencesRepository = useMemo(() => createDashboardPreferencesRepository(), []);
    const courseCatalogRepository = useMemo(() => createStaticCourseCatalogRepository(), []);
    const getStoredPreferences = useMemo(() => createGetStoredDashboardState(preferencesRepository), [preferencesRepository]);
    const savePreferences = useMemo(() => createSaveDashboardState(preferencesRepository), [preferencesRepository]);
    const clearPreferences = useMemo(() => createClearDashboardState(preferencesRepository), [preferencesRepository]);
    const listCourses = useMemo(() => createListCourses(courseCatalogRepository), [courseCatalogRepository]);
    const updateCourseStatusUseCase = useMemo(() => createUpdateCourseStatus(), []);
    const toggleCourseStatusUseCase = useMemo(() => createToggleCourseStatus(), []);
    const togglePlannedCourseUseCase = useMemo(() => createTogglePlannedCourse(), []);
    const dashboardFilters = useMemo(() => createDashboardFiltersFacade(), []);
    const preferencesRef = useRef<DashboardState | null>(null);

    const cycles = useMemo(() => {
        const cyclesSet = new Set<number>();
        courses.forEach(course => cyclesSet.add(course.cycle));
        return Array.from(cyclesSet).sort((a, b) => a - b);
    }, [courses]);

    const careers = useMemo(() => dashboardFilters.deriveCareers(courses), [courses, dashboardFilters]);

    useEffect(() => {
        let mounted = true;

        getStoredPreferences()
            .then((state) => {
                if (!mounted || !state) {
                    return;
                }
                preferencesRef.current = state;
                if (state.selectedCareer) {
                    setSelectedCareer(state.selectedCareer);
                }
                if (Array.isArray(state.plannedCourseIds)) {
                    setPlannedCourseIds(state.plannedCourseIds);
                }
                if (state.creditLimit !== undefined && state.creditLimit !== null) {
                    setCreditLimit(state.creditLimit);
                }
            })
            .catch((error) => {
                console.error('dashboard preferences hydrate error', error);
            })
            .finally(() => {
                if (mounted) {
                    setHydratedPreferences(true);
                }
            });

        return () => {
            mounted = false;
        };
    }, [getStoredPreferences]);

    const handleCareerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextCareer = dashboardFilters.selectCareer({
            currentCareer: selectedCareer,
            nextCareer: e.target.value,
        });
        setSelectedCareer(nextCareer);
    }, [dashboardFilters, selectedCareer]);

    const handleSelectCycle = useCallback((cycle: number | null) => {
        const result = dashboardFilters.selectCycle({
            courses,
            cycle,
            plannedCourseIds,
        });
        setSelectedCycle(result.selectedCycle);
        setFilteredCourses(result.filteredCourses);
    }, [courses, dashboardFilters, plannedCourseIds]);

    const toggleCycle = useCallback((cycle: number) => {
        setExpandedCycles(prev => dashboardFilters.toggleCycle({ expandedCycles: prev, cycle }));
    }, [dashboardFilters]);

    const handleCourseSelect = useCallback((courseId: string) => {
        const result = dashboardFilters.selectCourse({
            courses,
            courseId,
            currentSelectedCourseId: selectedCourseId,
            currentSelectedCycle: selectedCycle,
            expandedCycles,
            plannedCourseIds,
            cycle: selectedCycle,
        });

        setSelectedCourseId(result.selectedCourseId);
        setSelectedCycle(result.selectedCycle);
        setExpandedCycles(result.expandedCycles);
        setFilteredCourses(result.filteredCourses);
    }, [courses, dashboardFilters, expandedCycles, plannedCourseIds, selectedCourseId, selectedCycle]);

    const handleLogout = useCallback(async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('logout error', error);
        }

        try {
            clearAuthToken();
            await clearPreferences();
        } catch (error) {
            console.error('clear dashboard preferences error', error);
        }

        router.push('/');
    }, [clearPreferences, router, signOut]);

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
            const result = updateCourseStatusUseCase({
                courses: prevCourses,
                courseId,
                status,
                plannerOptions:
                    typeof creditLimit === 'number' && creditLimit > 0
                        ? { maxCreditsPerCycle: creditLimit }
                        : undefined,
            });

            if (result.error) {
                setSelectionError(result.error);
                return prevCourses;
            }

            setSelectionError('');
            return result.courses;
        });
    }, [creditLimit, updateCourseStatusUseCase]);

    const toggleCourseStatus = useCallback((courseId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const course = courses.find(c => c.id === courseId);
        if (!course) return;

        setCourses((prevCourses) => {
            const result = toggleCourseStatusUseCase({
                courses: prevCourses,
                courseId,
                currentStatus: course.status || 'not_taken',
            });

            if (result.error) {
                setSelectionError(result.error);
                return prevCourses;
            }

            setSelectionError('');
            return result.courses;
        });
    }, [courses, toggleCourseStatusUseCase]);

    const togglePlannedCourse = useCallback((courseId: string) => {
        setPlannedCourseIds((prev) => {
            const course = courses.find((c) => c.id === courseId);
            if (!course) {
                return prev;
            }

            const result = togglePlannedCourseUseCase({
                courses,
                plannedCourseIds: prev,
                courseId,
            });

            if (result.error) {
                setSelectionError(result.error);
                return prev;
            }

            setSelectionError('');
            return result.plannedCourseIds;
        });
    }, [courses, togglePlannedCourseUseCase]);

    const totalPlannedCredits = useMemo(() => {
        if (plannedCourseIds.length === 0) return 0;
        const map = new Map(courses.map(c => [c.id, c.credits] as const));
        return plannedCourseIds.reduce((sum, id) => sum + (map.get(id) || 0), 0);
    }, [plannedCourseIds, courses]);

    const isOverCreditLimit = typeof creditLimit === 'number' ? totalPlannedCredits > creditLimit : false;

    useEffect(() => {
        if (selectedCycle === null) {
            setFilteredCourses([]);
            return;
        }

        const filtered = dashboardFilters.filterByCycle({
            courses,
            cycle: selectedCycle,
            plannedCourseIds,
        });

        setFilteredCourses(filtered);
    }, [courses, dashboardFilters, plannedCourseIds, selectedCycle]);

    const setCoursesList = useCallback((list: Course[]) => {
        const stored = preferencesRef.current;
        const merged = list.map(course => {
            const storedStatus = stored?.statuses?.[course.id];
            return storedStatus ? { ...course, status: storedStatus } : course;
        });

        setCourses(merged);
        setSelectedCycle(null);
        setFilteredCourses([]);
        setExpandedCycles([]);
        setSelectedCourseId(null);
        setPlannedCourseIds(prev => {
            const targetIds = stored?.plannedCourseIds ?? prev;
            return targetIds.filter(id => merged.some(course => course.id === id));
        });

        if (stored?.selectedCareer) {
            setSelectedCareer(stored.selectedCareer);
        }

        if (stored?.creditLimit !== undefined) {
            setCreditLimit(stored.creditLimit);
        }

        preferencesRef.current = null;
    }, []);

    useEffect(() => {
        if (!hydratedPreferences) {
            return;
        }
        if (courses.length) {
            return;
        }

        let active = true;

        listCourses()
            .then((catalogCourses) => {
                if (!active) {
                    return;
                }
                if (!catalogCourses.length) {
                    return;
                }
                setCoursesList(catalogCourses);
            })
            .catch((error) => {
                console.error('static course catalog load error', error);
            });

        return () => {
            active = false;
        };
    }, [courses.length, hydratedPreferences, listCourses, setCoursesList]);

    useEffect(() => {
        if (!hydratedPreferences) {
            return;
        }
        if (!courses.length) {
            return;
        }

        const persist = async () => {
            try {
                await savePreferences({
                    statuses: deriveStatuses(courses),
                    plannedCourseIds,
                    selectedCareer: selectedCareer || null,
                    creditLimit,
                });
            } catch (error) {
                console.error('dashboard preferences save error', error);
            }
        };

        persist();
    }, [creditLimit, courses, hydratedPreferences, plannedCourseIds, savePreferences, selectedCareer]);

    const setSelectedCareerValue = useCallback((v: string) => {
        setSelectedCareer(v);
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
        setSelectedCareerValue,
        statusColors: dashboardFilters.statusColors,
        statusLabels: dashboardFilters.statusLabels,
    };
};