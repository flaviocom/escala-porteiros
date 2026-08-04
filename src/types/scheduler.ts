export type ShiftType = 'MANHÃ' | 'TARDE' | 'NOITE' | 'SANTA_CEIA';

export interface Brother {
  id: string;
  name: string;
  constraints: {
    fixedPerMonth?: number;
    daysAllowed?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    shiftsAllowed?: ShiftType[];
    forbiddenDays?: number[];
  };
}

export interface Shift {
  id: string;
  date: Date;
  type: ShiftType;
  assignedBrothers: string[]; // Brother IDs
}

export const BROTHERS: Brother[] = [
  {
    id: 'adilson',
    name: 'Adilson',
    constraints: {
      daysAllowed: [0], // Sunday only
      shiftsAllowed: ['NOITE'],
    }
  },
  {
    id: 'carlos_henrique',
    name: 'Carlos Henrique',
    constraints: {
      forbiddenDays: [3], // No Wednesday
    }
  },
  {
    id: 'donizete',
    name: 'Donizete',
    constraints: {}
  },
  {
    id: 'eduardo',
    name: 'Eduardo',
    constraints: {
      forbiddenDays: [3], // No Wednesday
    }
  },
  {
    id: 'elson',
    name: 'Elson',
    constraints: {
      forbiddenDays: [3], // No Wednesday
    }
  },
  {
    id: 'flavio',
    name: 'Flavio',
    constraints: {}
  },
  {
    id: 'isac',
    name: 'Isac',
    constraints: {}
  },
  {
    id: 'leandro',
    name: 'Leandro',
    constraints: {}
  },
  {
    id: 'lucas',
    name: 'Lucas',
    constraints: {}
  },
  {
    id: 'luis_henrique',
    name: 'Luis Henrique',
    constraints: {}
  },
  {
    id: 'luiz_felipe',
    name: 'Luiz Felipe',
    constraints: {}
  },
  {
    id: 'luiz_cezar',
    name: 'Luíz Cezar',
    constraints: {}
  },
  {
    id: 'marcos',
    name: 'Marcos',
    constraints: {}
  },
  {
    id: 'thiago',
    name: 'Thiago',
    constraints: {
      fixedPerMonth: 2,
      daysAllowed: [3], // Wednesday only
      shiftsAllowed: ['NOITE'],
    }
  },
  {
    id: 'vicente',
    name: 'Vicente',
    constraints: {}
  },
  {
    id: 'williams',
    name: 'Williams',
    constraints: {
      fixedPerMonth: 3,
      // Any day/shift allowed by default if not specified
    }
  }
];
