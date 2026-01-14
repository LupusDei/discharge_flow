import { Patient, DischargeDisposition, RiskLevel } from '@shared/types';

// Valid discharge dispositions
const VALID_DISPOSITIONS: DischargeDisposition[] = [
  'Home',
  'Home with home health',
  'Skilled nursing facility',
];

// Valid risk levels
const VALID_RISK_LEVELS: RiskLevel[] = ['Low', 'Medium', 'High', 'Very High'];

/**
 * Parse a CSV line, handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last field
  result.push(current.trim());

  return result;
}

/**
 * Convert empty string to null for nullable fields
 */
function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

/**
 * Validate and parse a discharge disposition
 */
function parseDischargeDisposition(value: string): DischargeDisposition {
  if (!VALID_DISPOSITIONS.includes(value as DischargeDisposition)) {
    throw new Error(`Invalid discharge disposition: "${value}". Expected one of: ${VALID_DISPOSITIONS.join(', ')}`);
  }
  return value as DischargeDisposition;
}

/**
 * Validate and parse a risk level
 */
function parseRiskLevel(value: string): RiskLevel {
  if (!VALID_RISK_LEVELS.includes(value as RiskLevel)) {
    throw new Error(`Invalid risk level: "${value}". Expected one of: ${VALID_RISK_LEVELS.join(', ')}`);
  }
  return value as RiskLevel;
}

/**
 * Validate and parse a risk level that can be null
 */
function parseNullableRiskLevel(value: string): RiskLevel | null {
  if (value === '') return null;
  return parseRiskLevel(value);
}

/**
 * Parse a single CSV row into a Patient object
 */
function parsePatientRow(headers: string[], values: string[], rowNumber: number): Patient {
  if (values.length !== headers.length) {
    throw new Error(`Row ${rowNumber}: Expected ${headers.length} columns but got ${values.length}`);
  }

  // Create a raw record from headers and values
  const raw: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    raw[headers[i]] = values[i];
  }

  // Validate required fields
  const requiredFields = ['patient_id', 'patient_name', 'discharge_date', 'discharge_disposition', 'readmission_risk_score'];
  for (const field of requiredFields) {
    if (!raw[field]) {
      throw new Error(`Row ${rowNumber}: Missing required field "${field}"`);
    }
  }

  // Parse and construct the Patient object
  const patient: Patient = {
    patientId: raw.patient_id,
    patientName: raw.patient_name,
    dob: raw.dob,
    gender: raw.gender as 'M' | 'F',
    phone: emptyToNull(raw.phone),
    email: emptyToNull(raw.email),
    preferredLanguage: raw.preferred_language,
    admissionDate: raw.admission_date,
    dischargeDate: raw.discharge_date,
    dischargeTime: emptyToNull(raw.discharge_time),
    lengthOfStay: parseInt(raw.length_of_stay, 10) || 0,
    primaryDiagnosis: raw.primary_diagnosis,
    dischargeDisposition: parseDischargeDisposition(raw.discharge_disposition),
    dischargeMedications: raw.discharge_medications,
    allergies: emptyToNull(raw.allergies),
    attendingPhysician: raw.attending_physician,
    pcpName: emptyToNull(raw.pcp_name),
    pcpPhone: emptyToNull(raw.pcp_phone),
    readmissionRiskScore: parseRiskLevel(raw.readmission_risk_score),
    fallRisk: parseNullableRiskLevel(raw.fall_risk),
    notes: emptyToNull(raw.notes),
  };

  return patient;
}

/**
 * Parse CSV content string and return an array of Patient objects
 */
export function parsePatientCSV(csvContent: string): Patient[] {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');

  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const patients: Patient[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const patient = parsePatientRow(headers, values, i + 1);
    patients.push(patient);
  }

  return patients;
}
