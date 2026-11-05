import { NextRequest, NextResponse } from "next/server";
import { buildAffiliateLink, isAllowedUrl, isPartner } from "@/lib/affiliate";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partner: string }> }
) {
  const limited = rateLimit(req, { limit: 120, keyPrefix: "affiliate" });
  if (limited) return limited;
  const { partner } = await params;
  const target = req.nextUrl.searchParams.get("u") ?? "";

  if (!isPartner(partner) || !isAllowedUrl(partner, target)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Click logging goes here later (partner, target, timestamp).
  return NextResponse.redirect(buildAffiliateLink(partner, target), 302);
}
