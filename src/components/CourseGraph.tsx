'use client';

import { useCallback, useMemo } from 'react';
import { Course } from '../hooks/use-course';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionLineType,
  Node,
  Edge,
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
  selectedCycle?: number | null;
  selectedCourseId?: string | null;
  onStatusChange: (courseId: string, newStatus: CourseStatus) => void;
  onCourseSelect?: (courseId: string) => void;
}
const CourseGraph: React.FC<CourseGraphProps> = ({ 
  courses: allCourses,
  selectedCycle, 
  selectedCourseId,
  onCourseSelect,
  onStatusChange 
}) => {

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    updateCourseStatus,
    criticalPath,
    setEdges,
    isLoading
  } = useCourseGraph(allCourses);

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
        <CourseNode 
          {...nodeProps} 
          onStatusChange={handleNodeStatusChange}
        />
      );
    }
  }), [onStatusChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const renderSchedule = () => {
    const coursesByCycle = nodes.reduce<Record<number, Node<CourseNodeData>[]>>((acc, node) => {
      if (!acc[node.data.cycle]) acc[node.data.cycle] = [];
      acc[node.data.cycle].push(node);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Detalle del flujo</h3>
        {Object.entries(coursesByCycle)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([cycle, cycleNodes]) => (
            <div key={`cycle-${cycle}`} className="space-y-2">
              <h4 className="text-md font-medium text-gray-700">Ciclo {cycle}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cycleNodes.map(node => (
                  <div
                    key={node.id}
                    className={`p-4 rounded-lg border ${
                      selectedCourseId === node.id
                        ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-300'
                        : selectedCycle === node.data.cycle 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200'
                    } hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => onCourseSelect?.(node.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-900">{node.data.label}</h5>
                        <p className="text-sm text-gray-600">{node.data.credits} créditos</p>
                      </div>
                      <div className="relative">
                        <select
                          value={getCurrentStatus(node.id)}
                          onChange={(e) => handleStatusChange(node.id, e.target.value as CourseStatus)}
                          onClick={(e) => e.stopPropagation()}
                          className={`px-3 py-1 rounded-full text-xs font-medium text-center min-w-[110px] cursor-pointer appearance-none ${
                            getStatusColor(getCurrentStatus(node.id))
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
                        {selectedCourseId === node.id && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                        )}
                      </div>
                    </div>

                    {node.data.prerequisites.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Requisitos:</p>
                        <div className="flex flex-wrap gap-1">
                          {node.data.prerequisites.map(prereqId => {
                            const prereq = nodes.find(n => n.id === prereqId);
                            return (
                              <span
                                key={prereqId}
                                className="inline-block text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full cursor-pointer hover:bg-blue-100"
                                onClick={(e) => { e.stopPropagation(); onCourseSelect?.(prereqId); }}
                              >
                                {prereq?.data.label || prereqId}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
    </div>
  );
};

export default CourseGraph;