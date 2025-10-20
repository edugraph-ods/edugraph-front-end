'use client';

import { useCallback, useMemo, useState } from 'react';
import { Course } from '../hooks/use-course';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionLineType,
  Connection,
  addEdge,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CourseNode, CourseNodeData } from './CourseNode';
import { useCourseGraph } from '../hooks/useCourseGraph';
import { CourseStatus } from '../hooks/use-course';

interface CourseGraphProps {
  courses: Course[];
  displayCourses?: Course[];
  selectedCycle?: number | null;
  selectedCourseId?: string | null;
  onStatusChange: (courseId: string, newStatus: CourseStatus) => void;
  onCourseSelect?: (courseId: string) => void;
}
const CourseGraph: React.FC<CourseGraphProps> = ({ 
  courses,
  displayCourses,
  selectedCycle, 
  selectedCourseId,
  onCourseSelect,
  onStatusChange 
}) => {
  const [detailCourseId, setDetailCourseId] = useState<string | null>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setEdges,
    isLoading
  } = useCourseGraph(courses);

  const scheduleCourses = displayCourses && displayCourses.length ? displayCourses : courses;

  const getCurrentStatus = useCallback((courseId: string): CourseStatus => {
    const node = nodes.find(n => n.id === courseId);
    return node?.data.status || 'not_taken';
  }, [nodes]);
  const handleStatusChange = useCallback((courseId: string, newStatus: CourseStatus) => {
    onStatusChange(courseId, newStatus);
  }, [onStatusChange]);
  const getStatusColor = useCallback((status: CourseStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border border-green-300';
      case 'failed': return 'bg-red-100 text-red-800 border border-red-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  }, []);

  const nodeTypes = useMemo(() => ({
    courseNode: (nodeProps: NodeProps<CourseNodeData>) => {
      const handleNodeStatusChange = (courseId: string, status: CourseStatus) => {
        onStatusChange(courseId, status);
      };
      
      return (
        <CourseNode id={nodeProps.id} data={nodeProps.data} onStatusChange={handleNodeStatusChange} />
      );
    }
  }), [onStatusChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const renderSchedule = () => {
    const creditLabel = (n: number) => `${n} ${n === 1 ? 'crédito' : 'créditos'}`;
    const allowedIds = new Set(scheduleCourses.map(c => c.id));
    const nodeMap = new Map(nodes.map((n) => [n.id, n] as const));

    type Item = { id: string; cycle: number; label: string; credits: number; prereqs: string[] };
    const items: Item[] = scheduleCourses.map((c) => {
      const n = nodeMap.get(c.id);
      const prereqSource = (n?.data.prerequisites ?? c.prerequisites ?? []).filter(p => allowedIds.has(p));
      return {
        id: c.id,
        cycle: c.cycle,
        label: n?.data.label ?? c.name,
        credits: typeof c.credits === 'number' ? c.credits : 0,
        prereqs: Array.from(new Set(prereqSource)),
      };
    });

    const coursesByCycle = items.reduce<Record<number, Item[]>>((acc, it) => {
      if (!acc[it.cycle]) acc[it.cycle] = [];
      acc[it.cycle].push(it);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Detalle del flujo</h3>
        {Object.entries(coursesByCycle)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([cycle, cycleItems]) => {
            const uniqueItems = Array.from(new Map(cycleItems.map(it => [it.id, it])).values());
            return (
              <div key={`cycle-${cycle}`} className="space-y-2">
                <h4 className="text-md font-medium text-gray-700">Ciclo {cycle}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {uniqueItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${
                        selectedCourseId === item.id
                          ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-300'
                          : selectedCycle === Number(cycle)
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200'
                      } hover:shadow-md transition-shadow cursor-pointer`}
                      onClick={() => {
                        onCourseSelect?.(item.id);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">{item.label}</h5>
                          <p className="text-sm text-gray-600">{creditLabel(item.credits)}</p>
                        </div>
                        <div className="relative">
                          <select
                            value={getCurrentStatus(item.id)}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as CourseStatus)}
                            onClick={(e) => e.stopPropagation()}
                            className={`px-3 py-1 rounded-full text-xs font-medium text-center min-w-[110px] cursor-pointer appearance-none ${
                              getStatusColor(getCurrentStatus(item.id))
                            } hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          >
                            <option value="not_taken">No rindió</option>
                            <option value="approved">Aprobado</option>
                            <option value="failed">Desaprobado</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                            </svg>
                          </div>
                          {selectedCourseId === item.id && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                          )}
                        </div>
                      </div>

                      {(item.prereqs.length) > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Requisitos:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.prereqs.map((prereqId, index) => {
                              const prereq = nodeMap.get(prereqId);
                              return (
                                <span
                                  key={`${prereqId}-${index}`}
                                  className="inline-block text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full cursor-pointer hover:bg-blue-100"
                                  onClick={(e) => { e.stopPropagation(); onCourseSelect?.(prereqId); }}
                                >
                                  {prereq?.data.label ?? scheduleCourses.find(c => c.id === prereqId)?.name ?? prereqId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailCourseId(item.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {selectedCourseId ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            onNodeClick={(event, node) => onCourseSelect?.(node.id)}
            connectionLineType={ConnectionLineType.SmoothStep}
            defaultEdgeOptions={{ 
              animated: false, 
              style: { 
                stroke: '#3b82f6', 
                strokeWidth: 2 
              } 
            }}
          >
            <Background gap={12} />
            <Controls />
            <MiniMap />
            <Panel position="top-right" className="bg-white p-4 rounded shadow">
              <div className="space-y-2">
                <h3 className="font-semibold">Leyenda</h3>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded-full mr-2"></div>
                  <span className="text-sm">Aprobado</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded-full mr-2"></div>
                  <span className="text-sm">Desaprobado</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded-full mr-2"></div>
                  <span className="text-sm">No rendido</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-100 border-blue-500 border-2 rounded-full mr-2"></div>
                  <span className="text-sm">Curso Crítico</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500">
            Selecciona un curso para visualizar el grafo
          </div>
        )}
      </div>
      
      {/* Course Flow Detail Section */}
      <div className="border-t border-gray-200 p-4 bg-white shadow-inner" style={{ flexShrink: 0, maxHeight: '40%', overflowY: 'auto' }}>
        {renderSchedule()}
      </div>

      {detailCourseId ? (() => {
        const course = scheduleCourses.find(c => c.id === detailCourseId);
        const node = nodes.find(n => n.id === detailCourseId);
        if (!course || !node) return null;

        const prereqLabels = (node.data.prerequisites || []).map((id) => {
          const match = scheduleCourses.find(c => c.id === id) || courses.find(c => c.id === id);
          return match?.name || id;
        });

        const dependents = nodes
          .filter(n => (n.data.prerequisites || []).includes(detailCourseId))
          .map(n => {
            const match = scheduleCourses.find(c => c.id === n.id) || courses.find(c => c.id === n.id);
            return match?.name || n.id;
          });

        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Detalle del curso</h2>
                </div>
                <button
                  onClick={() => setDetailCourseId(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  aria-label="Cerrar diálogo"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-gray-500">Nombre del curso</p>
                  <p className="font-medium">{course.name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Código</p>
                  <p className="font-medium">{course.id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Universidad</p>
                  <p className="font-medium">{course.university || 'No especificada'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Programa</p>
                  <p className="font-medium">{course.program || 'No especificado'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Carrera</p>
                  <p className="font-medium">{course.career || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ciclo</p>
                  <p className="font-medium">{course.cycle}</p>
                </div>
                <div>
                  <p className="text-gray-500">Créditos</p>
                  <p className="font-medium">{course.credits}</p>
                </div>
                <div>
                  <p className="text-gray-500">Estado</p>
                  <p className="font-medium capitalize">{node.data.status === 'not_taken' ? 'No rendido' : node.data.status === 'approved' ? 'Aprobado' : 'Desaprobado'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ruta crítica</p>
                  <p className="font-medium">{node.data.isInCriticalPath ? 'Sí' : 'No'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Prerrequisitos</p>
                  {prereqLabels.length ? (
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {prereqLabels.map((label, idx) => (
                        <li key={`${detailCourseId}-pr-${idx}`}>{label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No requiere cursos previos.</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Liberará</p>
                  {dependents.length ? (
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {dependents.map((label, idx) => (
                        <li key={`${detailCourseId}-dep-${idx}`}>{label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No desbloquea cursos adicionales.</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setDetailCourseId(null)}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
};

export default CourseGraph;