'use client';

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { CourseStatus } from '../hooks/use-course';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';

export interface CourseNodeData {
  label: string;
  status: CourseStatus;
  credits: number;
  cycle: number;
  prerequisites: string[];
  isCritical?: boolean;
  isInCriticalPath?: boolean;
}

interface CourseNodeProps {
  data: CourseNodeData;
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
}

export const CourseNode = React.memo<CourseNodeProps>(({ data, onStatusChange }) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleStatusChange = (newStatus: CourseStatus) => {
    if (onStatusChange) {
      onStatusChange(data.label, newStatus);
    }
    setShowStatusMenu(false);
  };

  const getStatusLabel = (status: CourseStatus) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'failed': return 'Desaprobado';
      case 'not_taken': return 'No rendido';
      default: return 'No rendido';
    }
  };

  const getIcon = (status: CourseStatus) => {
    switch (status) {
      case 'approved': return <FiCheck className="text-green-500" />;
      case 'failed': return <FiX className="text-red-500" />;
      case 'not_taken': return <FiClock className="text-gray-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  const statusColor = (() => {
    switch (data.status) {
      case 'approved': return 'bg-green-50 border-green-300 text-green-800';
      case 'failed': return 'bg-red-50 border-red-300 text-red-800';
      default: return 'bg-white border-gray-200 text-gray-800';
    }
  })();

  const statusBadge = (() => {
    switch (data.status) {
      case 'approved': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  })();

  const borderStyle = data.isInCriticalPath 
    ? 'border-2 border-yellow-500 shadow-md' 
    : 'border';

  return (
    <div
      className={`p-3 rounded-lg ${borderStyle} ${statusColor} shadow-sm hover:shadow-md transition-all duration-200 relative`}
      style={{ borderLeftWidth: '4px', borderLeftColor: data.isInCriticalPath ? '#f59e0b' : 'transparent' }}
      data-id={data.label}
      onMouseEnter={() => setShowStatusMenu(true)}
      onMouseLeave={() => setShowStatusMenu(false)}
    >
      <Handle type="target" position={Position.Left} id="a" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusBadge} flex-shrink-0`}></span>
            <span>{data.label}</span>
            {showStatusMenu && onStatusChange && (
              <div className="relative">
                <button 
                  className="ml-2 text-xs px-2 py-1 rounded border bg-white shadow-sm hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStatusMenu(!showStatusMenu);
                  }}
                >
                  {getIcon(data.status)} {getStatusLabel(data.status)}
                </button>
                {showStatusMenu && (
                  <div className="absolute z-10 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange('approved');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                    >
                      <FiCheck className="text-green-500" /> Aprobado
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange('failed');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                    >
                      <FiX className="text-red-500" /> Desaprobado
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange('not_taken');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FiClock className="text-gray-500" /> No rendido
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-sm mt-1">
            <span className="font-medium">{data.credits}</span> créditos
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Ciclo {data.cycle}
          </span>
          {data.isInCriticalPath && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
              Ruta Crítica
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="b" />
    </div>
  );
});

CourseNode.displayName = 'CourseNode';