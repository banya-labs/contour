import { NextRequest } from "next/server";
import { GET as mcpGet, POST as mcpPost } from "../route";

/**
 * Dedicated SSE MCP Endpoint Alias for Dify Agent MCP Integration
 * (`/api/mcp/sse`)
 */
export async function GET(req: NextRequest) {
  return mcpGet(req);
}

export async function POST(req: NextRequest) {
  return mcpPost(req);
}
