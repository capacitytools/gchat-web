import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "gchat-web",
    phase: "mvp-shell",
    version: "0.1.0",
  });
}