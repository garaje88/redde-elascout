/**
 * seed-athletes.ts
 *
 * Inserta 100 deportistas de prueba en Firestore.
 * Los campos siguen el dominio real de la base de datos (athletes/{id}).
 *
 * Uso:
 *   npx tsx src/scripts/seed-athletes.ts
 *
 * Variables de entorno requeridas:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import "dotenv/config";
import "../config/firebase";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const db = getFirestore();
const COLLECTION = "athletes";
const SEED_UID = "seed-script";
const BATCH_SIZE = 499;
const TARGET_COUNT = 100;

// ─── Types (alineados con el dominio real de Firestore) ───────────────────────

interface ClubHistory {
  club: string;
  startYear: number;
  endYear?: number;    // ausente = club actual
  position: string;
}

interface Title {
  title: string;
  year: number;
  club: string;
  category: string;   // "Profesional", "Juvenil", "Selección", etc.
}

interface AthleteDoc {
  // M1 — Personal
  firstName: string;
  lastName: string;
  dateOfBirth: Timestamp;
  nationality: string;
  contactEmail: string | null;
  contactPhone: string | null;
  photoURL: string | null;
  // M2 — Profesional
  position: string;
  secondaryPosition: string | null;
  preferredFoot: "Derecho" | "Izquierdo" | "Ambos";
  height: number;
  weight: number;
  currentClub: string;
  contractEnd: Timestamp | null;
  // M3 — Historial
  clubHistory: ClubHistory[];
  // M4 — Títulos
  titles: Title[];
  // Metadatos
  createdBy: string;
  organizationId: string | null;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTimestamp(isoDate: string): Timestamp {
  return Timestamp.fromDate(new Date(isoDate));
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Datos de referencia ──────────────────────────────────────────────────────

const POSITIONS = [
  "Portero",
  "Defensa Central",
  "Lateral Derecho",
  "Lateral Izquierdo",
  "Mediocampista Defensivo",
  "Mediocampista Central",
  "Mediocampista Ofensivo",
  "Extremo Derecho",
  "Extremo Izquierdo",
  "Delantero Centro",
  "Segundo Delantero",
];

const NATIONALITIES = [
  "Argentina", "Brasil", "Colombia", "México", "Uruguay", "Chile",
  "España", "Francia", "Alemania", "Portugal", "Italia", "Inglaterra",
  "Holanda", "Bélgica", "Croacia", "Senegal", "Marruecos", "Japón",
  "Estados Unidos", "Ecuador", "Paraguay", "Perú", "Venezuela", "Bolivia",
];

const CLUBS = [
  "Real Madrid", "FC Barcelona", "Atlético de Madrid", "Sevilla FC",
  "Manchester City", "Liverpool FC", "Chelsea FC", "Arsenal FC", "Manchester United",
  "PSG", "Olympique de Marsella", "Bayern Múnich", "Borussia Dortmund",
  "Juventus", "Inter de Milán", "AC Milan", "Napoli", "Roma",
  "Ajax", "PSV Eindhoven", "Benfica", "Porto", "Sporting CP",
  "River Plate", "Boca Juniors", "Flamengo", "Palmeiras", "Santos FC",
  "Nacional", "Peñarol", "América", "Chivas", "Cruz Azul",
  "Independiente", "Racing Club", "San Lorenzo", "Lanús",
];

const TITLE_NAMES = [
  "Liga Nacional", "Copa Nacional", "Supercopa", "Torneo Apertura",
  "Torneo Clausura", "Champions League", "Copa Libertadores", "Copa Sudamericana",
  "Liga MX", "Premier League", "La Liga", "Serie A", "Bundesliga",
  "Ligue 1", "Copa del Rey", "FA Cup", "Copa de Francia",
];

const TITLE_CATEGORIES = ["Profesional", "Juvenil", "Sub-20", "Sub-17", "Selección", "Amateur"];

const FIRST_NAMES_M = [
  "Alejandro", "Andrés", "Carlos", "Daniel", "David", "Diego", "Eduardo",
  "Felipe", "Fernando", "Francisco", "Gabriel", "Gonzalo", "Guillermo",
  "Hernán", "Ignacio", "Iván", "Javier", "Jorge", "José", "Juan",
  "Julián", "Kevin", "Leonardo", "Luis", "Marcos", "Martín", "Mateo",
  "Mauricio", "Miguel", "Nicolás", "Pablo", "Pedro", "Rafael", "Ramón",
  "Ricardo", "Roberto", "Rodrigo", "Sebastián", "Sergio", "Tomás",
  "Víctor", "Agustín", "Benjamín", "César", "Esteban", "Federico",
  "Germán", "Héctor", "Leandro", "Lucas",
];

const LAST_NAMES = [
  "García", "Rodríguez", "González", "Fernández", "López", "Martínez",
  "Sánchez", "Pérez", "Torres", "Flores", "Rivera", "Gómez", "Díaz",
  "Reyes", "Morales", "Cruz", "Ortega", "Ramos", "Vargas", "Herrera",
  "Medina", "Aguilar", "Castillo", "Jiménez", "Romero", "Álvarez",
  "Silva", "Navarro", "Molina", "Suárez", "Delgado", "Mendoza",
  "Ríos", "Campos", "Vega", "Núñez", "Cabrera", "Guerrero", "Miranda",
  "Rojas", "Santos", "Pereira", "Ferreira", "Alves", "Costa", "Souza",
  "Lima", "Oliveira", "Gomes", "Barbosa",
];

// ─── 30 Jugadores de referencia ───────────────────────────────────────────────

interface PlayerSeed {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  secondaryPosition: string | null;
  preferredFoot: "Derecho" | "Izquierdo" | "Ambos";
  height: number;
  weight: number;
  currentClub: string;
  contractEnd: string;
  contactEmail: string | null;
  contactPhone: string | null;
  clubHistory: ClubHistory[];
  titles: Title[];
}

const REFERENCE_PLAYERS: PlayerSeed[] = [
  // ── Porteros ──
  {
    firstName: "Alisson", lastName: "Becker", dateOfBirth: "1992-10-02",
    nationality: "Brasil", position: "Portero", secondaryPosition: null,
    preferredFoot: "Derecho", height: 193, weight: 91,
    currentClub: "Liverpool FC", contractEnd: "2027-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Sport Club Internacional", startYear: 2010, endYear: 2016, position: "Portero" },
      { club: "AS Roma", startYear: 2016, endYear: 2018, position: "Portero" },
      { club: "Liverpool FC", startYear: 2018, position: "Portero" },
    ],
    titles: [
      { title: "Champions League", year: 2019, club: "Liverpool FC", category: "Profesional" },
      { title: "Copa del Mundo", year: 2022, club: "Brasil", category: "Selección" },
    ],
  },
  {
    firstName: "Thibaut", lastName: "Courtois", dateOfBirth: "1992-05-11",
    nationality: "Bélgica", position: "Portero", secondaryPosition: null,
    preferredFoot: "Izquierdo", height: 199, weight: 96,
    currentClub: "Real Madrid", contractEnd: "2026-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Racing Genk", startYear: 2009, endYear: 2011, position: "Portero" },
      { club: "Atlético de Madrid", startYear: 2011, endYear: 2014, position: "Portero" },
      { club: "Chelsea FC", startYear: 2014, endYear: 2018, position: "Portero" },
      { club: "Real Madrid", startYear: 2018, position: "Portero" },
    ],
    titles: [
      { title: "Champions League", year: 2022, club: "Real Madrid", category: "Profesional" },
      { title: "La Liga", year: 2020, club: "Real Madrid", category: "Profesional" },
    ],
  },
  // ── Defensas ──
  {
    firstName: "Virgil", lastName: "van Dijk", dateOfBirth: "1991-07-08",
    nationality: "Holanda", position: "Defensa Central", secondaryPosition: null,
    preferredFoot: "Derecho", height: 193, weight: 92,
    currentClub: "Liverpool FC", contractEnd: "2025-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Groningen", startYear: 2011, endYear: 2013, position: "Defensa Central" },
      { club: "Celtic", startYear: 2013, endYear: 2015, position: "Defensa Central" },
      { club: "Southampton", startYear: 2015, endYear: 2018, position: "Defensa Central" },
      { club: "Liverpool FC", startYear: 2018, position: "Defensa Central" },
    ],
    titles: [
      { title: "Champions League", year: 2019, club: "Liverpool FC", category: "Profesional" },
    ],
  },
  {
    firstName: "Marquinhos", lastName: "Corrêa", dateOfBirth: "1994-05-14",
    nationality: "Brasil", position: "Defensa Central", secondaryPosition: null,
    preferredFoot: "Derecho", height: 183, weight: 75,
    currentClub: "PSG", contractEnd: "2026-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "São Paulo", startYear: 2011, endYear: 2013, position: "Defensa Central" },
      { club: "AS Roma", startYear: 2013, endYear: 2013, position: "Defensa Central" },
      { club: "PSG", startYear: 2013, position: "Defensa Central" },
    ],
    titles: [
      { title: "Ligue 1", year: 2023, club: "PSG", category: "Profesional" },
      { title: "Copa de Francia", year: 2021, club: "PSG", category: "Profesional" },
    ],
  },
  {
    firstName: "Achraf", lastName: "Hakimi", dateOfBirth: "1998-11-04",
    nationality: "Marruecos", position: "Lateral Derecho", secondaryPosition: null,
    preferredFoot: "Derecho", height: 181, weight: 73,
    currentClub: "PSG", contractEnd: "2026-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Real Madrid", startYear: 2016, endYear: 2018, position: "Lateral Derecho" },
      { club: "Borussia Dortmund", startYear: 2018, endYear: 2020, position: "Lateral Derecho" },
      { club: "Inter de Milán", startYear: 2020, endYear: 2021, position: "Lateral Derecho" },
      { club: "PSG", startYear: 2021, position: "Lateral Derecho" },
    ],
    titles: [
      { title: "Serie A", year: 2021, club: "Inter de Milán", category: "Profesional" },
    ],
  },
  // ── Mediocampistas ──
  {
    firstName: "Luka", lastName: "Modrić", dateOfBirth: "1985-09-09",
    nationality: "Croacia", position: "Mediocampista Central", secondaryPosition: null,
    preferredFoot: "Derecho", height: 172, weight: 66,
    currentClub: "Real Madrid", contractEnd: "2025-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Dinamo Zagreb", startYear: 2003, endYear: 2008, position: "Mediocampista Central" },
      { club: "Tottenham Hotspur", startYear: 2008, endYear: 2012, position: "Mediocampista Central" },
      { club: "Real Madrid", startYear: 2012, position: "Mediocampista Central" },
    ],
    titles: [
      { title: "Champions League", year: 2018, club: "Real Madrid", category: "Profesional" },
      { title: "Balón de Oro", year: 2018, club: "Real Madrid", category: "Profesional" },
    ],
  },
  {
    firstName: "Kevin", lastName: "De Bruyne", dateOfBirth: "1991-06-28",
    nationality: "Bélgica", position: "Mediocampista Ofensivo",
    secondaryPosition: "Mediocampista Central",
    preferredFoot: "Derecho", height: 181, weight: 70,
    currentClub: "Manchester City", contractEnd: "2025-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "KRC Genk", startYear: 2008, endYear: 2012, position: "Mediocampista" },
      { club: "Chelsea FC", startYear: 2012, endYear: 2014, position: "Mediocampista" },
      { club: "VfL Wolfsburg", startYear: 2014, endYear: 2015, position: "Mediocampista Ofensivo" },
      { club: "Manchester City", startYear: 2015, position: "Mediocampista Ofensivo" },
    ],
    titles: [
      { title: "Premier League", year: 2023, club: "Manchester City", category: "Profesional" },
      { title: "Champions League", year: 2023, club: "Manchester City", category: "Profesional" },
    ],
  },
  {
    firstName: "Casemiro", lastName: "Martins", dateOfBirth: "1992-02-23",
    nationality: "Brasil", position: "Mediocampista Defensivo", secondaryPosition: null,
    preferredFoot: "Derecho", height: 185, weight: 84,
    currentClub: "Manchester United", contractEnd: "2026-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "São Paulo", startYear: 2010, endYear: 2013, position: "Mediocampista Defensivo" },
      { club: "Real Madrid", startYear: 2013, endYear: 2022, position: "Mediocampista Defensivo" },
      { club: "Manchester United", startYear: 2022, position: "Mediocampista Defensivo" },
    ],
    titles: [
      { title: "Champions League", year: 2022, club: "Real Madrid", category: "Profesional" },
      { title: "La Liga", year: 2020, club: "Real Madrid", category: "Profesional" },
    ],
  },
  {
    firstName: "Pedri", lastName: "González", dateOfBirth: "2002-11-25",
    nationality: "España", position: "Mediocampista Central",
    secondaryPosition: "Mediocampista Ofensivo",
    preferredFoot: "Derecho", height: 174, weight: 60,
    currentClub: "FC Barcelona", contractEnd: "2026-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Las Palmas", startYear: 2019, endYear: 2020, position: "Mediocampista" },
      { club: "FC Barcelona", startYear: 2020, position: "Mediocampista Central" },
    ],
    titles: [
      { title: "Copa del Rey", year: 2021, club: "FC Barcelona", category: "Profesional" },
    ],
  },
  {
    firstName: "Jude", lastName: "Bellingham", dateOfBirth: "2003-06-29",
    nationality: "Inglaterra", position: "Mediocampista Central",
    secondaryPosition: "Mediocampista Ofensivo",
    preferredFoot: "Derecho", height: 186, weight: 75,
    currentClub: "Real Madrid", contractEnd: "2029-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Birmingham City", startYear: 2019, endYear: 2020, position: "Mediocampista" },
      { club: "Borussia Dortmund", startYear: 2020, endYear: 2023, position: "Mediocampista Central" },
      { club: "Real Madrid", startYear: 2023, position: "Mediocampista Central" },
    ],
    titles: [
      { title: "La Liga", year: 2024, club: "Real Madrid", category: "Profesional" },
    ],
  },
  // ── Extremos ──
  {
    firstName: "Vinicius", lastName: "Junior", dateOfBirth: "2000-07-12",
    nationality: "Brasil", position: "Extremo Izquierdo", secondaryPosition: "Extremo Derecho",
    preferredFoot: "Derecho", height: 176, weight: 73,
    currentClub: "Real Madrid", contractEnd: "2027-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Flamengo", startYear: 2017, endYear: 2018, position: "Extremo" },
      { club: "Real Madrid", startYear: 2018, position: "Extremo Izquierdo" },
    ],
    titles: [
      { title: "Champions League", year: 2022, club: "Real Madrid", category: "Profesional" },
      { title: "La Liga", year: 2022, club: "Real Madrid", category: "Profesional" },
    ],
  },
  {
    firstName: "Rodrygo", lastName: "Goes", dateOfBirth: "2001-01-09",
    nationality: "Brasil", position: "Extremo Derecho", secondaryPosition: "Segundo Delantero",
    preferredFoot: "Izquierdo", height: 174, weight: 64,
    currentClub: "Real Madrid", contractEnd: "2028-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Santos FC", startYear: 2017, endYear: 2019, position: "Extremo Derecho" },
      { club: "Real Madrid", startYear: 2019, position: "Extremo Derecho" },
    ],
    titles: [
      { title: "Champions League", year: 2022, club: "Real Madrid", category: "Profesional" },
    ],
  },
  {
    firstName: "Rafael", lastName: "Leão", dateOfBirth: "1999-06-10",
    nationality: "Portugal", position: "Extremo Izquierdo", secondaryPosition: "Delantero Centro",
    preferredFoot: "Derecho", height: 188, weight: 79,
    currentClub: "AC Milan", contractEnd: "2028-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Sporting CP", startYear: 2017, endYear: 2019, position: "Extremo" },
      { club: "Lille", startYear: 2019, endYear: 2019, position: "Extremo Izquierdo" },
      { club: "AC Milan", startYear: 2019, position: "Extremo Izquierdo" },
    ],
    titles: [
      { title: "Serie A", year: 2022, club: "AC Milan", category: "Profesional" },
    ],
  },
  // ── Delanteros ──
  {
    firstName: "Erling", lastName: "Haaland", dateOfBirth: "2000-07-21",
    nationality: "Noruega", position: "Delantero Centro", secondaryPosition: null,
    preferredFoot: "Izquierdo", height: 194, weight: 88,
    currentClub: "Manchester City", contractEnd: "2027-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Molde FK", startYear: 2017, endYear: 2019, position: "Delantero Centro" },
      { club: "Red Bull Salzburg", startYear: 2019, endYear: 2020, position: "Delantero Centro" },
      { club: "Borussia Dortmund", startYear: 2020, endYear: 2022, position: "Delantero Centro" },
      { club: "Manchester City", startYear: 2022, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Premier League", year: 2023, club: "Manchester City", category: "Profesional" },
      { title: "Champions League", year: 2023, club: "Manchester City", category: "Profesional" },
    ],
  },
  {
    firstName: "Kylian", lastName: "Mbappé", dateOfBirth: "1998-12-20",
    nationality: "Francia", position: "Delantero Centro", secondaryPosition: "Extremo Izquierdo",
    preferredFoot: "Derecho", height: 178, weight: 73,
    currentClub: "Real Madrid", contractEnd: "2029-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "AS Monaco", startYear: 2015, endYear: 2017, position: "Extremo Izquierdo" },
      { club: "PSG", startYear: 2017, endYear: 2024, position: "Delantero Centro" },
      { club: "Real Madrid", startYear: 2024, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Copa del Mundo", year: 2018, club: "Francia", category: "Selección" },
      { title: "Ligue 1", year: 2023, club: "PSG", category: "Profesional" },
    ],
  },
  {
    firstName: "Harry", lastName: "Kane", dateOfBirth: "1993-07-28",
    nationality: "Inglaterra", position: "Delantero Centro", secondaryPosition: null,
    preferredFoot: "Derecho", height: 188, weight: 86,
    currentClub: "Bayern Múnich", contractEnd: "2027-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Tottenham Hotspur", startYear: 2010, endYear: 2023, position: "Delantero Centro" },
      { club: "Bayern Múnich", startYear: 2023, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Bundesliga", year: 2024, club: "Bayern Múnich", category: "Profesional" },
    ],
  },
  {
    firstName: "Lautaro", lastName: "Martínez", dateOfBirth: "1997-08-22",
    nationality: "Argentina", position: "Delantero Centro", secondaryPosition: "Segundo Delantero",
    preferredFoot: "Derecho", height: 174, weight: 72,
    currentClub: "Inter de Milán", contractEnd: "2029-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Racing Club", startYear: 2015, endYear: 2018, position: "Delantero Centro" },
      { club: "Inter de Milán", startYear: 2018, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Copa del Mundo", year: 2022, club: "Argentina", category: "Selección" },
      { title: "Serie A", year: 2024, club: "Inter de Milán", category: "Profesional" },
    ],
  },
  {
    firstName: "Julián", lastName: "Álvarez", dateOfBirth: "2000-01-31",
    nationality: "Argentina", position: "Segundo Delantero", secondaryPosition: "Delantero Centro",
    preferredFoot: "Derecho", height: 170, weight: 67,
    currentClub: "Atlético de Madrid", contractEnd: "2029-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "River Plate", startYear: 2018, endYear: 2022, position: "Delantero" },
      { club: "Manchester City", startYear: 2022, endYear: 2024, position: "Segundo Delantero" },
      { club: "Atlético de Madrid", startYear: 2024, position: "Segundo Delantero" },
    ],
    titles: [
      { title: "Copa del Mundo", year: 2022, club: "Argentina", category: "Selección" },
      { title: "Champions League", year: 2023, club: "Manchester City", category: "Profesional" },
    ],
  },
  {
    firstName: "Bukayo", lastName: "Saka", dateOfBirth: "2001-09-05",
    nationality: "Inglaterra", position: "Extremo Derecho", secondaryPosition: "Lateral Izquierdo",
    preferredFoot: "Izquierdo", height: 178, weight: 72,
    currentClub: "Arsenal FC", contractEnd: "2027-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Arsenal FC", startYear: 2019, position: "Extremo Derecho" },
    ],
    titles: [
      { title: "FA Community Shield", year: 2023, club: "Arsenal FC", category: "Profesional" },
    ],
  },
  {
    firstName: "Gavi", lastName: "Páez", dateOfBirth: "2004-08-05",
    nationality: "España", position: "Mediocampista Central",
    secondaryPosition: "Mediocampista Ofensivo",
    preferredFoot: "Izquierdo", height: 173, weight: 60,
    currentClub: "FC Barcelona", contractEnd: "2026-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "FC Barcelona", startYear: 2021, position: "Mediocampista Central" },
    ],
    titles: [
      { title: "UEFA Nations League", year: 2021, club: "España", category: "Selección" },
    ],
  },
  {
    firstName: "Lionel", lastName: "Messi", dateOfBirth: "1987-06-24",
    nationality: "Argentina", position: "Segundo Delantero", secondaryPosition: "Extremo Derecho",
    preferredFoot: "Izquierdo", height: 170, weight: 72,
    currentClub: "Inter Miami CF", contractEnd: "2025-12-31",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "FC Barcelona", startYear: 2004, endYear: 2021, position: "Extremo Derecho" },
      { club: "PSG", startYear: 2021, endYear: 2023, position: "Segundo Delantero" },
      { club: "Inter Miami CF", startYear: 2023, position: "Segundo Delantero" },
    ],
    titles: [
      { title: "Copa del Mundo", year: 2022, club: "Argentina", category: "Selección" },
      { title: "Balón de Oro", year: 2023, club: "Inter Miami CF", category: "Profesional" },
      { title: "Champions League", year: 2015, club: "FC Barcelona", category: "Profesional" },
    ],
  },
  {
    firstName: "Cristiano", lastName: "Ronaldo", dateOfBirth: "1985-02-05",
    nationality: "Portugal", position: "Delantero Centro", secondaryPosition: "Extremo Derecho",
    preferredFoot: "Derecho", height: 187, weight: 83,
    currentClub: "Al Nassr", contractEnd: "2025-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Sporting CP", startYear: 2002, endYear: 2003, position: "Extremo Derecho" },
      { club: "Manchester United", startYear: 2003, endYear: 2009, position: "Extremo Derecho" },
      { club: "Real Madrid", startYear: 2009, endYear: 2018, position: "Delantero Centro" },
      { club: "Juventus", startYear: 2018, endYear: 2021, position: "Delantero Centro" },
      { club: "Manchester United", startYear: 2021, endYear: 2022, position: "Delantero Centro" },
      { club: "Al Nassr", startYear: 2023, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Champions League", year: 2018, club: "Real Madrid", category: "Profesional" },
      { title: "Eurocopa", year: 2016, club: "Portugal", category: "Selección" },
      { title: "Nations League", year: 2019, club: "Portugal", category: "Selección" },
    ],
  },
  {
    firstName: "Neymar", lastName: "Junior", dateOfBirth: "1992-02-05",
    nationality: "Brasil", position: "Extremo Izquierdo", secondaryPosition: "Segundo Delantero",
    preferredFoot: "Derecho", height: 175, weight: 68,
    currentClub: "Al Hilal", contractEnd: "2025-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Santos FC", startYear: 2009, endYear: 2013, position: "Extremo" },
      { club: "FC Barcelona", startYear: 2013, endYear: 2017, position: "Extremo Izquierdo" },
      { club: "PSG", startYear: 2017, endYear: 2023, position: "Extremo Izquierdo" },
      { club: "Al Hilal", startYear: 2023, position: "Extremo Izquierdo" },
    ],
    titles: [
      { title: "Champions League", year: 2015, club: "FC Barcelona", category: "Profesional" },
      { title: "Ligue 1", year: 2022, club: "PSG", category: "Profesional" },
    ],
  },
  {
    firstName: "Antoine", lastName: "Griezmann", dateOfBirth: "1991-03-21",
    nationality: "Francia", position: "Segundo Delantero", secondaryPosition: "Extremo Izquierdo",
    preferredFoot: "Izquierdo", height: 176, weight: 73,
    currentClub: "Atlético de Madrid", contractEnd: "2026-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Real Sociedad", startYear: 2009, endYear: 2014, position: "Extremo Izquierdo" },
      { club: "Atlético de Madrid", startYear: 2014, endYear: 2019, position: "Segundo Delantero" },
      { club: "FC Barcelona", startYear: 2019, endYear: 2021, position: "Segundo Delantero" },
      { club: "Atlético de Madrid", startYear: 2021, position: "Segundo Delantero" },
    ],
    titles: [
      { title: "Copa del Mundo", year: 2018, club: "Francia", category: "Selección" },
      { title: "Eurocopa", year: 2021, club: "Francia", category: "Selección" },
    ],
  },
  {
    firstName: "Federico", lastName: "Valverde", dateOfBirth: "1998-07-22",
    nationality: "Uruguay", position: "Mediocampista Central", secondaryPosition: "Extremo Derecho",
    preferredFoot: "Derecho", height: 182, weight: 78,
    currentClub: "Real Madrid", contractEnd: "2029-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Peñarol", startYear: 2015, endYear: 2016, position: "Mediocampista" },
      { club: "Real Madrid", startYear: 2016, position: "Mediocampista Central" },
    ],
    titles: [
      { title: "Champions League", year: 2022, club: "Real Madrid", category: "Profesional" },
      { title: "La Liga", year: 2022, club: "Real Madrid", category: "Profesional" },
    ],
  },
  {
    firstName: "Darwin", lastName: "Núñez", dateOfBirth: "1999-06-24",
    nationality: "Uruguay", position: "Delantero Centro", secondaryPosition: null,
    preferredFoot: "Izquierdo", height: 187, weight: 80,
    currentClub: "Liverpool FC", contractEnd: "2028-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Peñarol", startYear: 2017, endYear: 2019, position: "Delantero Centro" },
      { club: "Almería", startYear: 2019, endYear: 2020, position: "Delantero Centro" },
      { club: "Benfica", startYear: 2020, endYear: 2022, position: "Delantero Centro" },
      { club: "Liverpool FC", startYear: 2022, position: "Delantero Centro" },
    ],
    titles: [],
  },
  {
    firstName: "Khvicha", lastName: "Kvaratskhelia", dateOfBirth: "2001-02-12",
    nationality: "Georgia", position: "Extremo Izquierdo", secondaryPosition: "Extremo Derecho",
    preferredFoot: "Derecho", height: 183, weight: 76,
    currentClub: "PSG", contractEnd: "2029-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Napoli", startYear: 2022, endYear: 2025, position: "Extremo Izquierdo" },
      { club: "PSG", startYear: 2025, position: "Extremo Izquierdo" },
    ],
    titles: [
      { title: "Serie A", year: 2023, club: "Napoli", category: "Profesional" },
    ],
  },
  {
    firstName: "Florian", lastName: "Wirtz", dateOfBirth: "2003-05-03",
    nationality: "Alemania", position: "Mediocampista Ofensivo", secondaryPosition: "Extremo Izquierdo",
    preferredFoot: "Derecho", height: 177, weight: 70,
    currentClub: "Bayer Leverkusen", contractEnd: "2027-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Bayer Leverkusen", startYear: 2020, position: "Mediocampista Ofensivo" },
    ],
    titles: [
      { title: "Bundesliga", year: 2024, club: "Bayer Leverkusen", category: "Profesional" },
    ],
  },
  {
    firstName: "Phil", lastName: "Foden", dateOfBirth: "2000-05-28",
    nationality: "Inglaterra", position: "Mediocampista Ofensivo", secondaryPosition: "Extremo Izquierdo",
    preferredFoot: "Izquierdo", height: 171, weight: 69,
    currentClub: "Manchester City", contractEnd: "2027-06-30",
    contactEmail: null, contactPhone: null,
    clubHistory: [
      { club: "Manchester City", startYear: 2017, position: "Mediocampista Ofensivo" },
    ],
    titles: [
      { title: "Premier League", year: 2023, club: "Manchester City", category: "Profesional" },
      { title: "Champions League", year: 2023, club: "Manchester City", category: "Profesional" },
    ],
  },
];

// ─── Generador de jugadores sintéticos ───────────────────────────────────────

function generateSyntheticPlayers(count: number): PlayerSeed[] {
  const players: PlayerSeed[] = [];

  for (let i = 0; i < count; i++) {
    const position = pick(POSITIONS);
    const isGK = position === "Portero";
    const birthYear = rand(1988, 2005);
    const birthMonth = rand(1, 12).toString().padStart(2, "0");
    const birthDay = rand(1, 28).toString().padStart(2, "0");

    const contractYear = rand(2025, 2028);

    // Historial de clubes (1-4 entradas)
    const historyCount = rand(1, 4);
    const clubHistory: ClubHistory[] = [];
    let yearCursor = birthYear + rand(16, 19);

    for (let j = 0; j < historyCount; j++) {
      const isLast = j === historyCount - 1;
      const yearsAtClub = rand(1, 4);
      const endYear = yearCursor + yearsAtClub;

      const entry: ClubHistory = {
        club: pick(CLUBS),
        startYear: yearCursor,
        position,
      };
      if (!isLast) {
        entry.endYear = endYear;
      }

      clubHistory.push(entry);
      yearCursor = endYear;
    }

    // Títulos (0-3)
    const titlesCount = rand(0, 3);
    const titles: Title[] = [];
    for (let t = 0; t < titlesCount; t++) {
      titles.push({
        title: pick(TITLE_NAMES),
        year: rand(2010, 2024),
        club: pick(CLUBS),
        category: pick(TITLE_CATEGORIES),
      });
    }

    players.push({
      firstName: pick(FIRST_NAMES_M),
      lastName: pick(LAST_NAMES),
      dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
      nationality: pick(NATIONALITIES),
      position,
      secondaryPosition: Math.random() > 0.6
        ? pick(POSITIONS.filter((p) => p !== position))
        : null,
      preferredFoot: pick(["Derecho", "Derecho", "Izquierdo"]) as "Derecho" | "Izquierdo" | "Ambos",
      height: isGK ? rand(185, 200) : rand(165, 195),
      weight: rand(63, 90),
      currentClub: pick(CLUBS),
      contractEnd: `${contractYear}-06-30`,
      contactEmail: null,
      contactPhone: null,
      clubHistory,
      titles,
    });
  }

  return players;
}

// ─── Construcción del documento Firestore ────────────────────────────────────

function buildAthleteDoc(seed: PlayerSeed): AthleteDoc {
  return {
    // M1
    firstName: seed.firstName,
    lastName: seed.lastName,
    dateOfBirth: toTimestamp(seed.dateOfBirth),
    nationality: seed.nationality,
    contactEmail: seed.contactEmail,
    contactPhone: seed.contactPhone,
    photoURL: null,
    // M2
    position: seed.position,
    secondaryPosition: seed.secondaryPosition,
    preferredFoot: seed.preferredFoot,
    height: seed.height,
    weight: seed.weight,
    currentClub: seed.currentClub,
    contractEnd: seed.contractEnd ? toTimestamp(seed.contractEnd) : null,
    // M3 — sin campos undefined para Firestore
    clubHistory: seed.clubHistory,
    // M4
    titles: seed.titles,
    // Metadatos
    createdBy: SEED_UID,
    organizationId: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const syntheticCount = TARGET_COUNT - REFERENCE_PLAYERS.length;
  const syntheticPlayers = generateSyntheticPlayers(syntheticCount);
  const allPlayers = [...REFERENCE_PLAYERS, ...syntheticPlayers];

  console.log(`Insertando ${allPlayers.length} deportistas en Firestore...`);
  console.log(`  Referencia: ${REFERENCE_PLAYERS.length}`);
  console.log(`  Sintéticos: ${syntheticPlayers.length}`);

  let batch = db.batch();
  let batchCount = 0;
  let total = 0;

  for (const seed of allPlayers) {
    const ref = db.collection(COLLECTION).doc();
    batch.set(ref, buildAthleteDoc(seed));
    batchCount++;
    total++;

    if (batchCount === BATCH_SIZE) {
      await batch.commit();
      console.log(`  Batch committed: ${total} documentos`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\nSeed completado: ${total} deportistas insertados.`);
}

main().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});