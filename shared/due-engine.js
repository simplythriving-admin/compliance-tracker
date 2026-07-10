/*
  Due-date engine.
  Given an employee (startDate, notApplicable) and a map of already-saved
  "completions", generates every requirement instance along with its status.
*/

function ymd(date) {
  // formats to "YYYY-MM-DD" in local time
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

function formatUS(date) {
  // Displays dates in US format MM/DD/YYYY (for on-screen display only; the
  // internal storage still uses ymd/YYYY-MM-DD).
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

function nextSunday(date) {
  // If "date" is already a Sunday, returns the same date.
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  const add = (7 - day) % 7;
  return addDays(d, add);
}

function firstOfNextMonth(date) {
  // Returns the 1st day of the month AFTER the given date's month.
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

/**
 * Generates every instance (one per due date) of the requirements that apply
 * to an employee, from their start date through a future horizon.
 *
 * @param {Object} employee { startDate: "YYYY-MM-DD", notApplicable: {reqId: true, ...} }
 * @param {Object} completionsByKey  { "reqId__periodKey": {completedDate, note} }
 * @param {Date} today
 * @param {number} horizonDays  how many days into the future to include (default 120)
 * @returns {Array} instances { reqId, label, periodKey, dueDate (Date), status, completedDate, note, optional, isRecurring }
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
        // There's no fixed renewal date: the admin sets it every time the
        // requirement is marked completed (the document/certificate's
        // expiration date). Each renewal generates the next due date.
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
      // Due every Sunday. Skips the employee's first (partial) week: the
      // first signature is due the Sunday of the week AFTER their start
      // date's week, regardless of which day they started on.
      let d = addDays(nextSunday(start), 7);
      let i = 0;
      while (d <= horizon) {
        pushInstance(req, d, `w${i}`);
        i += 1;
        d = addDays(d, 7);
      }
    } else if (req.rule === "recurring_monthly") {
      // Due on the 1st day of each month, starting with the 1st of the
      // month AFTER the employee's start date (so a partial first month
      // never counts), and repeating on the 1st every month after that.
      let d = firstOfNextMonth(start);
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
  return `Out of compliance: missing "${instance.label}", was due on ${formatUS(instance.dueDate)}.`;
}

/**
 * Calculates the date ranges during which the employee was (or still is) out
 * of compliance, to shade those days on the calendar.
 * - If the requirement is still overdue: the range runs from its due date to today.
 * - If it was completed late (after the due date): the range runs from the due
 *   date to the date it was completed.
 * Each span also carries its source instance, so the exact reason can be shown
 * when the admin/viewer clicks any shaded day.
 * @returns {Array} [{start: Date, end: Date, instance: Object}, ...]
 */
function nonComplianceSpans(instances, today) {
  const todayStart = startOfDay(today);
  const spans = [];
  instances.forEach(inst => {
    if (inst.status === "overdue") {
      spans.push({ start: inst.dueDate, end: todayStart, instance: inst });
    } else if (inst.status === "completed" && inst.completedDate) {
      const completed = startOfDay(parseYMD(inst.completedDate));
      if (completed > inst.dueDate) {
        spans.push({ start: inst.dueDate, end: completed, instance: inst });
      }
    }
  });
  return spans;
}

function dateInSpans(date, spans) {
  const t = startOfDay(date).getTime();
  return spans.some(s => t >= s.start.getTime() && t <= s.end.getTime());
}

// Returns the instances (requirements) whose "out of compliance" reason
// covers the given day, to show them when a red-shaded calendar day is clicked.
function reasonsForDay(date, spans) {
  const t = startOfDay(date).getTime();
  const map = new Map();
  spans.forEach(s => {
    if (t >= s.start.getTime() && t <= s.end.getTime()) {
      map.set(s.instance.key, s.instance);
    }
  });
  return Array.from(map.values());
}

// Same as reasonsForDay, but only returns requirements that are still NOT
// completed (currently overdue). Used for the simple "why is this day red"
// message, so requirements that were completed late don't show up there.
function overdueReasonsForDay(date, spans) {
  return reasonsForDay(date, spans).filter(inst => inst.status === "overdue");
}
