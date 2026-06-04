import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: "ok",
      service: "trimly-web",
      timestamp: new Date().toISOString(),
    },
  });
}
