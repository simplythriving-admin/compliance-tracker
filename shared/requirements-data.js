/*
  Lista de requerimientos de Compliance (Medicaid), tomada de
  "Requirements for Medicaid Compliance.docx".

  rule:
    - "before_start"      -> vence en la fecha de inicio del empleado (offset 0)
    - "days_after_start"  -> vence N días después de la fecha de inicio (ver "offset")
    - "recurring_weekly"  -> se repite cada 7 días desde la fecha de inicio, indefinidamente
    - "recurring_monthly" -> se repite cada mes desde la fecha de inicio, indefinidamente

  optional: true  -> el admin puede marcarlo como "No aplica" para un empleado específico
  annualRenewal: true -> después del primer vencimiento, se repite cada año (misma fecha/mes/día)
  expiring: true  -> no tiene fecha de renovación fija: cada vez que se marca como
                     completado, el admin ingresa la fecha de expiración/vencimiento
                     del documento, y esa fecha se convierte en el próximo vencimiento
                     en el calendario (se repite así indefinidamente)
*/

const REQUIREMENTS = [
  { id: "cro_check",          label: "CRO Check",                                   rule: "before_start" },
  { id: "ids_received",       label: "IDs recibidos",                               rule: "before_start", expiring: true },
  { id: "hiring_packet",      label: "Hiring Packet",                               rule: "before_start" },
  { id: "appendix_a",         label: "Appendix A – Background Check Consent",       rule: "before_start" },
  { id: "drug_test_consent",  label: "Drug Test Consent",                           rule: "before_start" },
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
  { id: "weekly_timesheet",   label: "Firma de bitácoras semanales",                rule: "recurring_weekly" },
  { id: "cds_60",              label: "CDS 60 day modules",                         rule: "days_after_start", offset: 60 },
  { id: "cds_120",             label: "CDS 120 day modules",                        rule: "days_after_start", offset: 120 },
  { id: "cds_189",             label: "CDS 189 day modules",                        rule: "days_after_start", offset: 180 },
];

// Requerimientos que se pueden marcar "No aplica" por empleado
const OPTIONAL_REQUIREMENT_IDS = REQUIREMENTS.filter(r => r.optional).map(r => r.id);
