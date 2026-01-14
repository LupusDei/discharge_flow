import { describe, it, expect } from 'vitest';
import { parsePatientCSV } from './csvParser';

// Sample valid CSV content
const VALID_CSV = `patient_id,patient_name,dob,gender,phone,email,preferred_language,admission_date,discharge_date,discharge_time,length_of_stay,primary_diagnosis,discharge_disposition,discharge_medications,allergies,attending_physician,pcp_name,pcp_phone,readmission_risk_score,fall_risk,notes
MRN001,John Doe,1960-05-15,M,555-1234,john@test.com,English,2026-01-01,2026-01-05,10:30,4,Heart failure,Home,Medication A,Penicillin,Dr. Smith,Dr. Jones,555-5678,High,Low,Test notes
MRN002,Jane Smith,1975-08-20,F,,,Spanish,2026-01-02,2026-01-06,,4,Pneumonia,Skilled nursing facility,"Med A, Med B",NKDA,Dr. Brown,,,Very High,High,SNF patient`;

describe('CSV Parser', () => {
  describe('parsePatientCSV', () => {
    it('should parse a valid CSV string', () => {
      const patients = parsePatientCSV(VALID_CSV);

      expect(patients).toHaveLength(2);
      expect(patients[0].patientId).toBe('MRN001');
      expect(patients[1].patientId).toBe('MRN002');
    });

    it('should correctly parse all patient fields', () => {
      const patients = parsePatientCSV(VALID_CSV);
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
      const patients = parsePatientCSV(VALID_CSV);
      const patient = patients[1]; // Jane Smith has empty nullable fields

      expect(patient.phone).toBeNull();
      expect(patient.email).toBeNull();
      expect(patient.dischargeTime).toBeNull();
      expect(patient.pcpName).toBeNull();
      expect(patient.pcpPhone).toBeNull();
    });

    it('should handle quoted fields with commas', () => {
      const patients = parsePatientCSV(VALID_CSV);
      const patient = patients[1];

      expect(patient.dischargeMedications).toBe('Med A, Med B');
    });

    it('should parse SNF discharge disposition', () => {
      const patients = parsePatientCSV(VALID_CSV);
      const snfPatient = patients[1];

      expect(snfPatient.dischargeDisposition).toBe('Skilled nursing facility');
    });

    it('should parse Very High risk level', () => {
      const patients = parsePatientCSV(VALID_CSV);
      const highRiskPatient = patients[1];

      expect(highRiskPatient.readmissionRiskScore).toBe('Very High');
    });

    it('should throw error for empty CSV', () => {
      expect(() => parsePatientCSV('')).toThrow('CSV must have a header row and at least one data row');
    });

    it('should throw error for CSV with only header', () => {
      const headerOnly = 'patient_id,patient_name,dob';
      expect(() => parsePatientCSV(headerOnly)).toThrow('CSV must have a header row and at least one data row');
    });

    it('should throw error for invalid discharge disposition', () => {
      const invalidCSV = `patient_id,patient_name,dob,gender,phone,email,preferred_language,admission_date,discharge_date,discharge_time,length_of_stay,primary_diagnosis,discharge_disposition,discharge_medications,allergies,attending_physician,pcp_name,pcp_phone,readmission_risk_score,fall_risk,notes
MRN001,Test,1960-01-01,M,,,English,2026-01-01,2026-01-05,,4,Test,Invalid Disposition,Med,NKDA,Dr. A,,,Medium,,`;

      expect(() => parsePatientCSV(invalidCSV)).toThrow('Invalid discharge disposition');
    });

    it('should throw error for invalid risk level', () => {
      const invalidCSV = `patient_id,patient_name,dob,gender,phone,email,preferred_language,admission_date,discharge_date,discharge_time,length_of_stay,primary_diagnosis,discharge_disposition,discharge_medications,allergies,attending_physician,pcp_name,pcp_phone,readmission_risk_score,fall_risk,notes
MRN001,Test,1960-01-01,M,,,English,2026-01-01,2026-01-05,,4,Test,Home,Med,NKDA,Dr. A,,,Invalid,,`;

      expect(() => parsePatientCSV(invalidCSV)).toThrow('Invalid risk level');
    });

    it('should throw error for missing required field', () => {
      const missingField = `patient_id,patient_name,dob,gender,phone,email,preferred_language,admission_date,discharge_date,discharge_time,length_of_stay,primary_diagnosis,discharge_disposition,discharge_medications,allergies,attending_physician,pcp_name,pcp_phone,readmission_risk_score,fall_risk,notes
,Test,1960-01-01,M,,,English,2026-01-01,2026-01-05,,4,Test,Home,Med,NKDA,Dr. A,,,High,,`;

      expect(() => parsePatientCSV(missingField)).toThrow('Missing required field');
    });
  });
});
