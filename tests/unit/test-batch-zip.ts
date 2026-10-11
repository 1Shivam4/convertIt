import sharp from "sharp";
import JSZip from "jszip";
import { POST } from "../../app/api/image/convert/route";
import { NextRequest } from "next/server";

async function runTest() {
  console.log("🧪 Testing Batch Image Conversion and ZIP Generation...");

  // 1. Generate 10 test images
  const testFiles: File[] = [];
  for (let i = 1; i <= 10; i++) {
    const imgBuf = await sharp({
      create: {
        width: 100 + i * 10,
        height: 100 + i * 10,
        channels: 3,
        background: { r: 50 + i * 15, g: 100, b: 200 - i * 15 },
      },
    })
      .png()
      .toBuffer();

    const file = new File([new Uint8Array(imgBuf)], `test_photo_${i}.png`, { type: "image/png" });
    testFiles.push(file);
  }

  console.log(`Generated ${testFiles.length} sample PNG files.`);

  // 2. Prepare FormData
  const formData = new FormData();
  testFiles.forEach((f) => formData.append("files", f));
  formData.append(
    "options",
    JSON.stringify({
      targetFormat: "jpg",
      quality: 85,
      stripExif: true,
    })
  );

  // 3. Invoke API route
  const req = new NextRequest("http://localhost:3000/api/image/convert", {
    method: "POST",
    body: formData,
  });

  const res = await POST(req);

  console.log(`Response Status: ${res.status}`);
  console.log(`Content-Type: ${res.headers.get("content-type")}`);
  console.log(`Content-Disposition: ${res.headers.get("content-disposition")}`);

  if (res.status !== 200) {
    const txt = await res.text();
    throw new Error(`Expected HTTP 200, got ${res.status}: ${txt}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const zipBuffer = Buffer.from(arrayBuffer);

  console.log(`ZIP file size: ${zipBuffer.length} bytes (previously was corrupt 148 B)`);
  if (zipBuffer.length <= 500) {
    throw new Error(`ZIP size too small: ${zipBuffer.length} B`);
  }

  // 4. Validate ZIP with JSZip
  const zip = await JSZip.loadAsync(zipBuffer);
  const fileNames = Object.keys(zip.files);
  console.log(`Files found in archive: ${fileNames.length}`);
  console.log("Archive contents:", fileNames);

  if (fileNames.length !== 10) {
    throw new Error(`Expected 10 files in ZIP, but found ${fileNames.length}`);
  }

  // 5. Verify each converted image inside the ZIP is a valid JPEG
  for (const name of fileNames) {
    if (!name.endsWith(".jpg")) {
      throw new Error(`File ${name} does not have .jpg extension`);
    }
    const entryData = await zip.files[name].async("nodebuffer");
    // Check JPEG magic bytes: FF D8 FF
    if (entryData[0] !== 0xff || entryData[1] !== 0xd8 || entryData[2] !== 0xff) {
      throw new Error(`File ${name} does not have valid JPEG header!`);
    }
    // Verify Sharp can parse it
    const meta = await sharp(entryData).metadata();
    if (meta.format !== "jpeg") {
      throw new Error(`Sharp failed to parse ${name} as JPEG!`);
    }
    console.log(`  ✓ ${name}: Valid JPEG (${meta.width}x${meta.height}, ${entryData.length} B)`);
  }

  console.log("🎉 All 10 images successfully converted and verified inside the valid ZIP bundle!");
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
