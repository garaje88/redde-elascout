export interface AthletePersonal {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  contactEmail?: string;
  contactPhone?: string;
  photoURL?: string;
}

export interface AthleteMetadata {
  createdBy: string;
  organizationId?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface AthleteDoc extends AthletePersonal, AthleteMetadata {
  id?: string;
}

export interface CreateAthleteInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  contactEmail?: string;
  contactPhone?: string;
  photoURL?: string;
  organizationId?: string;
}

export interface UpdateAthleteInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  contactEmail?: string;
  contactPhone?: string;
  photoURL?: string;
  organizationId?: string;
}

export interface AthleteFilters {
  createdBy?: string;
  organizationId?: string;
  search?: string;
}

export interface PaginationParams {
  limit: number;
  startAfter?: string;
}
