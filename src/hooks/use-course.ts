export type CourseStatus = 'approved' | 'failed' | 'not_taken';

export interface Course {
  id: string;
  name: string;
  credits: number;
  cycle: number;
  prerequisites: string[];
  status: CourseStatus;
  career?: string;
  isInStudyPlan?: boolean;
}

export const COURSES: Course[] = [
  // Ciclo 1
  { 
    id: 'MAT101', 
    name: 'Matemática Básica', 
    credits: 4, 
    cycle: 1,
    prerequisites: [],
    status: 'approved',
    isInStudyPlan: true
  },
  { 
    id: 'COM101', 
    name: 'Comunicación Efectiva', 
    credits: 3, 
    cycle: 1,
    prerequisites: [],
    status: 'approved',
    isInStudyPlan: true
  },
  { 
    id: 'FIS101', 
    name: 'Física General', 
    credits: 4, 
    cycle: 1,
    prerequisites: [],
    status: 'approved'
  },
  { 
    id: 'PROG101', 
    name: 'Introducción a la Programación', 
    credits: 4, 
    cycle: 1,
    prerequisites: [],
    status: 'approved'
  },

  // Ciclo 2
  { 
    id: 'CAL101', 
    name: 'Cálculo Diferencial', 
    credits: 4, 
    cycle: 2,
    prerequisites: ['MAT101'], 
    status: 'approved'
  },
  { 
    id: 'ALG101', 
    name: 'Álgebra Lineal', 
    credits: 4, 
    cycle: 2,
    prerequisites: ['MAT101'], 
    status: 'approved'
  },
  { 
    id: 'PROG102', 
    name: 'Programación Orientada a Objetos', 
    credits: 4, 
    cycle: 2,
    prerequisites: ['PROG101'], 
    status: 'approved'
  },

  // Ciclo 3
  { 
    id: 'CAL201', 
    name: 'Cálculo Integral', 
    credits: 4, 
    cycle: 3,
    prerequisites: ['CAL101'], 
    status: 'approved'
  },
  { 
    id: 'EDD101', 
    name: 'Estructuras de Datos', 
    credits: 4, 
    cycle: 3,
    prerequisites: ['PROG102'], 
    status: 'approved'
  },
  { 
    id: 'ARQ101', 
    name: 'Arquitectura de Computadoras', 
    credits: 4, 
    cycle: 3,
    prerequisites: ['PROG102'], 
    status: 'approved'
  },

  // Ciclo 4
  { 
    id: 'EST101', 
    name: 'Estadística General', 
    credits: 4, 
    cycle: 4,
    prerequisites: ['CAL101'], 
    status: 'approved'
  },
  { 
    id: 'BD101', 
    name: 'Bases de Datos', 
    credits: 4, 
    cycle: 4,
    prerequisites: ['EDD101'], 
    status: 'approved'
  },
  { 
    id: 'RED101', 
    name: 'Redes de Computadoras', 
    credits: 4, 
    cycle: 4,
    prerequisites: ['ARQ101'], 
    status: 'approved'
  },

  // Ciclo 5
  { 
    id: 'ALG201', 
    name: 'Algoritmos y Complejidad', 
    credits: 4, 
    cycle: 5,
    prerequisites: ['EDD101', 'CAL201'], 
    status: 'failed'
  },
  { 
    id: 'SIS101', 
    name: 'Sistemas Operativos', 
    credits: 4, 
    cycle: 5,
    prerequisites: ['ARQ101', 'EDD101'], 
    status: 'not_taken'
  },
  { 
    id: 'ING101', 
    name: 'Ingeniería de Software I', 
    credits: 4, 
    cycle: 5,
    prerequisites: ['PROG102', 'BD101'], 
    status: 'not_taken'
  },

  // Ciclo 6
  { 
    id: 'IA101', 
    name: 'Inteligencia Artificial', 
    credits: 4, 
    cycle: 6,
    prerequisites: ['ALG201', 'EST101'], 
    status: 'not_taken'
  },
  { 
    id: 'WEB101', 
    name: 'Desarrollo Web Avanzado', 
    credits: 4, 
    cycle: 6,
    prerequisites: ['ING101'], 
    status: 'not_taken'
  },
  { 
    id: 'SEG101', 
    name: 'Seguridad Informática', 
    credits: 4, 
    cycle: 6,
    prerequisites: ['RED101', 'SIS101'], 
    status: 'not_taken'
  },

  // Ciclo 7
  { 
    id: 'PROY101', 
    name: 'Proyecto de Software', 
    credits: 6, 
    cycle: 7,
    prerequisites: ['ING101', 'WEB101'], 
    status: 'not_taken'
  },
  { 
    id: 'CLOUD101', 
    name: 'Computación en la Nube', 
    credits: 4, 
    cycle: 7,
    prerequisites: ['SIS101', 'RED101'], 
    status: 'not_taken'
  },

  // Ciclo 8
  { 
    id: 'ETI101', 
    name: 'Ética y Legislación en TI', 
    credits: 3, 
    cycle: 8,
    prerequisites: [], 
    status: 'not_taken'
  },
  { 
    id: 'PRAC101', 
    name: 'Prácticas Pre-Profesionales', 
    credits: 6, 
    cycle: 8,
    prerequisites: ['PROY101'], 
    status: 'not_taken'
  },
  { 
    id: 'ELECT101', 
    name: 'Electivo Profesional', 
    credits: 4, 
    cycle: 8,
    prerequisites: [], 
    status: 'not_taken'
  }
];