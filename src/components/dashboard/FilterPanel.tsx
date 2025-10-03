import { FiChevronDown, FiChevronUp, FiX, FiFilter, FiBookOpen } from 'react-icons/fi';
import { Course, CourseStatus } from '@/hooks/use-course';

type StatusFilter = 'all' | CourseStatus;

interface FilterPanelProps {
  selectedCycle: number | null;
  cycles: number[];
  expandedCycles: number[];
  selectedCareer: string;
  careers: Array<{ id: string; name: string }>;
  onSelectCycle: (cycle: number | null) => void;
  onSelectCareer: (careerId: string) => void;
  onCourseStatusChange: (courseId: string, status: CourseStatus) => void;
  filteredCourses: Course[];
  onClearFilters: () => void;
  showStudyPlanOnly: boolean;
  onToggleStudyPlan: () => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
}

export const FilterPanel = ({
  selectedCycle,
  cycles,
  expandedCycles,
  selectedCareer,
  careers,
  onSelectCycle,
  onSelectCareer,
  onCourseStatusChange,
  filteredCourses,
  onClearFilters,
  showStudyPlanOnly,
  onToggleStudyPlan,
  statusFilter,
  onStatusFilterChange,
}: FilterPanelProps) => {
  const statusColors = {
    approved: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    not_taken: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const statusLabels = {
    approved: 'Aprobados',
    failed: 'Desaprobados',
    not_taken: 'No rendidos',
    all: 'Todos'
  };

  const getNextStatus = (currentStatus: CourseStatus): CourseStatus => {
    const statusOrder: CourseStatus[] = ['not_taken', 'approved', 'failed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    return statusOrder[(currentIndex + 1) % statusOrder.length];
  };

  const hasActiveFilters = selectedCycle !== null || selectedCareer !== '' || statusFilter !== 'all' || showStudyPlanOnly;

  return (
    <div className="lg:col-span-1 bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filtros</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <FiX className="mr-1" /> Limpiar filtros
          </button>
        )}
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Estado</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-2 pr-8 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="not_taken">No rendidos</option>
              <option value="approved">Aprobados</option>
              <option value="failed">Desaprobados</option>
            </select>
            <FiFilter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <button
          onClick={onToggleStudyPlan}
          className={`w-full flex items-center justify-between p-2 text-sm rounded-md border ${
            showStudyPlanOnly ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center">
            <FiBookOpen className="mr-2" />
            Mostrar solo plan de estudios
          </span>
          <div className={`w-8 h-4 flex items-center rounded-full p-1 duration-300 ease-in-out ${
            showStudyPlanOnly ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'
          }`}>
            <div className="bg-white w-3 h-3 rounded-full shadow-md"></div>
          </div>
        </button>
      </div>
      
      <div className="mb-6">
        <label htmlFor="career" className="block text-sm font-medium text-gray-700 mb-1">
          Carrera
        </label>
        <select
          id="career"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={selectedCareer}
          onChange={(e) => onSelectCareer(e.target.value)}
        >
          <option value="">Todas las carreras</option>
          {careers.map((career) => (
            <option key={career.id} value={career.id}>
              {career.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Ciclos</h3>
        <div className="space-y-2">
          {cycles.map((cycle) => (
            <div key={cycle} className="border rounded-md overflow-hidden">
              <button
                className={`w-full flex items-center justify-between p-3 text-left ${
                  selectedCycle === cycle ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => onSelectCycle(selectedCycle === cycle ? null : cycle)}
              >
                <span>Ciclo {cycle}</span>
                {expandedCycles.includes(cycle) ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              
              {expandedCycles.includes(cycle) && (
                <div className="p-2 space-y-1 bg-gray-50">
                  {filteredCourses
                    .filter((course) => course.cycle === cycle)
                    .map((course) => (
                      <div
                        key={course.id}
                        className={`px-3 py-2 text-sm rounded cursor-pointer border ${statusColors[course.status]}`}
                        onClick={() => onCourseStatusChange(course.id, getNextStatus(course.status))}
                        title={`Haz clic para cambiar el estado (${statusLabels[course.status]})`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{course.name}</span>
                          <span className="text-xs opacity-70">{statusLabels[course.status]}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
