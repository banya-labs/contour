import "../../../lib/load-contour-env";
import { NextResponse } from "next/server";
import { checkContourDatabaseConnection } from "@contour/db";

export async function GET() {
  const database = await checkContourDatabaseConnection();
  const ok = database.connected;

  return NextResponse.json(
    {
      ok,
      database,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
