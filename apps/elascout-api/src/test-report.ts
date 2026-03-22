/**
 * Test script for report generation + email sending.
 * Run: npx tsx src/test-report.ts
 *
 * Tests each step independently to identify failures.
 */
import "dotenv/config";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;
const RESEND_KEY = process.env.RESEND_API_KEY!;
const TEST_EMAIL = process.env.TEST_EMAIL || "carlos.polanco010@gmail.com";

function log(step: string, msg: string) {
  console.log(`[${step}] ${msg}`);
}

// ─── Step 1: Test Claude API ──────────────────────────────────────────────

async function testClaudeAPI(): Promise<string> {
  log("CLAUDE", "Testing Claude API connection...");
  const start = Date.now();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Genera un reporte de scouting simple en HTML para un deportista ficticio.
El HTML debe ser un documento completo (<!DOCTYPE html>...) con estilos inline.
Incluye: nombre, posicion, estadisticas basicas (velocidad, fuerza, tecnica con barras de progreso CSS),
y un SVG radar chart simple con 5 ejes.
Responde UNICAMENTE con el HTML, sin markdown ni explicaciones.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };
  const html = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  log("CLAUDE", `OK - ${html.length} chars, ${data.usage.output_tokens} tokens, ${elapsed}s`);
  log("CLAUDE", `Has <!DOCTYPE: ${html.includes("<!DOCTYPE")} | Has <svg: ${html.includes("<svg")}`);

  return html;
}

// ─── Step 2: Test Resend Email (plain text) ───────────────────────────────

async function testResendPlain(): Promise<void> {
  log("RESEND", `Testing plain email to ${TEST_EMAIL}...`);
  const start = Date.now();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "ElaScout <reports@elascout.garaje88.dev>",
      to: TEST_EMAIL,
      subject: `[TEST] ElaScout Report - ${new Date().toLocaleTimeString()}`,
      html: `<h1>Test from ElaScout</h1><p>This is a test email sent at ${new Date().toISOString()}</p>`,
    }),
  });

  const data = await res.json();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (!res.ok) {
    log("RESEND", `FAILED ${res.status}: ${JSON.stringify(data)}`);
    throw new Error(`Resend error: ${JSON.stringify(data)}`);
  }

  log("RESEND", `OK - email ID: ${(data as { id: string }).id}, ${elapsed}s`);
}

// ─── Step 3: Test Resend with HTML attachment ─────────────────────────────

async function testResendWithAttachment(html: string): Promise<void> {
  log("RESEND+PDF", `Testing email with HTML report attachment to ${TEST_EMAIL}...`);
  const start = Date.now();

  const htmlBase64 = Buffer.from(html).toString("base64");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "ElaScout <reports@elascout.garaje88.dev>",
      to: TEST_EMAIL,
      subject: `[TEST] Reporte Scouting - ${new Date().toLocaleTimeString()}`,
      html: `<div style="font-family:sans-serif;padding:24px;">
        <h1 style="color:#0B0F14;">ElaScout - Reporte de Scouting</h1>
        <p>Tu reporte esta adjunto. Abrelo en el navegador para visualizarlo e imprimirlo como PDF.</p>
        <p style="color:#888;font-size:12px;">Generado el ${new Date().toLocaleString("es-ES")}</p>
      </div>`,
      attachments: [
        {
          filename: `reporte-scouting-${new Date().toISOString().slice(0, 10)}.html`,
          content: htmlBase64,
          content_type: "text/html",
        },
      ],
    }),
  });

  const data = await res.json();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (!res.ok) {
    log("RESEND+PDF", `FAILED ${res.status}: ${JSON.stringify(data)}`);
    throw new Error(`Resend error: ${JSON.stringify(data)}`);
  }

  log("RESEND+PDF", `OK - email ID: ${(data as { id: string }).id}, ${elapsed}s`);
}

// ─── Step 4: Test Puppeteer PDF conversion ────────────────────────────────

