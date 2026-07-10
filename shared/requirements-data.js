/*
  List of Medicaid compliance requirements, taken from
  "Requirements for Medicaid Compliance.docx".

  rule:
    - "before_start"      -> due on the employee's start date (offset 0)
    - "days_after_start"  -> due N days after the start date (see "offset")
    - "recurring_weekly"  -> repeats every 7 days from the start date, indefinitely
    - "recurring_monthly" -> repeats every month from the start date, indefinitely

  optional: true  -> the admin can mark this "Not applicable" for a specific employee
  annualRenewal: true -> after the first due date, repeats every year (same month/day)
  expiring: true  -> has no fixed renewal date: every time it's marked complete,
                     the admin enters the expiration/renewal date, and that date
                     becomes the next due date on the calendar (repeats indefinitely)
*/

const REQUIREMENTS = [
  { id: "cro_check",          label: "CRO Check",                                   rule: "before_start" },
  { id: "ids_received",       label: "IDs received",                                rule: "before_start", expiring: true },
  { id: "hiring_packet",      label: "Hiring Packet",                               rule: "before_start" },
  { id: "appendix_a",         label: "Appendix A – Background Check Consent",       rule: "before_start" },
  { id: "drug_test_consent",  label: "Drug Test",                                   rule: "before_start" },
  { id: "difficulty_of_care", label: "Difficulty of Care Waiver",                   rule: "before_start", optional: true },
  { id: "dmv_consent",        label: "DMV Consent Form",                            rule: "before_start", optional: true },
  { id: "evv",                label: "EVV",                                         rule: "before_start", optional: true, annualRenewal: true },
  { id: "resume",             label: "Resume",                                      rule: "before_start" },
  { id: "pane",                label: "PANE",                                       rule: "before_start" },
  { id: "emergency_contact",  label: "Emergency Contact Form",                      rule: "days_after_start", offset: 7 },
  { id: "acuity",             label: "Acuity",                                      rule: "days_after_start", offset: 7, optional: true, annualRenewal: true },
  { id: "fingerprints",       label: "Fingerprints",                                rule: "before_start" },
  { id: "drug_test",          label: "Drug test",                                   rule: "before_start" },
  { id: "cpr_first_aid",      label: "CPR / First Aid Course",                      rule: "before_start", expiring: true },
  { id: "monthly_exclusion",  label: "Monthly exclusion check",                     rule: "recurring_monthly" },
  { id: "cari",                label: "CARI",                                       rule: "before_start" },
  { id: "cds_day0",           label: "CDS Day 0 Modules",                           rule: "before_start" },
  { id: "initial_exclusion",  label: "Initial Exclusion Check Completed",           rule: "before_start" },
  { id: "drivers_abstract",   label: "Driver's Abstract",                           rule: "before_start" },
  { id: "w4",                  label: "W-4 Tax Form",                               rule: "days_after_start", offset: 3 },
  { id: "i9",                  label: "I-9 Form",                                   rule: "days_after_start", offset: 3 },
  { id: "weekly_timesheet",   label: "Weekly timesheet signature",                  rule: "recurring_weekly" },
  { id: "cds_60",              label: "CDS 60 day modules",                         rule: "days_after_start", offset: 60 },
  { id: "cds_120",             label: "CDS 120 day modules",                        rule: "days_after_start", offset: 120 },
  { id: "cds_189",             label: "CDS 180 day modules",                        rule: "days_after_start", offset: 180 },
];

// Requirements that can be marked "Not applicable" per employee
const OPTIONAL_REQUIREMENT_IDS = REQUIREMENTS.filter(r => r.optional).map(r => r.id);
