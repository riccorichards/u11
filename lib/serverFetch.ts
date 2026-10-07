// Path: lib/serverFetch.ts
import { cookies, headers } from "next/headers";

/**
 * For server components that call this app's own API routes.
 *
 * - Builds the URL from the incoming request, so it works on localhost,
 *   Vercel preview URLs and your production domain with no env variable.
 * - Forwards the signed-in user's cookies, so the API sees who is asking.
 * - Throws a clear error on a failed response instead of returning the error
 *   body, which pages would otherwise read as data and crash on.
 */
export async function serverFetch<T>(path: string): Promise<T> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host)
    throw new Error("serverFetch: could not determine the request host");
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  const res = await fetch(`${proto}://${host}${path}`, {
    cache: "no-store",
    headers: { cookie: cookies().toString() },
  });
  if (!res.ok) {
    throw new Error(`serverFetch ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}
