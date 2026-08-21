import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

// Node's child_process strips PATH — explicitly include standard bin dirs
const EXEC_ENV = {
  ...process.env,
  PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
};

export async function POST(req: Request) {
  const tempDir = tmpdir();
  const id = randomUUID();
  const inputPath = join(tempDir, `${id}_input.pdf`);
  const outputPath = join(tempDir, `${id}_output.pdf`);

  try {
    const formData = await req.formData();
    const file = formData.get("files") as File | null;
    const password = (formData.get("password") as string | null) ?? "";

    if (!file) {
      return new Response("No PDF file provided.", { status: 400 });
    }

    // Write uploaded PDF to temp disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    // Run qpdf to decrypt — user must supply the correct password
    const safePassword = password.replace(/'/g, "'\\''");
    const { stderr } = await execAsync(
      `qpdf --decrypt --password='${safePassword}' '${inputPath}' '${outputPath}'`,
      { env: EXEC_ENV }
    );

    if (stderr && stderr.trim().length > 0) {
      console.warn("qpdf stderr:", stderr);
    }

    const outputBuffer = await readFile(outputPath);

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"decrypted.pdf\"",
        "Content-Length": String(outputBuffer.byteLength),
      },
    });
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);

    // qpdf exits with code 2 for wrong password
    if (msg.includes("invalid password") || msg.includes("exit code 2")) {
      return new Response(
        "Incorrect password. Please check and try again.",
        { status: 400 }
      );
    }

    console.error("PDF decrypt error:", msg);
    return new Response("Failed to decrypt PDF. " + msg, { status: 500 });
  } finally {
    // Clean up temp files — fire and forget
    unlink(inputPath).catch(() => {});
    unlink(outputPath).catch(() => {});
  }
}
