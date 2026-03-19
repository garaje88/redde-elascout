export interface RepresentativeInfo {
  name: string;
  email?: string;
  phone?: string;
  agency?: string;
}

export interface ClubHistoryEntry {
  club: string;
  startYear: number;
  endYear?: number;
  position?: string;
}

export interface TitleEntry {
  title: string;
  year: number;
  club?: string;
  category?: string;
}

export interface AthletePersonal {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  contactEmail: string;
  contactPhone: string;
  photoURL?: string;
}

export interface AthleteMetadata {
  createdBy: string;
  organizationId?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface PhysicalAvg {
  velocidad: number;
  aceleracionCorta: number;
  fuerzaDuelos: number;
  resistencia: number;
  potencia: number;
  reaccion: number;
  saquesLargos: number;
  saquesCortos: number;
}

export interface TechnicalAvg {
  pase: number;
  control: number;
  regate: number;
  disparo: number;
  cabecea: number;
  presion: number;
}

export interface TacticalAvg {
  posicionamiento: number;
  marcaje: number;
  desmarque: number;
  transicion: number;
}

export interface AthleteDoc extends AthletePersonal, AthleteMetadata {
  id?: string;
  position?: string;
  secondaryPosition?: string;
  preferredFoot?: string;
  height?: number;
  weight?: number;
  currentClub?: string;
  contractEnd?: string;
  clubHistory?: ClubHistoryEntry[];
  titles?: TitleEntry[];
  representative?: RepresentativeInfo;
  physicalAvg?: PhysicalAvg;
  technicalAvg?: TechnicalAvg;
  tacticalAvg?: TacticalAvg;
  evaluationCount?: number;
}

export interface CreateAthleteInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  contactEmail: string;
  contactPhone: string;
  photoURL?: string;
  organizationId?: string;
  position?: string;
  secondaryPosition?: string;
  preferredFoot?: string;
  height?: number;
  weight?: number;
  currentClub?: string;
  contractEnd?: string;
  clubHistory?: ClubHistoryEntry[];
  titles?: TitleEntry[];
  representative?: RepresentativeInfo;
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
  position?: string;
  secondaryPosition?: string;
  preferredFoot?: string;
  height?: number;
  weight?: number;
  currentClub?: string;
  contractEnd?: string;
  clubHistory?: ClubHistoryEntry[];
  titles?: TitleEntry[];
  representative?: RepresentativeInfo;
}

export interface AthleteFilters {
  createdBy?: string;
  organizationId?: string;
  search?: string;
  nationality?: string;
  position?: string;
  ageRange?: string;
  club?: string;
}

export interface PaginationParams {
  limit: number;
  startAfter?: string;
}
