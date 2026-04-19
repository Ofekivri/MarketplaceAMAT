import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedDemoData } from "@/lib/seedData";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest) {
  const expected = process.env.SEED_SECRET;
  if (!expected) {
    return {
      ok: false as const,
      status: 500,
      message:
        "SEED_SECRET environment variable is not set on the server. Set it in Vercel → Settings → Environment Variables, then redeploy.",
    };
  }
  const provided =
    req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-seed-secret");
  if (provided !== expected) {
    return { ok: false as const, status: 401, message: "Bad or missing secret" };
  }
  return { ok: true as const };
}

async function run(req: NextRequest, reset: boolean) {
  const auth = checkAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    const result = await seedDemoData(prisma, { reset });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  // GET seeds only when DB is empty (idempotent — safe to hit).
  return run(req, false);
}

export async function POST(req: NextRequest) {
  // POST with ?reset=true wipes and re-seeds.
  const reset = req.nextUrl.searchParams.get("reset") === "true";
  return run(req, reset);
}
