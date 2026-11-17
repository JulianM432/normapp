import { endSession } from "@/lib/session";

export async function GET(request: Request) {
  await endSession();
  return Response.redirect(new URL("/panel", request.url), 303);
}