async function testPuppeteerPDF(html: string): Promise<Buffer> {
  log("PUPPETEER", "Testing PDF conversion...");
  const start = Date.now();

  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });

    const pdfBuffer = Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "15mm", bottom: "15mm", left: "10mm", right: "10mm" },
      })
    );

    await browser.close();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    log("PUPPETEER", `OK - PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB, ${elapsed}s`);
    return pdfBuffer;
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    log("PUPPETEER", `FAILED after ${elapsed}s: ${(err as Error).message}`);
    throw err;
  }
}

// ─── Step 5: Test full flow with PDF attachment ───────────────────────────

async function testFullFlowWithPDF(html: string, pdfBuffer: Buffer): Promise<void> {
  log("FULL", `Testing email with PDF attachment to ${TEST_EMAIL}...`);
  const start = Date.now();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "ElaScout <reports@elascout.garaje88.dev>",
      to: TEST_EMAIL,
      subject: `[TEST] Reporte PDF Scouting - ${new Date().toLocaleTimeString()}`,
      html: `<div style="font-family:sans-serif;padding:24px;">
        <h1 style="color:#0B0F14;">ElaScout - Reporte de Scouting</h1>
        <p>Tu reporte PDF esta adjunto.</p>
      </div>`,
      attachments: [
        {
          filename: `reporte-scouting-${new Date().toISOString().slice(0, 10)}.pdf`,
          content: pdfBuffer.toString("base64"),
          content_type: "application/pdf",
        },
      ],
    }),
  });

  const data = await res.json();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (!res.ok) {
    log("FULL", `FAILED ${res.status}: ${JSON.stringify(data)}`);
    throw new Error(`Resend error: ${JSON.stringify(data)}`);
  }

  log("FULL", `OK - email ID: ${(data as { id: string }).id}, ${elapsed}s`);
}

// ─── Run all tests ────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("ElaScout Report Generation Test");
  console.log(`Target email: ${TEST_EMAIL}`);
  console.log("=".repeat(60));

  // Verify env vars
  if (!ANTHROPIC_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY not set in .env");
    process.exit(1);
  }
  if (!RESEND_KEY) {
    console.error("ERROR: RESEND_API_KEY not set in .env");
    process.exit(1);
  }
  log("ENV", `ANTHROPIC_API_KEY: ${ANTHROPIC_KEY.slice(0, 15)}...`);
  log("ENV", `RESEND_API_KEY: ${RESEND_KEY.slice(0, 10)}...`);

  const results: Record<string, "PASS" | "FAIL"> = {};

  // Test 1: Claude API
  let html = "";
  try {
    html = await testClaudeAPI();
    results["Claude API"] = "PASS";
  } catch (err) {
    console.error(err);
    results["Claude API"] = "FAIL";
  }

  // Test 2: Resend plain email
  try {
    await testResendPlain();
    results["Resend (plain)"] = "PASS";
  } catch (err) {
    console.error(err);
    results["Resend (plain)"] = "FAIL";
  }

  // Test 3: Resend with HTML attachment
  if (html) {
    try {
      await testResendWithAttachment(html);
      results["Resend (HTML attach)"] = "PASS";
    } catch (err) {
      console.error(err);
      results["Resend (HTML attach)"] = "FAIL";
    }
  }

  // Test 4: Puppeteer PDF
  let pdfBuffer: Buffer | null = null;
  if (html) {
    try {
      pdfBuffer = await testPuppeteerPDF(html);
      results["Puppeteer PDF"] = "PASS";
    } catch (err) {
      console.error(err);
      results["Puppeteer PDF"] = "FAIL";
    }
  }

  // Test 5: Full flow with PDF
  if (html && pdfBuffer) {
    try {
      await testFullFlowWithPDF(html, pdfBuffer);
      results["Full (PDF email)"] = "PASS";
    } catch (err) {
      console.error(err);
      results["Full (PDF email)"] = "FAIL";
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS:");
  console.log("=".repeat(60));
  for (const [test, result] of Object.entries(results)) {
    const icon = result === "PASS" ? "✓" : "✗";
    console.log(`  ${icon} ${test}: ${result}`);
  }
  console.log("=".repeat(60));
}

main().catch(console.error);
