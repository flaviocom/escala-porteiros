import { 
  eachDayOfInterval, 
  getDay, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth, 
  addDays, 
  differenceInDays,
  getDate,
  isTuesday,
  isSaturday,
  format,
  parseISO
} from 'date-fns';
import { Brother, Shift, ShiftType, BROTHERS } from '../types/scheduler';

// Helper to check if a date is the first occurrence of that day in the month
function isFirstDayOfWeekInMonth(date: Date, dayOfWeek: number): boolean {
  return getDay(date) === dayOfWeek && getDate(date) <= 7;
}

export function generateEmptySchedule(): Shift[] {
  const year = 2026;
  const startDate = new Date(year, 2, 1); // Mar 1st (Month is 0-indexed: 0=Jan, 1=Feb, 2=Mar)
  const endDate = new Date(year, 11, 31); // Dec 31st
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const shifts: Shift[] = [];
  let shiftIdCounter = 1;

  allDays.forEach(date => {
    const dayOfWeek = getDay(date); // 0=Sun, ..., 6=Sat
    const dateStr = format(date, 'yyyy-MM-dd');

    // EXCEPTION: 07/06/2026 -> SANTA CEIA
    if (dateStr === '2026-06-07') {
      shifts.push({ id: `shift-${shiftIdCounter++}`, date, type: 'SANTA_CEIA', assignedBrothers: [] });
      return; // Skip regular shifts for this day
    }

    // Sunday: Manhã, Noite
    if (dayOfWeek === 0) {
      shifts.push({ id: `shift-${shiftIdCounter++}`, date, type: 'MANHÃ', assignedBrothers: [] });
      shifts.push({ id: `shift-${shiftIdCounter++}`, date, type: 'NOITE', assignedBrothers: [] });
    }
    
    // Wednesday: All -> Noite
    if (dayOfWeek === 3) {
      shifts.push({ id: `shift-${shiftIdCounter++}`, date, type: 'NOITE', assignedBrothers: [] });
    }

    // Saturday
    if (dayOfWeek === 6) {
      // 1st Saturday: Tarde (Ensaio), Noite
      if (isFirstDayOfWeekInMonth(date, 6)) {
        shifts.push({ id: `shift-${shiftIdCounter++}`, date, type: 'TARDE', assignedBrothers: [] });
        shifts.push({ id: `shift-${shiftIdCounter++}`, date, type: 'NOITE', assignedBrothers: [] });
      } else {
        // Other Saturdays: Noite only
        shifts.push({ id: `shift-${shiftIdCounter++}`, date, type: 'NOITE', assignedBrothers: [] });
      }
    }
  });

  return shifts;
}

export interface ValidationResult {
  rule: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details: string[];
}

