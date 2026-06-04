import { NextRequest, NextResponse } from "next/server";
import { requireClerkAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { fail, handleRouteError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

function hasValidImageSignature(type: string, buffer: Buffer) {
  if (type === "image/jpeg" || type === "image/jpg") {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (type === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (type === "image/gif") {
    const header = buffer.subarray(0, 6).toString("ascii");
    return header === "GIF87a" || header === "GIF89a";
  }
  if (type === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

// POST /api/v1/upload
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "upload", { limit: 20, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  const userIdOrError = await requireClerkAuth();
  if (userIdOrError instanceof NextResponse) return userIdOrError;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return fail("BAD_REQUEST", "No file provided", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return fail("BAD_REQUEST", "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.", 400);
    }

    if (file.size > MAX_SIZE_BYTES) {
      return fail("BAD_REQUEST", "File too large. Maximum size is 5 MB.", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (!hasValidImageSignature(file.type, buffer)) {
      return fail("BAD_REQUEST", "Uploaded file content does not match an allowed image type.", 400);
    }

    // Determine extension from MIME type
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const ext = extMap[file.type] || "jpg";
    const filename = `${randomUUID()}.${ext}`;

    // Save to public/uploads/
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename,
        contentType: file.type,
        size: file.size,
      },
    });
  } catch (err) {
    return handleRouteError("upload", err);
  }
}
