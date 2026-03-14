/**
 * seed-athletes.ts
 *
 * Inserta 1 000 jugadores de prueba en Firestore.
 * Incluye ~89 jugadores reales conocidos + 911 generados sintéticamente.
 *
 * Uso:
 *   npx tsx src/scripts/seed-athletes.ts
 *
 * Variables de entorno requeridas (mismas que el servidor):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import "dotenv/config";
import "../config/firebase"; // inicializa Firebase Admin
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();
const COLLECTION = "athletes";
const SEED_UID = "seed-script";
const BATCH_SIZE = 499;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClubHistory {
  club: string;
  startYear: number;
  endYear?: number;
  position?: string;
}

interface Title {
  title: string;
  year: number;
  club?: string;
  category?: string;
}

interface PlayerSeed {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  preferredFoot: "left" | "right" | "both";
  height: number;
  weight: number;
  currentClub: string;
  contractEnd: string;
  contactEmail?: string;
  contactPhone?: string;
  clubHistory: ClubHistory[];
  titles: Title[];
}

// ─── 89 Jugadores reales ──────────────────────────────────────────────────────

const REAL_PLAYERS: PlayerSeed[] = [
  // ── Porteros ──
  {
    firstName: "Alisson", lastName: "Becker", dateOfBirth: "1992-10-02",
    nationality: "Brasil", position: "Portero", preferredFoot: "right",
    height: 191, weight: 91, currentClub: "Liverpool", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Internacional", startYear: 2013, endYear: 2016, position: "Portero" },
      { club: "Roma", startYear: 2016, endYear: 2018, position: "Portero" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2019, club: "Liverpool" },
      { title: "Premier League", year: 2020, club: "Liverpool" },
      { title: "Copa América", year: 2019, category: "Brasil" },
    ],
  },
  {
    firstName: "Ederson", lastName: "Moraes", dateOfBirth: "1993-08-17",
    nationality: "Brasil", position: "Portero", preferredFoot: "right",
    height: 188, weight: 88, currentClub: "Manchester City", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Benfica", startYear: 2015, endYear: 2017, position: "Portero" },
    ],
    titles: [
      { title: "Premier League", year: 2019, club: "Manchester City" },
      { title: "Premier League", year: 2022, club: "Manchester City" },
      { title: "UEFA Champions League", year: 2023, club: "Manchester City" },
    ],
  },
  {
    firstName: "Emiliano", lastName: "Martínez", dateOfBirth: "1992-09-02",
    nationality: "Argentina", position: "Portero", preferredFoot: "right",
    height: 195, weight: 88, currentClub: "Aston Villa", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Arsenal", startYear: 2010, endYear: 2020, position: "Portero" },
    ],
    titles: [
      { title: "Copa América", year: 2021, category: "Argentina" },
      { title: "FIFA World Cup", year: 2022, category: "Argentina" },
    ],
  },
  {
    firstName: "Jan", lastName: "Oblak", dateOfBirth: "1993-01-07",
    nationality: "Eslovenia", position: "Portero", preferredFoot: "right",
    height: 188, weight: 87, currentClub: "Atlético de Madrid", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Benfica", startYear: 2010, endYear: 2014, position: "Portero" },
    ],
    titles: [
      { title: "La Liga", year: 2021, club: "Atlético de Madrid" },
    ],
  },
  {
    firstName: "Gianluigi", lastName: "Donnarumma", dateOfBirth: "1999-02-25",
    nationality: "Italia", position: "Portero", preferredFoot: "right",
    height: 196, weight: 90, currentClub: "PSG", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "AC Milan", startYear: 2015, endYear: 2021, position: "Portero" },
    ],
    titles: [
      { title: "UEFA Euro", year: 2021, category: "Italia" },
    ],
  },
  {
    firstName: "David", lastName: "Raya", dateOfBirth: "1995-09-15",
    nationality: "España", position: "Portero", preferredFoot: "right",
    height: 183, weight: 83, currentClub: "Arsenal", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Brentford", startYear: 2019, endYear: 2023, position: "Portero" },
    ],
    titles: [],
  },
  {
    firstName: "Mike", lastName: "Maignan", dateOfBirth: "1995-07-03",
    nationality: "Francia", position: "Portero", preferredFoot: "right",
    height: 191, weight: 82, currentClub: "AC Milan", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Lille", startYear: 2015, endYear: 2021, position: "Portero" },
    ],
    titles: [
      { title: "Serie A", year: 2022, club: "AC Milan" },
    ],
  },
  {
    firstName: "André", lastName: "Onana", dateOfBirth: "1996-04-02",
    nationality: "Camerún", position: "Portero", preferredFoot: "right",
    height: 190, weight: 89, currentClub: "Manchester United", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Ajax", startYear: 2016, endYear: 2022, position: "Portero" },
      { club: "Inter Milan", startYear: 2022, endYear: 2023, position: "Portero" },
    ],
    titles: [
      { title: "Eredivisie", year: 2021, club: "Ajax" },
    ],
  },
  {
    firstName: "Marc-André", lastName: "ter Stegen", dateOfBirth: "1992-04-30",
    nationality: "Alemania", position: "Portero", preferredFoot: "right",
    height: 187, weight: 85, currentClub: "Barcelona", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Borussia Mönchengladbach", startYear: 2011, endYear: 2014, position: "Portero" },
    ],
    titles: [
      { title: "La Liga", year: 2019, club: "Barcelona" },
      { title: "UEFA Champions League", year: 2015, club: "Barcelona" },
    ],
  },
  {
    firstName: "Yann", lastName: "Sommer", dateOfBirth: "1988-12-17",
    nationality: "Suiza", position: "Portero", preferredFoot: "right",
    height: 183, weight: 82, currentClub: "Inter Milan", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Borussia Mönchengladbach", startYear: 2014, endYear: 2023, position: "Portero" },
      { club: "Bayern Munich", startYear: 2023, endYear: 2023, position: "Portero" },
    ],
    titles: [],
  },

  // ── Defensas Centrales ──
  {
    firstName: "Virgil", lastName: "van Dijk", dateOfBirth: "1991-07-08",
    nationality: "Países Bajos", position: "Defensa Central", preferredFoot: "right",
    height: 193, weight: 92, currentClub: "Liverpool", contractEnd: "2025-06-30",
    clubHistory: [
      { club: "Celtic", startYear: 2013, endYear: 2015, position: "Defensa Central" },
      { club: "Southampton", startYear: 2015, endYear: 2018, position: "Defensa Central" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2019, club: "Liverpool" },
      { title: "Premier League", year: 2020, club: "Liverpool" },
    ],
  },
  {
    firstName: "William", lastName: "Saliba", dateOfBirth: "2001-03-24",
    nationality: "Francia", position: "Defensa Central", preferredFoot: "right",
    height: 192, weight: 86, currentClub: "Arsenal", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Saint-Étienne", startYear: 2018, endYear: 2021, position: "Defensa Central" },
      { club: "Marseille", startYear: 2021, endYear: 2022, position: "Defensa Central" },
    ],
    titles: [],
  },
  {
    firstName: "Antonio", lastName: "Rüdiger", dateOfBirth: "1993-03-03",
    nationality: "Alemania", position: "Defensa Central", preferredFoot: "right",
    height: 190, weight: 85, currentClub: "Real Madrid", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Stuttgart", startYear: 2012, endYear: 2015, position: "Defensa Central" },
      { club: "Roma", startYear: 2015, endYear: 2017, position: "Defensa Central" },
      { club: "Chelsea", startYear: 2017, endYear: 2022, position: "Defensa Central" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2021, club: "Chelsea" },
      { title: "La Liga", year: 2024, club: "Real Madrid" },
    ],
  },
  {
    firstName: "Marquinhos", lastName: "Ferreira", dateOfBirth: "1994-05-14",
    nationality: "Brasil", position: "Defensa Central", preferredFoot: "right",
    height: 183, weight: 75, currentClub: "PSG", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Corinthians", startYear: 2012, endYear: 2013, position: "Defensa Central" },
      { club: "Roma", startYear: 2013, endYear: 2013, position: "Defensa Central" },
    ],
    titles: [
      { title: "Ligue 1", year: 2022, club: "PSG" },
    ],
  },
  {
    firstName: "Alessandro", lastName: "Bastoni", dateOfBirth: "1999-04-13",
    nationality: "Italia", position: "Defensa Central", preferredFoot: "left",
    height: 191, weight: 87, currentClub: "Inter Milan", contractEnd: "2028-06-30",
    clubHistory: [],
    titles: [
      { title: "Serie A", year: 2021, club: "Inter Milan" },
    ],
  },
  {
    firstName: "Ronald", lastName: "Araújo", dateOfBirth: "1999-03-07",
    nationality: "Uruguay", position: "Defensa Central", preferredFoot: "right",
    height: 190, weight: 85, currentClub: "Barcelona", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Boston River", startYear: 2017, endYear: 2018, position: "Defensa Central" },
    ],
    titles: [],
  },
  {
    firstName: "Éder", lastName: "Militão", dateOfBirth: "1998-01-18",
    nationality: "Brasil", position: "Defensa Central", preferredFoot: "right",
    height: 186, weight: 77, currentClub: "Real Madrid", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Internacional", startYear: 2016, endYear: 2018, position: "Defensa Central" },
      { club: "Porto", startYear: 2018, endYear: 2019, position: "Defensa Central" },
    ],
    titles: [
      { title: "La Liga", year: 2022, club: "Real Madrid" },
      { title: "UEFA Champions League", year: 2022, club: "Real Madrid" },
    ],
  },
  {
    firstName: "Dayot", lastName: "Upamecano", dateOfBirth: "1998-10-27",
    nationality: "Francia", position: "Defensa Central", preferredFoot: "right",
    height: 185, weight: 82, currentClub: "Bayern Munich", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Salzburgo", startYear: 2017, endYear: 2017, position: "Defensa Central" },
      { club: "RB Leipzig", startYear: 2017, endYear: 2021, position: "Defensa Central" },
    ],
    titles: [],
  },
  {
    firstName: "Lisandro", lastName: "Martínez", dateOfBirth: "1998-01-18",
    nationality: "Argentina", position: "Defensa Central", preferredFoot: "left",
    height: 175, weight: 76, currentClub: "Manchester United", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Defensa y Justicia", startYear: 2016, endYear: 2019, position: "Defensa Central" },
      { club: "Ajax", startYear: 2019, endYear: 2022, position: "Defensa Central" },
    ],
    titles: [
      { title: "FIFA World Cup", year: 2022, category: "Argentina" },
    ],
  },
  {
    firstName: "Gabriel", lastName: "Magalhães", dateOfBirth: "1997-12-19",
    nationality: "Brasil", position: "Defensa Central", preferredFoot: "left",
    height: 191, weight: 84, currentClub: "Arsenal", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Avai", startYear: 2016, endYear: 2017, position: "Defensa Central" },
      { club: "Lille", startYear: 2017, endYear: 2020, position: "Defensa Central" },
    ],
    titles: [],
  },

  // ── Laterales Derechos ──
  {
    firstName: "Achraf", lastName: "Hakimi", dateOfBirth: "1998-11-04",
    nationality: "Marruecos", position: "Lateral Derecho", preferredFoot: "right",
    height: 181, weight: 73, currentClub: "PSG", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Real Madrid", startYear: 2016, endYear: 2020, position: "Lateral Derecho" },
      { club: "Borussia Dortmund", startYear: 2018, endYear: 2020, position: "Lateral Derecho" },
      { club: "Inter Milan", startYear: 2020, endYear: 2021, position: "Lateral Derecho" },
    ],
    titles: [
      { title: "Ligue 1", year: 2022, club: "PSG" },
    ],
  },
  {
    firstName: "Trent", lastName: "Alexander-Arnold", dateOfBirth: "1998-10-07",
    nationality: "Inglaterra", position: "Lateral Derecho", preferredFoot: "right",
    height: 180, weight: 69, currentClub: "Real Madrid", contractEnd: "2029-06-30",
    clubHistory: [
      { club: "Liverpool", startYear: 2016, endYear: 2025, position: "Lateral Derecho" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2019, club: "Liverpool" },
      { title: "Premier League", year: 2020, club: "Liverpool" },
    ],
  },
  {
    firstName: "Dani", lastName: "Carvajal", dateOfBirth: "1992-01-11",
    nationality: "España", position: "Lateral Derecho", preferredFoot: "right",
    height: 173, weight: 73, currentClub: "Real Madrid", contractEnd: "2025-06-30",
    clubHistory: [
      { club: "Bayer Leverkusen", startYear: 2012, endYear: 2013, position: "Lateral Derecho" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2014, club: "Real Madrid" },
      { title: "UEFA Champions League", year: 2016, club: "Real Madrid" },
      { title: "UEFA Champions League", year: 2018, club: "Real Madrid" },
      { title: "UEFA Champions League", year: 2022, club: "Real Madrid" },
      { title: "UEFA Champions League", year: 2024, club: "Real Madrid" },
    ],
  },
  {
    firstName: "Reece", lastName: "James", dateOfBirth: "2000-01-08",
    nationality: "Inglaterra", position: "Lateral Derecho", preferredFoot: "right",
    height: 180, weight: 79, currentClub: "Chelsea", contractEnd: "2028-06-30",
    clubHistory: [],
    titles: [],
  },
  {
    firstName: "Denzel", lastName: "Dumfries", dateOfBirth: "1996-04-18",
    nationality: "Países Bajos", position: "Lateral Derecho", preferredFoot: "right",
    height: 187, weight: 83, currentClub: "Inter Milan", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "PSV Eindhoven", startYear: 2018, endYear: 2021, position: "Lateral Derecho" },
    ],
    titles: [
      { title: "Serie A", year: 2024, club: "Inter Milan" },
    ],
  },

  // ── Laterales Izquierdos ──
  {
    firstName: "Theo", lastName: "Hernández", dateOfBirth: "1997-10-06",
    nationality: "Francia", position: "Lateral Izquierdo", preferredFoot: "left",
    height: 184, weight: 84, currentClub: "AC Milan", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Real Madrid", startYear: 2016, endYear: 2019, position: "Lateral Izquierdo" },
      { club: "Real Sociedad", startYear: 2017, endYear: 2018, position: "Lateral Izquierdo" },
    ],
    titles: [
      { title: "Serie A", year: 2022, club: "AC Milan" },
    ],
  },
  {
    firstName: "Andrew", lastName: "Robertson", dateOfBirth: "1994-03-11",
    nationality: "Escocia", position: "Lateral Izquierdo", preferredFoot: "left",
    height: 178, weight: 64, currentClub: "Liverpool", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Dundee United", startYear: 2012, endYear: 2014, position: "Lateral Izquierdo" },
      { club: "Hull City", startYear: 2014, endYear: 2017, position: "Lateral Izquierdo" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2019, club: "Liverpool" },
      { title: "Premier League", year: 2020, club: "Liverpool" },
    ],
  },
  {
    firstName: "Alejandro", lastName: "Grimaldo", dateOfBirth: "1995-09-20",
    nationality: "España", position: "Lateral Izquierdo", preferredFoot: "left",
    height: 168, weight: 63, currentClub: "Bayer Leverkusen", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Barcelona B", startYear: 2013, endYear: 2016, position: "Lateral Izquierdo" },
      { club: "Benfica", startYear: 2016, endYear: 2023, position: "Lateral Izquierdo" },
    ],
    titles: [
      { title: "Bundesliga", year: 2024, club: "Bayer Leverkusen" },
    ],
  },
  {
    firstName: "Nuno", lastName: "Mendes", dateOfBirth: "2002-06-19",
    nationality: "Portugal", position: "Lateral Izquierdo", preferredFoot: "left",
    height: 180, weight: 71, currentClub: "PSG", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Sporting CP", startYear: 2020, endYear: 2021, position: "Lateral Izquierdo" },
    ],
    titles: [],
  },

  // ── Mediocentros Defensivos ──
  {
    firstName: "Rodrigo", lastName: "Hernández", dateOfBirth: "1996-06-22",
    nationality: "España", position: "Mediocentro Defensivo", preferredFoot: "right",
    height: 191, weight: 82, currentClub: "Manchester City", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Atlético de Madrid", startYear: 2016, endYear: 2022, position: "Mediocentro Defensivo" },
    ],
    titles: [
      { title: "UEFA Euro", year: 2024, category: "España" },
      { title: "Premier League", year: 2023, club: "Manchester City" },
      { title: "UEFA Champions League", year: 2023, club: "Manchester City" },
      { title: "Balón de Oro", year: 2024, category: "Premio Individual" },
    ],
  },
  {
    firstName: "Carlos", lastName: "Henrique Casemiro", dateOfBirth: "1992-02-23",
    nationality: "Brasil", position: "Mediocentro Defensivo", preferredFoot: "right",
    height: 185, weight: 84, currentClub: "Manchester United", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "São Paulo", startYear: 2011, endYear: 2013, position: "Mediocentro Defensivo" },
      { club: "Real Madrid", startYear: 2013, endYear: 2022, position: "Mediocentro Defensivo" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2016, club: "Real Madrid" },
      { title: "UEFA Champions League", year: 2018, club: "Real Madrid" },
      { title: "Copa América", year: 2019, category: "Brasil" },
    ],
  },
  {
    firstName: "Thomas", lastName: "Partey", dateOfBirth: "1993-06-13",
    nationality: "Ghana", position: "Mediocentro Defensivo", preferredFoot: "right",
    height: 185, weight: 77, currentClub: "Arsenal", contractEnd: "2025-06-30",
    clubHistory: [
      { club: "Atlético de Madrid", startYear: 2012, endYear: 2020, position: "Mediocentro Defensivo" },
    ],
    titles: [],
  },
  {
    firstName: "Declan", lastName: "Rice", dateOfBirth: "1999-01-14",
    nationality: "Inglaterra", position: "Mediocentro Defensivo", preferredFoot: "right",
    height: 185, weight: 79, currentClub: "Arsenal", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "West Ham United", startYear: 2017, endYear: 2023, position: "Mediocentro Defensivo" },
    ],
    titles: [],
  },

  // ── Mediocentros ──
  {
    firstName: "Pedro", lastName: "González López", dateOfBirth: "2002-11-25",
    nationality: "España", position: "Mediocentro", preferredFoot: "right",
    height: 174, weight: 60, currentClub: "Barcelona", contractEnd: "2026-06-30",
    clubHistory: [],
    titles: [
      { title: "UEFA Euro", year: 2024, category: "España" },
    ],
  },
  {
    firstName: "Vitinha", lastName: "Ferreira", dateOfBirth: "2000-02-13",
    nationality: "Portugal", position: "Mediocentro", preferredFoot: "right",
    height: 171, weight: 59, currentClub: "PSG", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Porto", startYear: 2020, endYear: 2022, position: "Mediocentro" },
    ],
    titles: [
      { title: "Ligue 1", year: 2024, club: "PSG" },
    ],
  },
  {
    firstName: "Jude", lastName: "Bellingham", dateOfBirth: "2003-06-29",
    nationality: "Inglaterra", position: "Mediocentro", preferredFoot: "right",
    height: 186, weight: 75, currentClub: "Real Madrid", contractEnd: "2029-06-30",
    clubHistory: [
      { club: "Birmingham City", startYear: 2019, endYear: 2020, position: "Mediocentro" },
      { club: "Borussia Dortmund", startYear: 2020, endYear: 2023, position: "Mediocentro" },
    ],
    titles: [
      { title: "La Liga", year: 2024, club: "Real Madrid" },
      { title: "UEFA Champions League", year: 2024, club: "Real Madrid" },
    ],
  },
  {
    firstName: "Enzo", lastName: "Fernández", dateOfBirth: "2001-01-17",
    nationality: "Argentina", position: "Mediocentro", preferredFoot: "right",
    height: 178, weight: 73, currentClub: "Chelsea", contractEnd: "2031-06-30",
    clubHistory: [
      { club: "River Plate", startYear: 2020, endYear: 2022, position: "Mediocentro" },
      { club: "Benfica", startYear: 2022, endYear: 2023, position: "Mediocentro" },
    ],
    titles: [
      { title: "FIFA World Cup", year: 2022, category: "Argentina" },
    ],
  },
  {
    firstName: "Alexis", lastName: "Mac Allister", dateOfBirth: "1998-12-24",
    nationality: "Argentina", position: "Mediocentro", preferredFoot: "right",
    height: 174, weight: 74, currentClub: "Liverpool", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Boca Juniors", startYear: 2016, endYear: 2019, position: "Mediocentro" },
      { club: "Brighton", startYear: 2019, endYear: 2023, position: "Mediocentro" },
    ],
    titles: [
      { title: "FIFA World Cup", year: 2022, category: "Argentina" },
    ],
  },
  {
    firstName: "Florian", lastName: "Wirtz", dateOfBirth: "2003-05-03",
    nationality: "Alemania", position: "Mediocentro Ofensivo", preferredFoot: "right",
    height: 180, weight: 70, currentClub: "Bayer Leverkusen", contractEnd: "2027-06-30",
    clubHistory: [],
    titles: [
      { title: "Bundesliga", year: 2024, club: "Bayer Leverkusen" },
    ],
  },
  {
    firstName: "Granit", lastName: "Xhaka", dateOfBirth: "1992-09-27",
    nationality: "Suiza", position: "Mediocentro", preferredFoot: "right",
    height: 183, weight: 80, currentClub: "Bayer Leverkusen", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "FC Basel", startYear: 2010, endYear: 2012, position: "Mediocentro" },
      { club: "Borussia Mönchengladbach", startYear: 2012, endYear: 2016, position: "Mediocentro" },
      { club: "Arsenal", startYear: 2016, endYear: 2023, position: "Mediocentro" },
    ],
    titles: [],
  },
  {
    firstName: "Frenkie", lastName: "de Jong", dateOfBirth: "1997-05-12",
    nationality: "Países Bajos", position: "Mediocentro", preferredFoot: "right",
    height: 180, weight: 74, currentClub: "Barcelona", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Ajax", startYear: 2015, endYear: 2019, position: "Mediocentro" },
    ],
    titles: [],
  },
  {
    firstName: "Luka", lastName: "Modrić", dateOfBirth: "1985-09-09",
    nationality: "Croacia", position: "Mediocentro", preferredFoot: "right",
    height: 172, weight: 66, currentClub: "Real Madrid", contractEnd: "2025-06-30",
    clubHistory: [
      { club: "Dinamo Zagreb", startYear: 2003, endYear: 2008, position: "Mediocentro" },
      { club: "Tottenham", startYear: 2008, endYear: 2012, position: "Mediocentro" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2014, club: "Real Madrid" },
      { title: "UEFA Champions League", year: 2016, club: "Real Madrid" },
      { title: "UEFA Champions League", year: 2018, club: "Real Madrid" },
      { title: "Balón de Oro", year: 2018, category: "Premio Individual" },
    ],
  },
  {
    firstName: "Martín", lastName: "Ødegaard", dateOfBirth: "1998-12-17",
    nationality: "Noruega", position: "Mediocentro Ofensivo", preferredFoot: "right",
    height: 178, weight: 68, currentClub: "Arsenal", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Real Madrid", startYear: 2015, endYear: 2021, position: "Mediocentro Ofensivo" },
      { club: "Real Sociedad", startYear: 2019, endYear: 2021, position: "Mediocentro Ofensivo" },
    ],
    titles: [],
  },

  // ── Mediocentros Ofensivos ──
  {
    firstName: "Kevin", lastName: "De Bruyne", dateOfBirth: "1991-06-28",
    nationality: "Bélgica", position: "Mediocentro Ofensivo", preferredFoot: "right",
    height: 181, weight: 68, currentClub: "Manchester City", contractEnd: "2025-06-30",
    clubHistory: [
      { club: "Genk", startYear: 2010, endYear: 2012, position: "Mediocentro Ofensivo" },
      { club: "Chelsea", startYear: 2012, endYear: 2014, position: "Mediocentro Ofensivo" },
      { club: "Wolfsburgo", startYear: 2014, endYear: 2015, position: "Mediocentro Ofensivo" },
    ],
    titles: [
      { title: "Premier League", year: 2019, club: "Manchester City" },
      { title: "UEFA Champions League", year: 2023, club: "Manchester City" },
    ],
  },
  {
    firstName: "Bruno", lastName: "Fernandes", dateOfBirth: "1994-09-08",
    nationality: "Portugal", position: "Mediocentro Ofensivo", preferredFoot: "right",
    height: 179, weight: 69, currentClub: "Manchester United", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Novara", startYear: 2012, endYear: 2013, position: "Mediocentro Ofensivo" },
      { club: "Sporting CP", startYear: 2017, endYear: 2020, position: "Mediocentro Ofensivo" },
    ],
    titles: [],
  },
  {
    firstName: "Antoine", lastName: "Griezmann", dateOfBirth: "1991-03-21",
    nationality: "Francia", position: "Mediocentro Ofensivo", preferredFoot: "right",
    height: 176, weight: 73, currentClub: "Atlético de Madrid", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Real Sociedad", startYear: 2009, endYear: 2014, position: "Extremo Izquierdo" },
      { club: "Barcelona", startYear: 2019, endYear: 2021, position: "Delantero Centro" },
    ],
    titles: [
      { title: "UEFA Euro", year: 2016, category: "Francia" },
      { title: "FIFA World Cup", year: 2018, category: "Francia" },
    ],
  },
  {
    firstName: "Jamal", lastName: "Musiala", dateOfBirth: "2003-02-26",
    nationality: "Alemania", position: "Mediocentro Ofensivo", preferredFoot: "right",
    height: 183, weight: 75, currentClub: "Bayern Munich", contractEnd: "2026-06-30",
    clubHistory: [],
    titles: [
      { title: "Bundesliga", year: 2023, club: "Bayern Munich" },
    ],
  },

  // ── Extremos Derechos ──
  {
    firstName: "Lamine", lastName: "Yamal", dateOfBirth: "2007-07-13",
    nationality: "España", position: "Extremo Derecho", preferredFoot: "right",
    height: 181, weight: 65, currentClub: "Barcelona", contractEnd: "2026-06-30",
    clubHistory: [],
    titles: [
      { title: "UEFA Euro", year: 2024, category: "España" },
    ],
  },
  {
    firstName: "Kylian", lastName: "Mbappé", dateOfBirth: "1998-12-20",
    nationality: "Francia", position: "Delantero Centro", preferredFoot: "right",
    height: 178, weight: 73, currentClub: "Real Madrid", contractEnd: "2029-06-30",
    clubHistory: [
      { club: "Monaco", startYear: 2016, endYear: 2018, position: "Extremo Derecho" },
      { club: "PSG", startYear: 2018, endYear: 2024, position: "Delantero Centro" },
    ],
    titles: [
      { title: "FIFA World Cup", year: 2018, category: "Francia" },
      { title: "Ligue 1", year: 2022, club: "PSG" },
      { title: "La Liga", year: 2025, club: "Real Madrid" },
    ],
  },
  {
    firstName: "Bukayo", lastName: "Saka", dateOfBirth: "2001-09-05",
    nationality: "Inglaterra", position: "Extremo Derecho", preferredFoot: "left",
    height: 178, weight: 71, currentClub: "Arsenal", contractEnd: "2027-06-30",
    clubHistory: [],
    titles: [],
  },
  {
    firstName: "Rodrygo", lastName: "Goes", dateOfBirth: "2001-01-09",
    nationality: "Brasil", position: "Extremo Derecho", preferredFoot: "right",
    height: 174, weight: 64, currentClub: "Real Madrid", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Santos", startYear: 2018, endYear: 2019, position: "Extremo Derecho" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2022, club: "Real Madrid" },
    ],
  },
  {
    firstName: "Leroy", lastName: "Sané", dateOfBirth: "1996-01-11",
    nationality: "Alemania", position: "Extremo Derecho", preferredFoot: "right",
    height: 183, weight: 75, currentClub: "Bayern Munich", contractEnd: "2025-06-30",
    clubHistory: [
      { club: "Schalke 04", startYear: 2013, endYear: 2016, position: "Extremo Izquierdo" },
      { club: "Manchester City", startYear: 2016, endYear: 2020, position: "Extremo Izquierdo" },
    ],
    titles: [],
  },
  {
    firstName: "Ousmane", lastName: "Dembélé", dateOfBirth: "1997-05-15",
    nationality: "Francia", position: "Extremo Derecho", preferredFoot: "right",
    height: 178, weight: 67, currentClub: "PSG", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Rennes", startYear: 2015, endYear: 2016, position: "Extremo Derecho" },
      { club: "Borussia Dortmund", startYear: 2016, endYear: 2017, position: "Extremo Derecho" },
      { club: "Barcelona", startYear: 2017, endYear: 2023, position: "Extremo Derecho" },
    ],
    titles: [
      { title: "FIFA World Cup", year: 2018, category: "Francia" },
    ],
  },
  {
    firstName: "Raphinha", lastName: "Belloli", dateOfBirth: "1996-12-14",
    nationality: "Brasil", position: "Extremo Derecho", preferredFoot: "right",
    height: 176, weight: 69, currentClub: "Barcelona", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Vitória Guimarães", startYear: 2016, endYear: 2019, position: "Extremo Derecho" },
      { club: "Rennes", startYear: 2019, endYear: 2020, position: "Extremo Derecho" },
      { club: "Leeds United", startYear: 2020, endYear: 2022, position: "Extremo Derecho" },
    ],
    titles: [],
  },

  // ── Extremos Izquierdos ──
  {
    firstName: "Vinícius", lastName: "Júnior", dateOfBirth: "2000-07-12",
    nationality: "Brasil", position: "Extremo Izquierdo", preferredFoot: "left",
    height: 176, weight: 73, currentClub: "Real Madrid", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Flamengo", startYear: 2017, endYear: 2018, position: "Extremo Izquierdo" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2022, club: "Real Madrid" },
      { title: "La Liga", year: 2022, club: "Real Madrid" },
    ],
  },
  {
    firstName: "Nico", lastName: "Williams", dateOfBirth: "2002-07-12",
    nationality: "España", position: "Extremo Izquierdo", preferredFoot: "right",
    height: 175, weight: 65, currentClub: "Athletic Club", contractEnd: "2027-06-30",
    clubHistory: [],
    titles: [
      { title: "UEFA Euro", year: 2024, category: "España" },
    ],
  },
  {
    firstName: "Rafael", lastName: "Leão", dateOfBirth: "2000-06-10",
    nationality: "Portugal", position: "Extremo Izquierdo", preferredFoot: "left",
    height: 188, weight: 79, currentClub: "AC Milan", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Sporting CP", startYear: 2018, endYear: 2018, position: "Extremo Izquierdo" },
      { club: "Lille", startYear: 2018, endYear: 2019, position: "Extremo Izquierdo" },
    ],
    titles: [
      { title: "Serie A", year: 2022, club: "AC Milan" },
    ],
  },
  {
    firstName: "Gabriel", lastName: "Martinelli", dateOfBirth: "2001-06-18",
    nationality: "Brasil", position: "Extremo Izquierdo", preferredFoot: "left",
    height: 181, weight: 75, currentClub: "Arsenal", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Ituano", startYear: 2019, endYear: 2019, position: "Extremo Izquierdo" },
    ],
    titles: [],
  },
  {
    firstName: "Luis", lastName: "Díaz", dateOfBirth: "1997-01-13",
    nationality: "Colombia", position: "Extremo Izquierdo", preferredFoot: "right",
    height: 178, weight: 70, currentClub: "Liverpool", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Junior Barranquilla", startYear: 2017, endYear: 2019, position: "Extremo Izquierdo" },
      { club: "Porto", startYear: 2019, endYear: 2022, position: "Extremo Izquierdo" },
    ],
    titles: [],
  },
  {
    firstName: "Khvicha", lastName: "Kvaratskhelia", dateOfBirth: "2001-02-12",
    nationality: "Georgia", position: "Extremo Izquierdo", preferredFoot: "left",
    height: 183, weight: 72, currentClub: "PSG", contractEnd: "2029-06-30",
    clubHistory: [
      { club: "Napoli", startYear: 2022, endYear: 2025, position: "Extremo Izquierdo" },
    ],
    titles: [
      { title: "Serie A", year: 2023, club: "Napoli" },
    ],
  },
  {
    firstName: "Michael", lastName: "Olise", dateOfBirth: "2001-12-01",
    nationality: "Francia", position: "Extremo Derecho", preferredFoot: "right",
    height: 182, weight: 70, currentClub: "Bayern Munich", contractEnd: "2029-06-30",
    clubHistory: [
      { club: "Reading", startYear: 2019, endYear: 2021, position: "Extremo Derecho" },
      { club: "Crystal Palace", startYear: 2021, endYear: 2024, position: "Extremo Derecho" },
    ],
    titles: [],
  },

  // ── Delanteros Centros ──
  {
    firstName: "Erling", lastName: "Haaland", dateOfBirth: "2000-07-21",
    nationality: "Noruega", position: "Delantero Centro", preferredFoot: "right",
    height: 194, weight: 88, currentClub: "Manchester City", contractEnd: "2034-06-30",
    clubHistory: [
      { club: "Brann", startYear: 2017, endYear: 2017, position: "Delantero Centro" },
      { club: "Molde", startYear: 2017, endYear: 2019, position: "Delantero Centro" },
      { club: "Salzburgo", startYear: 2019, endYear: 2020, position: "Delantero Centro" },
      { club: "Borussia Dortmund", startYear: 2020, endYear: 2022, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Premier League", year: 2023, club: "Manchester City" },
      { title: "UEFA Champions League", year: 2023, club: "Manchester City" },
    ],
  },
  {
    firstName: "Harry", lastName: "Kane", dateOfBirth: "1993-07-28",
    nationality: "Inglaterra", position: "Delantero Centro", preferredFoot: "right",
    height: 188, weight: 86, currentClub: "Bayern Munich", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Tottenham", startYear: 2011, endYear: 2023, position: "Delantero Centro" },
      { club: "Leyton Orient", startYear: 2011, endYear: 2011, position: "Delantero Centro" },
      { club: "Millwall", startYear: 2012, endYear: 2012, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Bundesliga", year: 2025, club: "Bayern Munich" },
    ],
  },
  {
    firstName: "Lionel", lastName: "Messi", dateOfBirth: "1987-06-24",
    nationality: "Argentina", position: "Extremo Derecho", preferredFoot: "left",
    height: 170, weight: 72, currentClub: "Inter Miami", contractEnd: "2025-12-31",
    clubHistory: [
      { club: "Barcelona", startYear: 2004, endYear: 2021, position: "Extremo Derecho" },
      { club: "PSG", startYear: 2021, endYear: 2023, position: "Extremo Derecho" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2006, club: "Barcelona" },
      { title: "UEFA Champions League", year: 2009, club: "Barcelona" },
      { title: "UEFA Champions League", year: 2011, club: "Barcelona" },
      { title: "UEFA Champions League", year: 2015, club: "Barcelona" },
      { title: "FIFA World Cup", year: 2022, category: "Argentina" },
      { title: "Balón de Oro", year: 2019, category: "Premio Individual" },
      { title: "Balón de Oro", year: 2021, category: "Premio Individual" },
      { title: "Balón de Oro", year: 2023, category: "Premio Individual" },
    ],
  },
  {
    firstName: "Mohamed", lastName: "Salah", dateOfBirth: "1992-06-15",
    nationality: "Egipto", position: "Extremo Derecho", preferredFoot: "right",
    height: 175, weight: 71, currentClub: "Liverpool", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Al Mokawloon", startYear: 2010, endYear: 2012, position: "Extremo Izquierdo" },
      { club: "Basel", startYear: 2012, endYear: 2014, position: "Extremo Derecho" },
      { club: "Chelsea", startYear: 2014, endYear: 2016, position: "Extremo Derecho" },
      { club: "Roma", startYear: 2015, endYear: 2017, position: "Extremo Derecho" },
    ],
    titles: [
      { title: "UEFA Champions League", year: 2019, club: "Liverpool" },
      { title: "Premier League", year: 2020, club: "Liverpool" },
    ],
  },
  {
    firstName: "Robert", lastName: "Lewandowski", dateOfBirth: "1988-08-21",
    nationality: "Polonia", position: "Delantero Centro", preferredFoot: "right",
    height: 185, weight: 80, currentClub: "Barcelona", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Znicz Pruszków", startYear: 2006, endYear: 2008, position: "Delantero Centro" },
      { club: "Lech Poznań", startYear: 2008, endYear: 2010, position: "Delantero Centro" },
      { club: "Borussia Dortmund", startYear: 2010, endYear: 2014, position: "Delantero Centro" },
      { club: "Bayern Munich", startYear: 2014, endYear: 2022, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Bundesliga", year: 2020, club: "Bayern Munich" },
      { title: "UEFA Champions League", year: 2020, club: "Bayern Munich" },
    ],
  },
  {
    firstName: "Darwin", lastName: "Núñez", dateOfBirth: "2000-06-24",
    nationality: "Uruguay", position: "Delantero Centro", preferredFoot: "right",
    height: 187, weight: 81, currentClub: "Liverpool", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Peñarol", startYear: 2019, endYear: 2020, position: "Delantero Centro" },
      { club: "Almería", startYear: 2020, endYear: 2021, position: "Delantero Centro" },
      { club: "Benfica", startYear: 2021, endYear: 2022, position: "Delantero Centro" },
    ],
    titles: [],
  },
  {
    firstName: "Lautaro", lastName: "Martínez", dateOfBirth: "1997-08-22",
    nationality: "Argentina", position: "Delantero Centro", preferredFoot: "right",
    height: 174, weight: 76, currentClub: "Inter Milan", contractEnd: "2029-06-30",
    clubHistory: [
      { club: "Racing Club", startYear: 2015, endYear: 2018, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Serie A", year: 2024, club: "Inter Milan" },
      { title: "FIFA World Cup", year: 2022, category: "Argentina" },
    ],
  },
  {
    firstName: "Julián", lastName: "Álvarez", dateOfBirth: "2000-01-31",
    nationality: "Argentina", position: "Delantero Centro", preferredFoot: "right",
    height: 170, weight: 67, currentClub: "Atlético de Madrid", contractEnd: "2030-06-30",
    clubHistory: [
      { club: "River Plate", startYear: 2018, endYear: 2022, position: "Segundo Delantero" },
      { club: "Manchester City", startYear: 2022, endYear: 2024, position: "Segundo Delantero" },
    ],
    titles: [
      { title: "FIFA World Cup", year: 2022, category: "Argentina" },
      { title: "UEFA Champions League", year: 2023, club: "Manchester City" },
    ],
  },
  {
    firstName: "Alexander", lastName: "Isak", dateOfBirth: "2000-09-21",
    nationality: "Suecia", position: "Delantero Centro", preferredFoot: "left",
    height: 192, weight: 82, currentClub: "Newcastle United", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "AIK", startYear: 2016, endYear: 2017, position: "Delantero Centro" },
      { club: "Borussia Dortmund", startYear: 2017, endYear: 2019, position: "Delantero Centro" },
      { club: "Real Sociedad", startYear: 2019, endYear: 2022, position: "Delantero Centro" },
    ],
    titles: [],
  },
  {
    firstName: "Victor", lastName: "Osimhen", dateOfBirth: "1998-12-29",
    nationality: "Nigeria", position: "Delantero Centro", preferredFoot: "right",
    height: 185, weight: 78, currentClub: "Galatasaray", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Wolfsburgo", startYear: 2017, endYear: 2017, position: "Delantero Centro" },
      { club: "Charleroi", startYear: 2017, endYear: 2018, position: "Delantero Centro" },
      { club: "Lille", startYear: 2018, endYear: 2020, position: "Delantero Centro" },
      { club: "Napoli", startYear: 2020, endYear: 2024, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Serie A", year: 2023, club: "Napoli" },
    ],
  },
  {
    firstName: "Marcus", lastName: "Thuram", dateOfBirth: "1997-08-06",
    nationality: "Francia", position: "Delantero Centro", preferredFoot: "right",
    height: 192, weight: 88, currentClub: "Inter Milan", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "Guingamp", startYear: 2016, endYear: 2019, position: "Extremo Izquierdo" },
      { club: "Borussia Mönchengladbach", startYear: 2019, endYear: 2023, position: "Delantero Centro" },
    ],
    titles: [
      { title: "Serie A", year: 2024, club: "Inter Milan" },
    ],
  },
  {
    firstName: "Álvaro", lastName: "Morata", dateOfBirth: "1992-10-23",
    nationality: "España", position: "Delantero Centro", preferredFoot: "right",
    height: 188, weight: 82, currentClub: "AC Milan", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Real Madrid", startYear: 2010, endYear: 2016, position: "Delantero Centro" },
      { club: "Juventus", startYear: 2014, endYear: 2016, position: "Delantero Centro" },
      { club: "Chelsea", startYear: 2017, endYear: 2019, position: "Delantero Centro" },
      { club: "Atlético de Madrid", startYear: 2018, endYear: 2023, position: "Delantero Centro" },
    ],
    titles: [
      { title: "UEFA Euro", year: 2024, category: "España" },
    ],
  },
  {
    firstName: "Dušan", lastName: "Vlahović", dateOfBirth: "2000-01-28",
    nationality: "Serbia", position: "Delantero Centro", preferredFoot: "right",
    height: 190, weight: 85, currentClub: "Juventus", contractEnd: "2026-06-30",
    clubHistory: [
      { club: "Partizan", startYear: 2017, endYear: 2018, position: "Delantero Centro" },
      { club: "Fiorentina", startYear: 2018, endYear: 2022, position: "Delantero Centro" },
    ],
    titles: [],
  },
  {
    firstName: "Rasmus", lastName: "Højlund", dateOfBirth: "2003-02-04",
    nationality: "Dinamarca", position: "Delantero Centro", preferredFoot: "right",
    height: 191, weight: 83, currentClub: "Manchester United", contractEnd: "2028-06-30",
    clubHistory: [
      { club: "FC Copenhagen", startYear: 2020, endYear: 2022, position: "Delantero Centro" },
      { club: "Atalanta", startYear: 2022, endYear: 2023, position: "Delantero Centro" },
    ],
    titles: [],
  },
  {
    firstName: "Richarlison", lastName: "de Andrade", dateOfBirth: "1997-05-09",
    nationality: "Brasil", position: "Delantero Centro", preferredFoot: "right",
    height: 181, weight: 78, currentClub: "Tottenham", contractEnd: "2027-06-30",
    clubHistory: [
      { club: "Fluminense", startYear: 2015, endYear: 2017, position: "Extremo Izquierdo" },
      { club: "Watford", startYear: 2017, endYear: 2018, position: "Extremo Izquierdo" },
      { club: "Everton", startYear: 2018, endYear: 2022, position: "Extremo Izquierdo" },
    ],
    titles: [],
  },
];

// ─── Pools de nombres por región ──────────────────────────────────────────────

const NAMES_ES_FIRST = [
  "Carlos", "Juan", "Miguel", "Diego", "Rafael", "Luis", "Alejandro", "Sergio",
  "Marco", "Eduardo", "Cristian", "Rodrigo", "Sebastián", "Nicolás", "Pablo",
  "Javier", "Víctor", "Daniel", "Francisco", "Lorenzo", "Fernando", "Roberto",
  "Santiago", "Pedro", "Antonio", "Raúl", "Rubén", "Adrián", "Borja", "Iván",
  "Marcos", "Gonzalo", "Héctor", "Jaime", "Jorge", "Manuel", "Óscar", "Tomás",
  "Andrés", "Wílmar", "Radamel", "Freddy", "Jhon", "Haiver", "Yerlan",
  "Mateo", "Nicolás", "Giovani", "Facundo", "Thiago", "Ramiro", "Emiliano",
  "Lautaro", "Joaquín", "Germán", "Leandro", "Mauro", "Neymar", "Everton",
];

const NAMES_ES_LAST = [
  "García", "López", "Martínez", "Fernández", "González", "Hernández",
  "Díaz", "Pérez", "Sánchez", "Rodríguez", "Torres", "Ramírez", "Flores",
  "Cruz", "Gómez", "Reyes", "Morales", "Jiménez", "Aguilar", "Castro",
  "Vargas", "Romero", "Mendoza", "Gutiérrez", "Delgado", "Ramos", "Ortiz",
  "Silva", "Molina", "Moreno", "Ruiz", "Muñoz", "Álvarez", "Cabrera",
  "Vásquez", "Ríos", "Medina", "Fuentes", "Contreras", "Bernal", "Navarro",
  "Carrillo", "Herrera", "Montes", "Pizarro", "Rojas", "Suárez", "Valdés",
  "Vega", "Zapata", "Mosquera", "Mina", "Cuadrado", "Falcao", "Murillo",
  "Córdoba", "Valencia", "Meza", "Lozano", "Corona", "Ochoa", "Guardado",
  "Chicharito", "Vidal", "Bravo", "Alexis", "Medel", "Zamorano", "Salas",
  "Cavani", "Forlán", "Suárez", "Recoba", "Godín", "Muslera", "Bentancur",
  "Nandez", "Valverde", "Giménez", "Abreu", "Palacio", "Tevez", "D'Alessandro",
  "Lavezzi", "Biglia", "Banega", "Di María",
];

const NAMES_PT_FIRST = [
  "João", "André", "Rúben", "Nuno", "Gonçalo", "Diogo", "Tiago", "Hugo",
  "Paulo", "Renato", "Ricardo", "Sérgio", "Bruno", "Vitor", "Marco",
  "Bernardo", "Matheus", "Willian", "Thiago", "Felipe", "Vinicius", "Rodrigo",
  "Everton", "Richarlison", "Arthur", "Casemiro", "Firmino", "Danilo",
];

const NAMES_PT_LAST = [
  "Santos", "Ferreira", "Costa", "Carvalho", "Alves", "Sousa", "Ribeiro",
  "Pereira", "Rodrigues", "Lopes", "Nunes", "Pinto", "Correia", "Teixeira",
  "Oliveira", "Mendes", "Moreira", "Cunha", "Moutinho", "Guerreiro",
  "Cancelo", "Semedo", "Guedes", "Trincão", "Jota", "Neves", "Rúben",
  "Vieira", "Fonseca", "Marcelino", "Coutinho", "Paulinho", "Willian",
  "Militão", "Fabinho", "Allison", "Ederson", "Marquinhos", "Neymar",
];

const NAMES_FR_FIRST = [
  "Antoine", "Hugo", "Raphaël", "Benjamin", "Moussa", "Tanguy", "Ferland",
  "Dayot", "Ibrahima", "Lucas", "Thomas", "Clément", "Adrien", "Blaise",
  "Karim", "Théo", "William", "Rayan", "Désiré", "Warren", "Manu",
];

const NAMES_FR_LAST = [
  "Dubois", "Hernández", "Konaté", "Pavard", "Ndombélé", "Mendy", "Pogba",
  "Kanté", "Griezmann", "Dembélé", "Mbappé", "Benzema", "Giroud", "Maignan",
  "Lloris", "Upamecano", "Saliba", "Tchouaméni", "Camavinga", "Fofana",
  "Coman", "Diaby", "Nkunku", "Guendouzi", "Veretout",
];

const NAMES_DE_FIRST = [
  "Kai", "Serge", "Leroy", "Thomas", "Joshua", "Leon", "Niklas", "Antonio",
  "Jonas", "Robin", "Toni", "Ilkay", "Marco", "Sandro", "Florian",
  "Jamal", "Youssoufa", "Josha", "Tom", "Maximilian",
];

const NAMES_DE_LAST = [
  "Havertz", "Gnabry", "Sané", "Müller", "Kimmich", "Goretzka", "Süle",
  "Rüdiger", "Hofmann", "Baumgartner", "Kroos", "Gündogan", "Reus",
  "Wagner", "Werner", "Wirtz", "Moukoko", "Vagnoman", "Henrichs", "Beier",
];

const NAMES_EN_FIRST = [
  "Marcus", "Raheem", "Jadon", "Mason", "Jack", "Jordan", "Harry", "Kalvin",
  "Phil", "Ben", "Conor", "Aaron", "Kieran", "Kyle", "Tyrone", "Fikayo",
  "Ollie", "Ivan", "Eberechi", "Emile", "Kobbie",
];

const NAMES_EN_LAST = [
  "Rashford", "Sterling", "Sancho", "Mount", "Grealish", "Henderson",
  "Kane", "Phillips", "Foden", "White", "Gallagher", "Ramsdale", "Trippier",
  "Walker", "Mings", "Tomori", "Watkins", "Toney", "Eze", "Smith Rowe",
  "Mainoo", "Bellingham", "Saka", "Rice", "Chilwell",
];

// ─── Clubes por liga ──────────────────────────────────────────────────────────

const CLUBS_TOP: string[] = [
  // España
  "Real Madrid", "Barcelona", "Atlético de Madrid", "Sevilla", "Real Sociedad",
  "Valencia", "Villarreal", "Athletic Club", "Osasuna", "Real Betis", "Getafe",
  // Inglaterra
  "Manchester City", "Liverpool", "Arsenal", "Chelsea", "Manchester United",
  "Tottenham", "Newcastle United", "Aston Villa", "West Ham United", "Brighton",
  // Alemania
  "Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig",
  "Eintracht Frankfurt", "Wolfsburgo", "Borussia Mönchengladbach", "Freiburg",
  // Italia
  "Inter Milan", "AC Milan", "Juventus", "Napoli", "Roma", "Lazio", "Atalanta",
  "Fiorentina", "Torino", "Bologna",
  // Francia
  "PSG", "Olympique de Marsella", "Monaco", "Lille", "Lyon", "Niza",
  "Lens", "Rennes", "Montpellier",
  // Portugal
  "Benfica", "Porto", "Sporting CP", "Braga",
  // Países Bajos
  "Ajax", "PSV Eindhoven", "Feyenoord", "AZ Alkmaar",
  // Argentina
  "River Plate", "Boca Juniors", "Racing Club", "Independiente", "San Lorenzo",
  "Vélez Sársfield", "Estudiantes", "Lanús", "Huracán", "Talleres",
  // Brasil
  "Flamengo", "Fluminense", "Palmeiras", "Santos", "São Paulo", "Grêmio",
  "Internacional", "Atlético Mineiro", "Corinthians", "Vasco da Gama",
  // Colombia
  "Junior Barranquilla", "Millonarios", "América de Cali", "Atlético Nacional",
  "Deportivo Cali", "Independiente Medellín", "Once Caldas",
  // México
  "Club América", "Chivas Guadalajara", "Cruz Azul", "Pumas UNAM",
  "Tigres UANL", "Monterrey", "Toluca",
  // Chile / Uruguay / Paraguay
  "Colo-Colo", "Universidad de Chile", "Peñarol", "Nacional", "Olimpia",
  // Saudi / MLS
  "Al-Hilal", "Al-Nassr", "Al-Ittihad", "Al-Ahli",
  "Inter Miami", "LA Galaxy", "NYCFC", "Seattle Sounders",
  // Turquía
  "Galatasaray", "Fenerbahçe", "Beşiktaş",
];

const CLUBS_PREVIOUS: string[] = [
  "Sevilla", "Valencia", "Celta de Vigo", "Rayo Vallecano", "Almería",
  "Elche", "Huesca", "Deportivo La Coruña", "Real Zaragoza",
  "Stoke City", "Burnley", "Crystal Palace", "Brentford", "Fulham",
  "Middlesbrough", "Sheffield United", "Leeds United", "Norwich City",
  "Caen", "Strasbourg", "Bordeaux", "Saint-Étienne", "Angers",
  "Genoa", "Sampdoria", "Udinese", "Cagliari", "Empoli", "Spezia",
  "Stuttgart", "Mainz", "Augsburg", "Bochum", "Arminia Bielefeld",
  "Groningen", "Utrecht", "Twente", "NEC Nijmegen",
  "Basel", "Young Boys", "Salzburgo", "Sturm Graz",
  "Shakhtar Donetsk", "Dynamo Kiev", "Legia Warsaw", "Wisla Kraków",
  "Anderlecht", "Club Brugge", "Gent", "Standard Lieja",
  "Panathinaikos", "Olympiakos", "PAOK", "AEK Atenas",
  "Spartak Moscú", "CSKA Moscú", "Lokomotiv Moscú",
  "Defensa y Justicia", "Banfield", "Rosario Central", "Newell's Old Boys",
  "Lanus", "Belgrano", "Colón", "Unión Santa Fe",
  "Botafogo", "Sport Recife", "Cruzeiro", "Ceará", "Bahia",
  "Deportes Tolima", "Deportivo Pasto", "Alianza Lima", "Universitario",
  "Olimpia", "Cerro Porteño", "Libertad",
];

const NATIONALITIES: string[] = [
  "Argentina", "Brasil", "Colombia", "Uruguay", "Chile", "Venezuela",
  "Ecuador", "Paraguay", "Perú", "Bolivia", "México", "Costa Rica",
  "Honduras", "Panamá", "Guatemala", "El Salvador", "Cuba",
  "España", "Francia", "Alemania", "Italia", "Portugal", "Países Bajos",
  "Bélgica", "Inglaterra", "Escocia", "Croacia", "Serbia", "Suiza",
  "Noruega", "Suecia", "Dinamarca", "Polonia", "Ucrania",
  "Ghana", "Nigeria", "Senegal", "Costa de Marfil", "Camerún", "Marruecos",
  "Egipto", "Mali", "Burkina Faso",
  "Japón", "Corea del Sur", "Australia", "Arabia Saudita",
  "Estados Unidos", "Eslovenia", "Georgia", "Albania",
];

const POSITIONS_DIST: { position: string; weight: number; heightMin: number; heightMax: number; weightMin: number; weightMax: number }[] = [
  { position: "Portero",               weight: 80,  heightMin: 183, heightMax: 198, weightMin: 78, weightMax: 96 },
  { position: "Defensa Central",       weight: 150, heightMin: 180, heightMax: 196, weightMin: 75, weightMax: 95 },
  { position: "Lateral Derecho",       weight: 70,  heightMin: 170, heightMax: 188, weightMin: 65, weightMax: 85 },
  { position: "Lateral Izquierdo",     weight: 70,  heightMin: 170, heightMax: 188, weightMin: 63, weightMax: 83 },
  { position: "Mediocentro Defensivo", weight: 80,  heightMin: 178, heightMax: 193, weightMin: 73, weightMax: 90 },
  { position: "Mediocentro",           weight: 120, heightMin: 170, heightMax: 188, weightMin: 63, weightMax: 83 },
  { position: "Mediocentro Ofensivo",  weight: 80,  heightMin: 170, heightMax: 186, weightMin: 62, weightMax: 80 },
  { position: "Extremo Derecho",       weight: 90,  heightMin: 168, heightMax: 188, weightMin: 62, weightMax: 80 },
  { position: "Extremo Izquierdo",     weight: 90,  heightMin: 168, heightMax: 188, weightMin: 62, weightMax: 80 },
  { position: "Segundo Delantero",     weight: 60,  heightMin: 168, heightMax: 185, weightMin: 65, weightMax: 82 },
  { position: "Delantero Centro",      weight: 110, heightMin: 175, heightMax: 197, weightMin: 72, weightMax: 95 },
];

const FEET: ("left" | "right" | "both")[] = ["right", "right", "right", "left", "left", "both"];

const TITLES_POOL: { title: string; category?: string }[] = [
  { title: "Premier League" }, { title: "La Liga" }, { title: "Serie A" },
  { title: "Bundesliga" }, { title: "Ligue 1" }, { title: "Eredivisie" },
  { title: "UEFA Champions League" }, { title: "UEFA Europa League" },
  { title: "Copa del Rey" }, { title: "FA Cup" }, { title: "Coppa Italia" },
  { title: "DFB-Pokal" }, { title: "Coupe de France" },
  { title: "Copa Libertadores" }, { title: "Copa Sudamericana" },
  { title: "Recopa Sudamericana" }, { title: "Liga MX" },
  { title: "FIFA World Cup", category: "Selección" },
  { title: "Copa América", category: "Selección" },
  { title: "UEFA Euro", category: "Selección" },
  { title: "África Cup of Nations", category: "Selección" },
  { title: "CONCACAF Gold Cup", category: "Selección" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[rnd(0, arr.length - 1)]!;
}

function pickPositionWeighted(): typeof POSITIONS_DIST[number] {
  const total = POSITIONS_DIST.reduce((s, p) => s + p.weight, 0);
  let r = rnd(0, total - 1);
  for (const p of POSITIONS_DIST) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return POSITIONS_DIST[0]!;
}

function randomDate(yearMin: number, yearMax: number): string {
  const year = rnd(yearMin, yearMax);
  const month = String(rnd(1, 12)).padStart(2, "0");
  const day = String(rnd(1, 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function randomContractEnd(): string {
  const year = rnd(2025, 2029);
  return `${year}-06-30`;
}

function randomClubHistory(currentClub: string, position: string): ClubHistory[] {
  const count = rnd(0, 3);
  const history: ClubHistory[] = [];
  let endYear = rnd(2015, 2022);
  for (let i = 0; i < count; i++) {
    const club = pick([...CLUBS_PREVIOUS, ...CLUBS_TOP].filter(c => c !== currentClub));
    const duration = rnd(1, 4);
    const startYear = endYear - duration;
    history.unshift({ club, startYear, endYear, position });
    endYear = startYear - rnd(0, 1);
  }
  return history;
}

function randomTitles(club: string): Title[] {
  const count = rnd(0, 3);
  const result: Title[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    const t = pick(TITLES_POOL);
    if (used.has(t.title)) continue;
    used.add(t.title);
    const entry: Title = { title: t.title, year: rnd(2015, 2024) };
    if (t.category) {
      entry.category = t.category;
    } else {
      entry.club = club;
    }
    result.push(entry);
  }
  return result;
}

function randomName(nationality: string): { firstName: string; lastName: string } {
  const latin = [
    "Argentina", "Brasil", "Colombia", "Uruguay", "Chile", "Venezuela",
    "Ecuador", "Paraguay", "Perú", "Bolivia", "México", "Costa Rica",
    "Honduras", "Panamá", "Guatemala", "El Salvador", "Cuba", "España",
    "Portugal",
  ];
  const french = ["Francia", "Bélgica", "Costa de Marfil", "Senegal", "Mali", "Camerún"];
  const german = ["Alemania", "Suiza", "Austria"];
  const english = ["Inglaterra", "Escocia", "Australia", "Estados Unidos"];

  if (latin.includes(nationality)) {
    const usePt = ["Brasil"].includes(nationality) && Math.random() < 0.6;
    return {
      firstName: usePt ? pick(NAMES_PT_FIRST) : pick(NAMES_ES_FIRST),
      lastName: usePt ? pick(NAMES_PT_LAST) : pick(NAMES_ES_LAST),
    };
  }
  if (french.includes(nationality)) {
    return { firstName: pick(NAMES_FR_FIRST), lastName: pick(NAMES_FR_LAST) };
  }
  if (german.includes(nationality)) {
    return { firstName: pick(NAMES_DE_FIRST), lastName: pick(NAMES_DE_LAST) };
  }
  if (english.includes(nationality)) {
    return { firstName: pick(NAMES_EN_FIRST), lastName: pick(NAMES_EN_LAST) };
  }
  // Default: mix español
  return { firstName: pick(NAMES_ES_FIRST), lastName: pick(NAMES_ES_LAST) };
}

// ─── Generador sintético ──────────────────────────────────────────────────────

function generateSyntheticPlayers(count: number): PlayerSeed[] {
  const players: PlayerSeed[] = [];

  for (let i = 0; i < count; i++) {
    const nationality = pick(NATIONALITIES);
    const { firstName, lastName } = randomName(nationality);
    const posData = pickPositionWeighted();
    const height = rnd(posData.heightMin, posData.heightMax);
    const weight = rnd(posData.weightMin, posData.weightMax);
    const foot = pick(FEET);
    const currentClub = pick(CLUBS_TOP);
    const dob = randomDate(1988, 2007);

    players.push({
      firstName,
      lastName,
      dateOfBirth: dob,
      nationality,
      position: posData.position,
      preferredFoot: foot,
      height,
      weight,
      currentClub,
      contractEnd: randomContractEnd(),
      clubHistory: randomClubHistory(currentClub, posData.position),
      titles: randomTitles(currentClub),
    });
  }

  return players;
}

// ─── Sanitizador para Firestore (elimina undefined recursivamente) ────────────

function sanitize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(sanitize) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = sanitize(v);
      }
    }
    return out as T;
  }
  return value;
}

// ─── Inserción en Firestore ───────────────────────────────────────────────────

async function seed() {
  const TARGET = 1000;
  const syntheticCount = TARGET - REAL_PLAYERS.length;
  const synthetic = generateSyntheticPlayers(syntheticCount);
  const allPlayers = [...REAL_PLAYERS, ...synthetic];

  console.log(`\n🌱 Iniciando seed: ${allPlayers.length} jugadores\n`);
  console.log(`   Reales    : ${REAL_PLAYERS.length}`);
  console.log(`   Sintéticos: ${synthetic.length}`);
  console.log(`   Colección : ${COLLECTION}\n`);

  let batch = db.batch();
  let batchCount = 0;
  let totalInserted = 0;

  for (const player of allPlayers) {
    const docRef = db.collection(COLLECTION).doc();

    batch.set(docRef, sanitize({
      firstName: player.firstName,
      lastName: player.lastName,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      position: player.position,
      preferredFoot: player.preferredFoot,
      height: player.height,
      weight: player.weight,
      currentClub: player.currentClub,
      contractEnd: player.contractEnd,
      contactEmail: player.contactEmail ?? null,
      contactPhone: player.contactPhone ?? null,
      photoURL: null,
      organizationId: null,
      clubHistory: player.clubHistory,
      titles: player.titles,
      createdBy: SEED_UID,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }));

    batchCount++;
    totalInserted++;

    if (batchCount === BATCH_SIZE) {
      await batch.commit();
      console.log(`   ✓ Batch enviado: ${totalInserted}/${allPlayers.length} jugadores`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`   ✓ Batch final enviado: ${totalInserted}/${allPlayers.length} jugadores`);
  }

  console.log(`\n✅ Seed completado: ${totalInserted} jugadores insertados en Firestore.\n`);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
