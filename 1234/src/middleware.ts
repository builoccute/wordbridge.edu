import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Transparently route /api/<subpath> to /api with x-wb-api-path header
  if (pathname.startsWith("/api/")) {
    const subPath = pathname.slice("/api/".length);
    if (subPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/api";
      url.searchParams.set("__wb_api_path", subPath);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-wb-api-path", subPath);
      return NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });
    }
  }

  // 2. Transparently route dynamic page URLs to their unified page handlers
  const docCatMatch = pathname.match(/^\/documents\/danh-muc\/([^/]+)\/?$/);
  if (docCatMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/documents";
    url.searchParams.set("categorySlug", decodeURIComponent(docCatMatch[1]));
    return NextResponse.rewrite(url);
  }

  const docSlugMatch = pathname.match(/^\/documents\/([^/]+)\/?$/);
  if (docSlugMatch && docSlugMatch[1] !== "danh-muc") {
    const url = request.nextUrl.clone();
    url.pathname = "/documents";
    url.searchParams.set("slug", decodeURIComponent(docSlugMatch[1]));
    return NextResponse.rewrite(url);
  }

  const examTestMatch = pathname.match(/^\/luyen-de\/thi\/([^/]+)\/?$/);
  if (examTestMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/luyen-de";
    url.searchParams.set("testSlug", decodeURIComponent(examTestMatch[1]));
    return NextResponse.rewrite(url);
  }

  const examSetMatch = pathname.match(/^\/luyen-de\/([^/]+)\/?$/);
  if (examSetMatch && examSetMatch[1] !== "thi") {
    const url = request.nextUrl.clone();
    url.pathname = "/luyen-de";
    url.searchParams.set("setSlug", decodeURIComponent(examSetMatch[1]));
    return NextResponse.rewrite(url);
  }

  const grammarMatch = pathname.match(/^\/ngu-phap\/([^/]+)\/?$/);
  if (grammarMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/ngu-phap";
    url.searchParams.set("slug", decodeURIComponent(grammarMatch[1]));
    return NextResponse.rewrite(url);
  }

  const scenarioMatch = pathname.match(/^\/tinh-huong\/([^/]+)\/?$/);
  if (scenarioMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/tinh-huong";
    url.searchParams.set("slug", decodeURIComponent(scenarioMatch[1]));
    return NextResponse.rewrite(url);
  }

  const policyMatch = pathname.match(/^\/chinh-sach\/([^/]+)\/?$/);
  if (policyMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/chinh-sach";
    url.searchParams.set("slug", decodeURIComponent(policyMatch[1]));
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path+",
    "/documents/:path+",
    "/luyen-de/:path+",
    "/ngu-phap/:path+",
    "/tinh-huong/:path+",
    "/chinh-sach/:path+",
  ],
};
