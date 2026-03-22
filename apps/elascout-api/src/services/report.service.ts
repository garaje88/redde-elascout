import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import puppeteer from "puppeteer";
import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReportOptions {
  includeCharts: boolean;
  evalViewType: "per_evaluation" | "consolidated";
  personalData: boolean;
  representativeData: boolean;
  clubHistory: boolean;
  titles: boolean;
}

export interface ReportRequest {
  athleteIds: string[];
  options: ReportOptions;
  userEmail: string;
  userName?: string;
  uid: string;
}

interface AthleteData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationality?: string;
  contactEmail?: string;
  contactPhone?: string;
  position?: string;
  secondaryPosition?: string;
  preferredFoot?: string;
  height?: number;
  weight?: number;
  currentClub?: string;
  contractEnd?: string;
  clubHistory?: Array<{ club: string; startYear: number; endYear?: number; position?: string }>;
  titles?: Array<{ title: string; year: number; club?: string; category?: string }>;
  representative?: { name: string; email?: string; phone?: string; agency?: string };
  physicalAvg?: Record<string, number>;
  technicalAvg?: Record<string, number>;
  tacticalAvg?: Record<string, number>;
  evaluationCount?: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────

// Resend: use verified domain in production, fallback to testing sender
const RESEND_FROM = process.env.RESEND_FROM || "ElaScout <onboarding@resend.dev>";

// ─── Fetch athlete data from Firestore ────────────────────────────────────

async function fetchAthletesData(athleteIds: string[]): Promise<AthleteData[]> {
  const athletes: AthleteData[] = [];
  for (const id of athleteIds) {
    const doc = await db.collection("athletes").doc(id).get();
    if (doc.exists) {
      athletes.push({ id: doc.id, ...doc.data() } as AthleteData);
    }
  }
  return athletes;
}

// ─── Build the Claude prompt ─────────────────────────────────────────────

function buildReportPrompt(athletes: AthleteData[], options: ReportOptions): string {
  const athleteDataJson = athletes.map((a) => {
    const data: Record<string, unknown> = {
      nombre: `${a.firstName} ${a.lastName}`,
      id: a.id,
    };

    if (options.personalData) {
      data.datosPersonales = {
        fechaNacimiento: a.dateOfBirth,
        nacionalidad: a.nationality,
        email: a.contactEmail,
        telefono: a.contactPhone,
        posicion: a.position,
        posicionSecundaria: a.secondaryPosition,
        pieDominante: a.preferredFoot,
        estatura: a.height ? `${a.height} m` : undefined,
        peso: a.weight ? `${a.weight} kg` : undefined,
        clubActual: a.currentClub,
        finContrato: a.contractEnd,
      };
    }

    if (options.representativeData && a.representative) {
      data.representante = a.representative;
    }

    if (options.clubHistory && a.clubHistory?.length) {
      data.historialClubes = a.clubHistory;
    }

    if (options.titles && a.titles?.length) {
      data.titulosReconocimientos = a.titles;
    }

    if (a.physicalAvg || a.technicalAvg || a.tacticalAvg) {
      data.evaluaciones = {
        cantidadEvaluaciones: a.evaluationCount ?? 0,
        promedioFisico: a.physicalAvg,
        promedioTecnico: a.technicalAvg,
        promedioTactico: a.tacticalAvg,
        tipoVista: options.evalViewType === "consolidated" ? "Consolidado" : "Por evaluacion",
      };
    }

    return data;
  });

  return `Eres un analista de scouting deportivo profesional. Genera un REPORTE DE SCOUTING en HTML que sera convertido a PDF.

## INSTRUCCIONES:

1. **Formato**: HTML completo (<!DOCTYPE html>...) con CSS embebido. NO JavaScript.

2. **Diseño**: Fondo blanco, encabezados #0B0F14, acentos #00E59B, font-family sans-serif. Layout limpio. Portada con "ElaScout", fecha, total deportistas. Cada deportista con page-break-before: always.

3. **Contenido por deportista**:
   - Encabezado: nombre, posicion, club, nacionalidad
   ${options.personalData ? "- DATOS PERSONALES: tabla con info personal y profesional" : ""}
   ${options.representativeData ? "- REPRESENTANTE: datos del agente" : ""}
   ${options.clubHistory ? "- HISTORIAL DE CLUBES: lista con clubes, anos y posiciones" : ""}
   ${options.titles ? "- TITULOS: logros destacados" : ""}
   - EVALUACION DEPORTIVA (si hay datos):
     * FISICO: velocidad, aceleracion, fuerza, resistencia, potencia, reaccion (0-100)
     * TECNICO: pase, control, regate, disparo, cabeceo, presion (0-10)
     * TACTICO: posicionamiento, marcaje, desmarque, transicion (0-10)
     ${options.includeCharts ? `* SVG RADAR CHARTS inline (NO JavaScript):
       - Fisico (6 ejes, escala 0-100), Tecnico (6 ejes, 0-10 normalizado a %), Tactico (4 ejes, 0-10 normalizado a %)
       - Cada uno: 250x250px viewBox, cuadricula poligonal al 25/50/75/100%, area rgba(0,229,155,0.3) con borde #00E59B, etiquetas con valor
       - Barras de progreso CSS por atributo` : ""}
     ${options.evalViewType === "consolidated" ? "* Vista consolidada" : "* Vista por area separada"}
   - ANALISIS: fortalezas, areas de mejora, recomendacion (alto/medio/bajo)

4. **Pagina final**: disclaimer "Reporte generado por ElaScout AI", fecha

5. **CSS impresion**: @media print, page-break-inside: avoid

## DATOS:

\`\`\`json
${JSON.stringify(athleteDataJson, null, 2)}
\`\`\`

Responde UNICAMENTE con HTML, sin markdown.`;
}