export function runValidation(shifts: Shift[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const brothers = BROTHERS;

  // 1. Thiago: Exactly 2x/month, Wed Night
  const thiago = brothers.find(b => b.name === 'Thiago');
  if (thiago) {
    const assignments = shifts.filter(s => s.assignedBrothers.includes(thiago.id));
    const details: string[] = [];
    let valid = true;
    
    // Check Day/Shift
    assignments.forEach(s => {
      if (getDay(s.date) !== 3 || s.type !== 'NOITE') {
        details.push(`Dia/Turno errado: ${format(s.date, 'dd/MM')} (${s.type})`);
        valid = false;
      }
    });

    // Check Count per Month
    const byMonth: Record<string, number> = {};
    assignments.forEach(s => {
      const m = s.date.toISOString().slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + 1;
    });
    
    // Get all months in schedule
    const allMonths = Array.from(new Set(shifts.map(s => s.date.toISOString().slice(0, 7))));
    allMonths.forEach(m => {
      const count = byMonth[m] || 0;
      if (count !== 2) {
        details.push(`Mês ${m}: ${count} turnos (Esperado: 2)`);
        valid = false;
      }
    });

    results.push({
      rule: 'Thiago (2x/mês, Quartas)',
      status: valid ? 'pass' : 'fail',
      message: valid ? 'OK' : 'Falha nas restrições',
      details
    });
  }

  // 2. Williams: Exactly 3x/month
  const williams = brothers.find(b => b.name === 'Williams');
  if (williams) {
    const assignments = shifts.filter(s => s.assignedBrothers.includes(williams.id));
    const details: string[] = [];
    let valid = true;

    const byMonth: Record<string, number> = {};
    assignments.forEach(s => {
      const m = s.date.toISOString().slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + 1;
    });

    const allMonths = Array.from(new Set(shifts.map(s => s.date.toISOString().slice(0, 7))));
    allMonths.forEach(m => {
      const count = byMonth[m] || 0;
      if (count !== 3) {
        details.push(`Mês ${m}: ${count} turnos (Esperado: 3)`);
        valid = false;
      }
    });

    results.push({
      rule: 'Williams (3x/mês)',
      status: valid ? 'pass' : 'fail',
      message: valid ? 'OK' : 'Contagem incorreta',
      details
    });
  }

  // 3. Adilson: Only Sun Night
  const adilson = brothers.find(b => b.name === 'Adilson');
  if (adilson) {
    const assignments = shifts.filter(s => s.assignedBrothers.includes(adilson.id));
    const details: string[] = [];
    let valid = true;

    assignments.forEach(s => {
      if (getDay(s.date) !== 0 || s.type !== 'NOITE') {
        details.push(`Dia/Turno errado: ${format(s.date, 'dd/MM')} (${s.type})`);
        valid = false;
      }
    });

    results.push({
      rule: 'Adilson (Domingo Noite)',
      status: valid ? 'pass' : 'fail',
      message: valid ? 'OK' : 'Turno proibido encontrado',
      details
    });
  }

  // 4. Forbidden Wednesdays (Eduardo, Elson, Carlos Henrique)
  const forbiddenWed = ['Eduardo', 'Elson', 'Carlos Henrique'];
  const forbiddenDetails: string[] = [];
  let forbiddenValid = true;

  forbiddenWed.forEach(name => {
    const brother = brothers.find(b => b.name === name);
    if (brother) {
      const assignments = shifts.filter(s => s.assignedBrothers.includes(brother.id));
      assignments.forEach(s => {
        if (getDay(s.date) === 3) {
          forbiddenDetails.push(`${name} em Quarta-feira: ${format(s.date, 'dd/MM')}`);
          forbiddenValid = false;
        }
      });
    }
  });

  results.push({
    rule: 'Sem Quartas (Eduardo, Elson, Carlos H.)',
    status: forbiddenValid ? 'pass' : 'fail',
    message: forbiddenValid ? 'OK' : 'Escalados em quarta-feira',
    details: forbiddenDetails
  });

  // 5. No Overlap (Same Day)
  const overlapDetails: string[] = [];
  let overlapValid = true;
  const shiftsByDay: Record<string, Shift[]> = {};
  
  shifts.forEach(s => {
    const dayKey = s.date.toISOString().slice(0, 10);
    if (!shiftsByDay[dayKey]) shiftsByDay[dayKey] = [];
    shiftsByDay[dayKey].push(s);
  });

  Object.entries(shiftsByDay).forEach(([day, dayShifts]) => {
    const brothersOnDay = new Set<string>();
    dayShifts.forEach(s => {
      s.assignedBrothers.forEach(bId => {
        if (brothersOnDay.has(bId)) {
          const bName = brothers.find(b => b.id === bId)?.name || bId;
          overlapDetails.push(`${bName} repetido em ${format(parseISO(day), 'dd/MM')}`);
          overlapValid = false;
        }
        brothersOnDay.add(bId);
      });
    });
  });

  results.push({
    rule: 'Sem Repetição no Mesmo Dia',
    status: overlapValid ? 'pass' : 'fail',
    message: overlapValid ? 'OK' : 'Irmãos repetidos encontrados',
    details: overlapDetails
  });

  // 6. Date Validation
  const dateDetails: string[] = [];
  let dateValid = true;
  const expectedShifts = generateEmptySchedule();
  
  if (shifts.length !== expectedShifts.length) {
    dateDetails.push(`Total de turnos incorreto: ${shifts.length} (Esperado: ${expectedShifts.length})`);
    dateValid = false;
  }

  // Check for missing dates
  const shiftDates = new Set(shifts.map(s => s.date.toISOString().slice(0, 10)));
  const expectedDates = new Set(expectedShifts.map(s => s.date.toISOString().slice(0, 10)));
  
  expectedDates.forEach(d => {
    if (!shiftDates.has(d)) {
      dateDetails.push(`Data faltando: ${format(parseISO(d), 'dd/MM/yyyy')}`);
      dateValid = false;
    }
  });

  results.push({
    rule: 'Validação de Datas',
    status: dateValid ? 'pass' : 'fail',
    message: dateValid ? 'OK' : 'Problemas com datas',
    details: dateDetails
  });

  return results;
}

export function generateSchedule(): Shift[] {
  const shifts = generateEmptySchedule();
  const brothers = [...BROTHERS];

  // Helper to check if a brother can take a shift
  const canTakeShift = (brother: Brother, shift: Shift, currentAssignments: Shift[]): boolean => {
    // 1. Overlap Rule: Cannot be in another shift on the same day
    const sameDayShift = currentAssignments.find(s => 
      isSameDay(s.date, shift.date) && s.assignedBrothers.includes(brother.id)
    );
    if (sameDayShift) return false;

    // 2. Constraints
    const { constraints } = brother;
    const dayOfWeek = getDay(shift.date);

    // Forbidden Days
    if (constraints.forbiddenDays?.includes(dayOfWeek)) return false;

    // Allowed Days (if specified)
    if (constraints.daysAllowed && !constraints.daysAllowed.includes(dayOfWeek)) return false;

    // Allowed Shifts (if specified)
    if (constraints.shiftsAllowed && !constraints.shiftsAllowed.includes(shift.type)) return false;

    // Fixed Per Month Check
    if (constraints.fixedPerMonth) {
      const monthStr = shift.date.toISOString().slice(0, 7);
      const countThisMonth = currentAssignments.filter(s => 
        s.assignedBrothers.includes(brother.id) && 
        s.date.toISOString().slice(0, 7) === monthStr
      ).length;
      if (countThisMonth >= constraints.fixedPerMonth) return false;
    }

    return true;
  };

  // Helper to calculate score (higher is better)
  const calculateScore = (brother: Brother, shift: Shift, currentAssignments: Shift[]): number => {
    const myShifts = currentAssignments.filter(s => s.assignedBrothers.includes(brother.id));
    
    // 1. Total Count (Balance) - Prefer those with fewer shifts
    const totalCount = myShifts.length;
    
    // 2. Days Since Last Shift (Spacing)
    let daysSinceLast = 100; // Default high if no previous shift
    if (myShifts.length > 0) {
      // Sort by date desc
      const sorted = [...myShifts].sort((a, b) => b.date.getTime() - a.date.getTime());
      const lastShift = sorted[0];
      if (lastShift.date < shift.date) {
        daysSinceLast = differenceInDays(shift.date, lastShift.date);
      } else {
         daysSinceLast = 0; 
      }
    }

    let score = (daysSinceLast * 2) - (totalCount * 10);

    // Boost for Fixed Per Month to ensure they get picked
    if (brother.constraints.fixedPerMonth) {
      score += 50; 
    }

    return score;
  };

  // Main Assignment Loop
  for (const shift of shifts) {
    if (shift.type === 'SANTA_CEIA') continue;

    const needed = 3;
    
    // Get candidates
    let candidates = brothers.filter(b => canTakeShift(b, shift, shifts));
    
    // Sort by score
    candidates.sort((a, b) => calculateScore(b, shift, shifts) - calculateScore(a, shift, shifts));

    // Take top 3
    for (let i = 0; i < needed; i++) {
      if (candidates[i]) {
        shift.assignedBrothers.push(candidates[i].id);
      }
    }
  }

  return shifts;
}
