import { Elysia } from "elysia";
import { GoogleAuth } from "google-auth-library";
import { appConfig } from "./config/appConfig";

const routes: Record<string, string> = {
  "/users": appConfig.userApiBaseUrl,
};

function matchRoute(path: string): string | null {
  for (const prefix in routes) {
    if (path === prefix || path.startsWith(prefix + "/")) {
      return routes[prefix];
    }
  }
  return null;
}

const auth = new GoogleAuth();

async function getIdToken(audience: string): Promise<string | null> {
  try {
    const client = await auth.getIdTokenClient(audience);
    return await client.idTokenProvider.fetchIdToken(audience);
  } catch {
    return null;
  }
}

const app = new Elysia()
  .all("/*", async ({ request, path }) => {
    const upstream = matchRoute(path);

    if (!upstream) {
      return new Response("Not Found", { status: 404 });
    }

    const url = upstream + request.url.slice(request.url.indexOf(path));

    const headers = new Headers();
    const allowedHeaders = ["content-type", "accept", "accept-language", "accept-encoding"];
    for (const key of allowedHeaders) {
      const value = request.headers.get(key);
      if (value) headers.set(key, value);
    }

    const idToken = await getIdToken(upstream);
    if (idToken) {
      headers.set("Authorization", `Bearer ${idToken}`);
    }

    const res = await fetch(url, {
      method: request.method,
      headers,
      body: request.body,
    });

    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  })
  .listen(appConfig.port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
