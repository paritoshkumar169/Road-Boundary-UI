import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ field: string }> }
) {
  try {
    // Await the params promise to extract 'field'
    const { field } = await params;

    if (!field) {
      console.error("Error: Missing field ID");
      return NextResponse.json({ error: "Missing field ID" }, { status: 400 });
    }

    // Validate field ID to prevent path traversal attacks
    if (!/^[a-zA-Z0-9_-]+$/.test(field)) {
      console.error(`Error: Invalid field ID: ${field}`);
      return NextResponse.json({ error: "Invalid field ID" }, { status: 400 });
    }

    const resultsDir = path.join(process.cwd(), "public", "results");

    // Ensure the results directory exists
    try {
      await fs.access(resultsDir);
    } catch {
      console.error(`Error: Results directory not found: ${resultsDir}`);
      return NextResponse.json(
        { error: "Results directory not found" },
        { status: 500 }
      );
    }

    // Read the results directory
    let files: string[];
    try {
      files = await fs.readdir(resultsDir);
      console.log(`Files in results directory: ${files}`);
    } catch (error) {
      console.error("Error reading results directory:", error);
      return NextResponse.json(
        { error: "Error accessing results" },
        { status: 500 }
      );
    }

    // Find the file using the 'field' variable
    const resultFile = files.find((file) =>
      file.startsWith(`${field}_result`)
    );
    if (!resultFile) {
      console.error(`Error: Result not found for field ID: ${field}`);
      console.log(`Available files: ${files.join(", ")}`);
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    console.log(`Serving file: ${resultFile}`);
    const filePath = path.join(resultsDir, resultFile);

    // Read the file
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(filePath);
      console.log(
        `Successfully read file: ${filePath}, size: ${fileBuffer.length} bytes`
      );
    } catch (error) {
      console.error("Error reading result file:", error);
      return NextResponse.json(
        { error: "Error reading result file" },
        { status: 500 }
      );
    }

    // Determine content type
    const contentType = getContentType(
      path.extname(resultFile).toLowerCase()
    );

    if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
      console.error(`Error: Invalid file type detected: ${contentType}`);
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${resultFile}"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Unexpected server error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Function to determine content type
function getContentType(ext: string): string {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".mp4":
      return "video/mp4";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}
