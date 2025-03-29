import { type NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises"; // Using promise-based fs functions
import path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

const execPromise = promisify(exec);

// Function to save the uploaded file
async function saveFile(file: File): Promise<{ id: string; path: string; ext: string }> {
  const data = await file.arrayBuffer();
  const id = uuidv4();

  // Determine file extension from file name or fallback based on MIME type
  let ext = path.extname(file.name || "").toLowerCase();
  if (!ext) {
    if (file.type.includes("image/jpeg") || file.type.includes("image/jpg")) {
      ext = ".jpg";
    } else if (file.type.includes("image/png")) {
      ext = ".png";
    } else if (file.type.includes("image/gif")) {
      ext = ".gif";
    } else if (file.type.includes("image/webp")) {
      ext = ".webp";
    } else if (file.type.includes("video")) {
      ext = ".mp4";
    } else {
      ext = ".jpg"; // Default fallback
    }
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error("Error creating upload directory:", err);
  }

  const filePath = path.join(uploadDir, `${id}${ext}`);
  await fs.writeFile(filePath, Buffer.from(data));
  console.log(`File saved: ${filePath}`);
  return { id, path: filePath, ext };
}

export async function POST(request: NextRequest) {
  try {
    console.log("Processing POST request");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const model = (formData.get("model") as string) || "daytime";
    const confidence = Number.parseFloat((formData.get("confidence") as string) || "0.35");
    const displayMode = (formData.get("displayMode") as string) || "draw";

    if (!file) {
      console.error("No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    console.log(`Parameters: model=${model}, confidence=${confidence}, displayMode=${displayMode}`);

    // Create results directory if it doesn't exist
    const resultsDir = path.join(process.cwd(), "public", "results");
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (err) {
      console.error("Error creating results directory:", err);
    }

    // Save the uploaded file
    const { id, path: filePath, ext } = await saveFile(file);
    const outputPath = path.join(resultsDir, `${id}_result${ext}`);

    // Run the Python script using "python3" to ensure it's found
    const pythonScript = path.join(process.cwd(), "src", "app", "Python", "processor.py");
    const cmd = `python3 "${pythonScript}" --input "${filePath}" --output "${outputPath}" --model "${model}" --confidence ${confidence} --display-mode "${displayMode}"`;
    console.log(`Executing command: ${cmd}`);

    const { stdout, stderr } = await execPromise(cmd);
    if (stderr) {
      console.error("Python error:", stderr);
    }

    let result;
    try {
      result = JSON.parse(stdout);
      console.log("Python script result:", result);
    } catch (e) {
      console.error("Failed to parse Python output:", e, stdout);
      result = { success: false, error: "Failed to process file" };
    }
    

    if (!result.success) {
      console.error("Processing failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log(`Processing successful. File ID: ${id}`);
    return NextResponse.json({
      success: true,
      fileId: id,
      type: ext.includes("mp4") || ext.includes("avi") ? "video" : "image",
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error processing file" },
      { status: 500 }
    );
  }
}
