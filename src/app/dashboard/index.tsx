"use client";

import React, { useCallback } from "react";
import dynamic from "next/dynamic";
import { FiChevronDown, FiUser, FiLogOut, FiChevronUp } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { CourseStatus } from "@/hooks/use-course";
import { useDashboard } from "@/hooks/useDashboard";

const CourseGraph = dynamic(() => import("@/components/CourseGraph"), {
  ssr: false,
});

export default function Dashboard() {
  const router = useRouter();

  const {
    selectedCycle,
    selectedCareer,
    selectedCourseId,
    expandedCycles,
    handleCareerChange,
    handleClearFilters,
    handleLogout,
    toggleCycle,
    handleSelectCycle,
    updateCourseStatus,
    handleCourseSelect,
    toggleCourseStatus,
    CAREERS,
    cycles,
    courses,
    visibleCourses,
    careers,
  } = useDashboard();

  const handleStatusChange = useCallback(
    (courseId: string, newStatus: CourseStatus) => {
      updateCourseStatus(courseId, newStatus);
    },
    [updateCourseStatus]
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white shadow-sm">
        <div className="flex items-center space-x-2">
          <img
            src="/logo.jpg"
            alt="EduGraph Logo"
            className="h-8 w-8 rounded-full"
          />
          <h1 className="text-xl font-bold">EduGraph</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 cursor-pointer group">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <FiUser className="text-indigo-600" />
            </div>
            <FiChevronDown className="group-hover:rotate-180 transition-transform" />
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1 bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Filtros</h2>

            {/* Career Selector */}
            <div className="mb-6">
              <label
                htmlFor="career"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Carrera
              </label>
              <select
                id="career"
                value={selectedCareer}
                onChange={handleCareerChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las carreras</option>
                {careers.map((career) => (
                  <option key={career.id} value={career.name}>
                    {career.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cycles List */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Ciclos</h3>
              {cycles.map((cycle) => (
                <div key={cycle} className="space-y-1">
                  <button
                    onClick={() => toggleCycle(cycle)}
                    className={`w-full flex justify-between items-center p-3 ${
                      expandedCycles.includes(cycle)
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                    } transition-colors`}
                  >
                    <span className="font-medium">Ciclo {cycle}</span>
                    {expandedCycles.includes(cycle) ? (
                      <FiChevronUp className="text-blue-500" />
                    ) : (
                      <FiChevronDown className="text-gray-400" />
                    )}
                  </button>
                  {expandedCycles.includes(cycle) && (
                    <div className="p-2 space-y-1">
                      {(() => {
                        const list = visibleCourses
                          .filter((course) => course.cycle === cycle);
                        const unique = Array.from(new Map(list.map((course) => [course.id, course])).values());
                        return unique.map((course) => (
                          <div
                            key={course.id}
                            onClick={() => handleCourseSelect(course.id)}
                            className={`flex items-center py-1.5 px-3 text-sm cursor-pointer ${
                              selectedCourseId === course.id
                                ? "text-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                selectedCourseId === course.id
                                  ? "bg-blue-600"
                                  : "bg-gray-400"
                              } mr-3`}
                            ></span>
                            <span className="truncate">{course.name}</span>
                            <span
                              className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                                selectedCourseId === course.id
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {course.credits} créditos
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Graph */}
          <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow-sm">
            <div className="h-full">
              <CourseGraph
                courses={visibleCourses}
                displayCourses={visibleCourses}
                selectedCycle={selectedCycle}
                selectedCourseId={selectedCourseId}
                onCourseSelect={handleCourseSelect}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