// ─── Generate report with Claude and send via email ───────────────────────

export async function generateAndSendReport(request: ReportRequest): Promise<{ reportId: string }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");
  if (!resendKey) throw new Error("RESEND_API_KEY not configured");

  // Create report record in Firestore
  const reportRef = db.collection("reports").doc();
  const reportId = reportRef.id;

  await reportRef.set({
    status: "processing",
    athleteIds: request.athleteIds,
    options: request.options,
    userEmail: request.userEmail,
    userName: request.userName,
    createdBy: request.uid,
    createdAt: Timestamp.now(),
  });

  // Run async — don't await
  processReport(reportId, request, anthropicKey, resendKey).catch((err) => {
    console.error(`[report:${reportId}] Failed:`, err);
    reportRef.update({ status: "failed", error: String(err), updatedAt: Timestamp.now() });
  });

  return { reportId };
}

async function processReport(
  reportId: string,
  request: ReportRequest,
  anthropicKey: string,
  resendKey: string,
): Promise<void> {
  const reportRef = db.collection("reports").doc(reportId);
  const t0 = Date.now();

  // 1. Fetch athlete data
  const athletes = await fetchAthletesData(request.athleteIds);
  if (athletes.length === 0) {
    await reportRef.update({ status: "failed", error: "No athletes found", updatedAt: Timestamp.now() });
    return;
  }
  console.log(`[report:${reportId}] Fetched ${athletes.length} athletes in ${Date.now() - t0}ms`);

  // 2. Build prompt and call Claude
  const t1 = Date.now();
  const prompt = buildReportPrompt(athletes, request.options);

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const htmlContent = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  console.log(`[report:${reportId}] Claude: ${htmlContent.length} chars, ${Date.now() - t1}ms, SVG: ${htmlContent.includes("<svg")}`);

  if (!htmlContent.includes("<!DOCTYPE") && !htmlContent.includes("<html")) {
    await reportRef.update({ status: "failed", error: "AI did not generate valid HTML", updatedAt: Timestamp.now() });
    return;
  }

  // 3. Convert HTML to PDF with Puppeteer
  const t2 = Date.now();
  let pdfBuffer: Buffer;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    timeout: 30000,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded", timeout: 15000 });
    pdfBuffer = Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "15mm", bottom: "15mm", left: "10mm", right: "10mm" },
      }),
    );
    console.log(`[report:${reportId}] PDF: ${(pdfBuffer.length / 1024).toFixed(1)} KB, ${Date.now() - t2}ms`);
  } finally {
    await browser.close();
  }

  // 4. Send email with PDF report
  const t3 = Date.now();
  const resend = new Resend(resendKey);

  const athleteNames = athletes.map((a) => `${a.firstName} ${a.lastName}`).join(", ");
  const dateStr = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  const emailResult = await resend.emails.send({
    from: RESEND_FROM,
    to: request.userEmail,
    subject: `Reporte de Scouting — ${athleteNames} — ${dateStr}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#0B0F14;font-size:24px;margin:0;">ElaScout</h1>
          <p style="color:#666;font-size:14px;margin:8px 0 0;">Reporte de Scouting Profesional</p>
        </div>
        <p style="color:#333;font-size:14px;line-height:1.6;">
          Hola${request.userName ? ` ${request.userName}` : ""},
        </p>
        <p style="color:#333;font-size:14px;line-height:1.6;">
          Tu reporte de scouting ha sido generado exitosamente. Se incluyen los perfiles de
          <strong>${athletes.length} deportista${athletes.length !== 1 ? "s" : ""}</strong>:
          ${athleteNames}.
        </p>
        <p style="color:#333;font-size:14px;line-height:1.6;">
          El reporte completo esta adjunto en formato PDF.
        </p>
        <div style="margin:24px 0;padding:16px;background:#f8f9fa;border-radius:8px;border:1px solid #e0e0e0;">
          <p style="margin:0;font-size:12px;color:#888;">
            <strong>Detalles del reporte:</strong><br>
            Deportistas: ${athletes.length}<br>
            Opciones: ${[
              request.options.personalData && "Datos personales",
              request.options.representativeData && "Representante",
              request.options.clubHistory && "Historial de clubes",
              request.options.titles && "Titulos",
              request.options.includeCharts && "Graficos (radar charts)",
              request.options.evalViewType === "consolidated" ? "Vista consolidada" : "Por evaluacion",
            ].filter(Boolean).join(", ")}<br>
            Fecha: ${dateStr}
          </p>
        </div>
        <p style="color:#999;font-size:11px;text-align:center;margin-top:32px;">
          Generado por ElaScout AI — elascout.garaje88.dev
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `reporte-scouting-${new Date().toISOString().slice(0, 10)}.pdf`,
        content: pdfBuffer.toString("base64"),
        contentType: "application/pdf",
      },
    ],
  });

  if (emailResult.error) {
    const errMsg = `Resend error: ${emailResult.error.message}`;
    console.error(`[report:${reportId}] ${errMsg}`);
    await reportRef.update({ status: "failed", error: errMsg, updatedAt: Timestamp.now() });
    return;
  }

  // 5. Update report status
  const totalMs = Date.now() - t0;
  await reportRef.update({
    status: "completed",
    updatedAt: Timestamp.now(),
  });

  console.log(`[report:${reportId}] Done! Email: ${t3}ms, Total: ${totalMs}ms, sent to ${request.userEmail} (ID: ${emailResult.data?.id})`);
}

// ─── Get report status ────────────────────────────────────────────────────

export async function getReportStatus(reportId: string, uid: string) {
  const doc = await db.collection("reports").doc(reportId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.createdBy !== uid) return null;
  return {
    id: doc.id,
    status: data.status as string,
    error: data.error as string | undefined,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? "",
  };
}
