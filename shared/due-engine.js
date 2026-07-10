/*
  Motor de fechas límite.
  Dado un empleado (con startDate y notApplicable) y un mapa de "completions"
  ya guardadas, genera todas las instancias de requerimientos con su estado.
*/

function ymd(date) {
  // formatea a "YYYY-MM-DD" en horario local
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYMD(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function nextSunday(date) {
  // Si "date" ya es domingo, devuelve la misma fecha.
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = domingo ... 6 = sábado
  const add = (7 - day) % 7;
  return addDays(d, add);
}

/**
 * Genera todas las instancias (una por vencimiento) de los requerimientos
 * aplicables a un empleado, entre su fecha de inicio y un horizonte futuro.
 *
 * @param {Object} employee { startDate: "YYYY-MM-DD", notApplicable: {reqId: true, ...} }
 * @param {Object} completionsByKey  { "reqId__periodKey": {completedDate, note} }
 * @param {Date} today
 * @param {number} horizonDays  cuántos días hacia el futuro incluir (default 120)
 * @returns {Array} instancias { reqId, label, periodKey, dueDate (Date), status, completedDate, note, optional, isRecurring }
 */
function computeInstances(employee, completionsByKey, today, horizonDays = 120) {
  const start = parseYMD(employee.startDate);
  const horizon = addDays(startOfDay(today), horizonDays);
  const notApplicable = employee.notApplicable || {};
  const instances = [];

  for (const req of REQUIREMENTS) {
    if (req.optional && notApplicable[req.id]) continue;

    if (req.rule === "before_start" || req.rule === "days_after_start") {
      const offset = req.offset || 0;
      const baseDue = addDays(start, offset);

      if (req.expiring) {
        // La fecha de vencimiento no se calcula sola: la define el admin cada
        // vez que marca el requerimiento como completado (fecha de expiración
        // del documento/certificado). Cada renovación genera la siguiente.
        let dueDate = baseDue;
        let periodKey = "";
        let cycle = 0;
        while (dueDate <= horizon && cycle < 50) {
          pushInstance(req, dueDate, periodKey);
          const key = `${req.id}__${periodKey}`;
          const completion = completionsByKey[key];
          if (completion && completion.expirationDate) {
            dueDate = parseYMD(completion.expirationDate);
            cycle += 1;
            periodKey = `r${cycle}`;
          } else {
            break;
          }
        }
      } else if (req.annualRenewal) {
        let d = baseDue;
        let year = 0;
        while (d <= horizon) {
          pushInstance(req, d, year === 0 ? "" : `y${year}`);
          year += 1;
          d = addYears(baseDue, year);
        }
      } else {
        pushInstance(req, baseDue, "");
      }
    } else if (req.rule === "recurring_weekly") {
      // Vence todos los domingos. Se salta la primera semana (parcial) del
      // empleado: la primera firma vence el domingo de la semana SIGUIENTE
      // a la de su fecha de inicio, sin importar qué día inició.
      let d = addDays(nextSunday(start), 7);
      let i = 0;
      while (d <= horizon) {
        pushInstance(req, d, `w${i}`);
        i += 1;
        d = addDays(d, 7);
      }
    } else if (req.rule === "recurring_monthly") {
      let d = addMonths(start, 1);
      let i = 0;
      while (d <= horizon) {
        pushInstance(req, d, `m${i}`);
        i += 1;
        d = addMonths(d, 1);
      }
    }
  }

  function pushInstance(req, dueDate, periodKey) {
    const key = `${req.id}__${periodKey}`;
    const completion = completionsByKey[key];
    const due = startOfDay(dueDate);
    let status;
    if (completion) {
      status = "completed";
    } else if (due < startOfDay(today)) {
      status = "overdue";
    } else {
      status = "upcoming";
    }
    instances.push({
      reqId: req.id,
      label: req.label,
      periodKey,
      key,
      dueDate: due,
      status,
      completedDate: completion ? completion.completedDate : null,
      note: completion ? completion.note || "" : "",
      expirationDate: completion ? completion.expirationDate || "" : "",
      expiring: !!req.expiring,
      isRecurring: req.rule === "recurring_weekly" || req.rule === "recurring_monthly",
      optional: !!req.optional,
    });
  }

  return instances.sort((a, b) => a.dueDate - b.dueDate);
}

function reasonText(instance) {
  return `Fuera de compliance: falta "${instance.label}", vencía el ${ymd(instance.dueDate)}.`;
}

/**
 * Calcula los rangos de días en que el empleado estuvo (o sigue) fuera de
 * compliance, para sombrear esos días en el calendario.
 * - Si el requerimiento sigue vencido: el rango va de su fecha de vencimiento a hoy.
 * - Si se completó tarde (después de la fecha de vencimiento): el rango va de
 *   la fecha de vencimiento a la fecha en que se completó.
 * @returns {Array} [{start: Date, end: Date}, ...]
 */
function nonComplianceSpans(instances, today) {
  const todayStart = startOfDay(today);
  const spans = [];
  instances.forEach(inst => {
    if (inst.status === "overdue") {
      spans.push({ start: inst.dueDate, end: todayStart });
    } else if (inst.status === "completed" && inst.completedDate) {
      const completed = startOfDay(parseYMD(inst.completedDate));
      if (completed > inst.dueDate) {
        spans.push({ start: inst.dueDate, end: completed });
      }
    }
  });
  return spans;
}

function dateInSpans(date, spans) {
  const t = startOfDay(date).getTime();
  return spans.some(s => t >= s.start.getTime() && t <= s.end.getTime());
}
