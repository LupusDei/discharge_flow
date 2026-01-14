import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parsePatientCSV, loadPatients, getDefaultCSVPath } from './csvParser';
import { Patient } from '../../shared/types';

const TEST_DIR = path.resolve(process.cwd(), 'test-data');
const TEST_CSV = path.join(TEST_DIR, 'test-patients.csv');

// Sample valid CSV content
const VALID_CSV = `patient_id,patient_name,dob,gender,phone,email,preferred_language,admission_date,discharge_date,discharge_time,length_of_stay,primary_diagnosis,discharge_disposition,discharge_medications,allergies,attending_physician,pcp_name,pcp_phone,readmission_risk_score,fall_risk,notes
MRN001,John Doe,1960-05-15,M,555-1234,john@test.com,English,2026-01-01,2026-01-05,10:30,4,Heart failure,Home,Medication A,Penicillin,Dr. Smith,Dr. Jones,555-5678,High,Low,Test notes
MRN002,Jane Smith,1975-08-20,F,,,Spanish,2026-01-02,2026-01-06,,4,Pneumonia,Skilled nursing facility,"Med A, Med B",NKDA,Dr. Brown,,,Very High,High,SNF patient`;

describe('CSV Parser', () => {
  beforeAll(() => {
    // Create test directory and file
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    fs.writeFileSync(TEST_CSV, VALID_CSV);
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(TEST_CSV)) {
      fs.unlinkSync(TEST_CSV);
    }
    if (fs.existsSync(TEST_DIR)) {
      fs.rmdirSync(TEST_DIR);
    }
  });

  describe('parsePatientCSV', () => {
    it('should parse a valid CSV file', () => {
      const patients = parsePatientCSV(TEST_CSV);

      expect(patients).toHaveLength(2);
      expect(patients[0].patientId).toBe('MRN001');
      expect(patients[1].patientId).toBe('MRN002');
    });

    it('should correctly parse all patient fields', () => {
      const patients = parsePatientCSV(TEST_CSV);
      const patient = patients[0];

      expect(patient.patientId).toBe('MRN001');
      expect(patient.patientName).toBe('John Doe');
      expect(patient.dob).toBe('1960-05-15');
      expect(patient.gender).toBe('M');
      expect(patient.phone).toBe('555-1234');
      expect(patient.email).toBe('john@test.com');
      expect(patient.preferredLanguage).toBe('English');
      expect(patient.admissionDate).toBe('2026-01-01');
      expect(patient.dischargeDate).toBe('2026-01-05');
      expect(patient.dischargeTime).toBe('10:30');
      expect(patient.lengthOfStay).toBe(4);
      expect(patient.primaryDiagnosis).toBe('Heart failure');
      expect(patient.dischargeDisposition).toBe('Home');
      expect(patient.dischargeMedications).toBe('Medication A');
      expect(patient.allergies).toBe('Penicillin');
      expect(patient.attendingPhysician).toBe('Dr. Smith');
      expect(patient.pcpName).toBe('Dr. Jones');
      expect(patient.pcpPhone).toBe('555-5678');
      expect(patient.readmissionRiskScore).toBe('High');
      expect(patient.fallRisk).toBe('Low');
      expect(patient.notes).toBe('Test notes');
    });

    it('should handle nullable fields correctly', () => {
      const patients = parsePatientCSV(TEST_CSV);
      const patient = patients[1]; // Jane Smith has empty nullable fields

      expect(patient.phone).toBeNull();
      expect(patient.email).toBeNull();
      expect(patient.dischargeTime).toBeNull();
      expect(patient.pcpName).toBeNull();
      expect(patient.pcpPhone).toBeNull();
    });

    it('should handle quoted fields with commas', () => {
      const patients = parsePatientCSV(TEST_CSV);
      const patient = patients[1];

      expect(patient.dischargeMedications).toBe('Med A, Med B');
    });

    it('should parse SNF discharge disposition', () => {
      const patients = parsePatientCSV(TEST_CSV);
      const snfPatient = patients[1];

      expect(snfPatient.dischargeDisposition).toBe('Skilled nursing facility');
    });

    it('should parse Very High risk level', () => {
      const patients = parsePatientCSV(TEST_CSV);
      const highRiskPatient = patients[1];

      expect(highRiskPatient.readmissionRiskScore).toBe('Very High');
    });

    it('should throw error for non-existent file', () => {
      expect(() => parsePatientCSV('/non/existent/file.csv')).toThrow('CSV file not found');
    });

    it('should throw error for invalid discharge disposition', () => {
      const invalidCSV = `patient_id,patient_name,dob,gender,phone,email,preferred_language,admission_date,discharge_date,discharge_time,length_of_stay,primary_diagnosis,discharge_disposition,discharge_medications,allergies,attending_physician,pcp_name,pcp_phone,readmission_risk_score,fall_risk,notes
MRN001,Test,1960-01-01,M,,,English,2026-01-01,2026-01-05,,4,Test,Invalid Disposition,Med,NKDA,Dr. A,,,Medium,,`;

      const invalidPath = path.join(TEST_DIR, 'invalid-disposition.csv');
      fs.writeFileSync(invalidPath, invalidCSV);

      expect(() => parsePatientCSV(invalidPath)).toThrow('Invalid discharge disposition');

      fs.unlinkSync(invalidPath);
    });

    it('should throw error for invalid risk level', () => {
      const invalidCSV = `patient_id,patient_name,dob,gender,phone,email,preferred_language,admission_date,discharge_date,discharge_time,length_of_stay,primary_diagnosis,discharge_disposition,discharge_medications,allergies,attending_physician,pcp_name,pcp_phone,readmission_risk_score,fall_risk,notes
MRN001,Test,1960-01-01,M,,,English,2026-01-01,2026-01-05,,4,Test,Home,Med,NKDA,Dr. A,,,Invalid,,`;

      const invalidPath = path.join(TEST_DIR, 'invalid-risk.csv');
      fs.writeFileSync(invalidPath, invalidCSV);

      expect(() => parsePatientCSV(invalidPath)).toThrow('Invalid risk level');

      fs.unlinkSync(invalidPath);
    });
  });

  describe('loadPatients', () => {
    it('should load patients from default CSV path', () => {
      // This tests against the actual patient_data.csv
      const patients = loadPatients();

      expect(patients.length).toBeGreaterThan(0);
      expect(patients[0]).toHaveProperty('patientId');
      expect(patients[0]).toHaveProperty('dischargeDate');
    });
  });

  describe('getDefaultCSVPath', () => {
    it('should return path to data/patient_data.csv', () => {
      const csvPath = getDefaultCSVPath();

      expect(csvPath).toContain('data');
      expect(csvPath).toContain('patient_data.csv');
    });
  });
});

describe('CSV Parser with real data', () => {
  it('should correctly parse the actual patient_data.csv', () => {
    const patients = loadPatients();

    // Verify we have the expected number of patients
    expect(patients).toHaveLength(15);

    // Check a specific patient (Maria Garcia - first row)
    const maria = patients.find(p => p.patientId === 'MRN8472');
    expect(maria).toBeDefined();
    expect(maria?.patientName).toBe('Maria Garcia');
    expect(maria?.dischargeDisposition).toBe('Home with home health');
    expect(maria?.readmissionRiskScore).toBe('High');

    // Check SNF patients
    const snfPatients = patients.filter(p => p.dischargeDisposition === 'Skilled nursing facility');
    expect(snfPatients).toHaveLength(2);

    // Check high risk patients (High or Very High)
    const highRiskPatients = patients.filter(p =>
      p.readmissionRiskScore === 'High' || p.readmissionRiskScore === 'Very High'
    );
    expect(highRiskPatients.length).toBeGreaterThan(0);
  });
});
