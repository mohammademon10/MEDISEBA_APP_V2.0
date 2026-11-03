export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'patient' | 'doctor' | 'admin';
export type PreferredLanguage = 'bn' | 'en';
export type Gender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type FacilityType = 'hospital' | 'clinic' | 'diagnostic_center' | 'telehealth_center';
export type Weekday = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type ConsentStatus = 'active' | 'revoked' | 'expired';
export type ReferralStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          preferred_language: PreferredLanguage;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name: string;
          phone?: string | null;
          preferred_language?: PreferredLanguage;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string;
          phone?: string | null;
          preferred_language?: PreferredLanguage;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      facilities: {
        Row: {
          id: string;
          name: string;
          type: FacilityType;
          district: string;
          address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: FacilityType;
          district: string;
          address: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: FacilityType;
          district?: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      doctors: {
        Row: {
          id: string;
          bmdc_number: string | null;
          specialty: string;
          facility_id: string | null;
          bio: string | null;
          consultation_fee: number;
          is_verified: boolean;
          verified_at: string | null;
          verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          bmdc_number?: string | null;
          specialty: string;
          facility_id?: string | null;
          bio?: string | null;
          consultation_fee?: number;
          is_verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bmdc_number?: string | null;
          specialty?: string;
          facility_id?: string | null;
          bio?: string | null;
          consultation_fee?: number;
          is_verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doctors_facility_id_fkey";
            columns: ["facility_id"];
            referencedRelation: "facilities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doctors_id_fkey";
            columns: ["id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      patients: {
        Row: {
          id: string;
          patient_code: string;
          date_of_birth: string | null;
          gender: Gender | null;
          blood_group: BloodGroup | null;
          address_district: string | null;
          allergies: string | null;
          chronic_conditions: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          patient_code: string;
          date_of_birth?: string | null;
          gender?: Gender | null;
          blood_group?: BloodGroup | null;
          address_district?: string | null;
          allergies?: string | null;
          chronic_conditions?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_code?: string;
          date_of_birth?: string | null;
          gender?: Gender | null;
          blood_group?: BloodGroup | null;
          address_district?: string | null;
          allergies?: string | null;
          chronic_conditions?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patients_id_fkey";
            columns: ["id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      doctor_schedules: {
        Row: {
          id: string;
          doctor_id: string;
          weekday: Weekday;
          start_time: string;
          end_time: string;
          slot_minutes: number;
          max_patients: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          weekday: Weekday;
          start_time: string;
          end_time: string;
          slot_minutes?: number;
          max_patients?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          weekday?: Weekday;
          start_time?: string;
          end_time?: string;
          slot_minutes?: number;
          max_patients?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          }
        ];
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          scheduled_at: string;
          token_number: number;
          status: AppointmentStatus;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          scheduled_at: string;
          token_number: number;
          status?: AppointmentStatus;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string;
          scheduled_at?: string;
          token_number?: number;
          status?: AppointmentStatus;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          }
        ];
      };
      encounters: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          facility_id: string | null;
          appointment_id: string | null;
          visit_date: string;
          chief_complaint: string;
          notes: string | null;
          diagnosis_text: string | null;
          follow_up_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          facility_id?: string | null;
          appointment_id?: string | null;
          visit_date?: string;
          chief_complaint: string;
          notes?: string | null;
          diagnosis_text?: string | null;
          follow_up_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string;
          facility_id?: string | null;
          appointment_id?: string | null;
          visit_date?: string;
          chief_complaint?: string;
          notes?: string | null;
          diagnosis_text?: string | null;
          follow_up_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "encounters_appointment_id_fkey";
            columns: ["appointment_id"];
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_facility_id_fkey";
            columns: ["facility_id"];
            referencedRelation: "facilities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          }
        ];
      };
      prescriptions: {
        Row: {
          id: string;
          encounter_id: string | null;
          patient_id: string;
          doctor_id: string;
          items: Json;
          advice: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          encounter_id?: string | null;
          patient_id: string;
          doctor_id: string;
          items?: Json;
          advice?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          encounter_id?: string | null;
          patient_id?: string;
          doctor_id?: string;
          items?: Json;
          advice?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescriptions_encounter_id_fkey";
            columns: ["encounter_id"];
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          }
        ];
      };
      lab_reports: {
        Row: {
          id: string;
          patient_id: string;
          uploaded_by: string;
          encounter_id: string | null;
          title: string;
          file_path: string;
          report_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          uploaded_by: string;
          encounter_id?: string | null;
          title: string;
          file_path: string;
          report_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          uploaded_by?: string;
          encounter_id?: string | null;
          title?: string;
          file_path?: string;
          report_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lab_reports_encounter_id_fkey";
            columns: ["encounter_id"];
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lab_reports_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lab_reports_uploaded_by_fkey";
            columns: ["uploaded_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      consents: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string | null;
          scope: string[];
          status: ConsentStatus;
          token_hash: string | null;
          expires_at: string;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id?: string | null;
          scope: string[];
          status?: ConsentStatus;
          token_hash?: string | null;
          expires_at: string;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string | null;
          scope?: string[];
          status?: ConsentStatus;
          token_hash?: string | null;
          expires_at?: string;
          created_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consents_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consents_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          }
        ];
      };
      record_access_logs: {
        Row: {
          id: string;
          patient_id: string;
          accessor_id: string;
          action: string;
          resource_type: string;
          resource_id: string | null;
          allowed: boolean;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          accessor_id: string;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          allowed: boolean;
          reason?: string | null;
          created_at?: string;
        };
        Update: never; // Append-only! No updates allowed
        Relationships: [
          {
            foreignKeyName: "record_access_logs_accessor_id_fkey";
            columns: ["accessor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "record_access_logs_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          }
        ];
      };
      referrals: {
        Row: {
          id: string;
          patient_id: string;
          from_doctor_id: string;
          to_facility_id: string | null;
          to_doctor_id: string | null;
          reason: string;
          status: ReferralStatus;
          consent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          from_doctor_id: string;
          to_facility_id?: string | null;
          to_doctor_id?: string | null;
          reason: string;
          status?: ReferralStatus;
          consent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          from_doctor_id?: string;
          to_facility_id?: string | null;
          to_doctor_id?: string | null;
          reason?: string;
          status?: ReferralStatus;
          consent_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_consent_id_fkey";
            columns: ["consent_id"];
            referencedRelation: "consents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_from_doctor_id_fkey";
            columns: ["from_doctor_id"];
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_to_doctor_id_fkey";
            columns: ["to_doctor_id"];
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_to_facility_id_fkey";
            columns: ["to_facility_id"];
            referencedRelation: "facilities";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      public_doctors: {
        Row: {
          id: string;
          full_name: string;
          bmdc_number: string | null;
          specialty: string;
          facility_id: string | null;
          facility_name: string | null;
          bio: string | null;
          consultation_fee: number;
          is_verified: boolean;
          created_at: string;
        };
      };
    };
    Functions: {
      current_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole | null;
      };
      has_active_consent: {
        Args: {
          p_patient: string;
          p_scope: string;
        };
        Returns: boolean;
      };
      log_record_access: {
        Args: {
          p_patient_id: string;
          p_action: string;
          p_resource_type: string;
          p_resource_id?: string | null;
          p_allowed: boolean;
          p_reason?: string | null;
        };
        Returns: string;
      };
    };
  };
}
