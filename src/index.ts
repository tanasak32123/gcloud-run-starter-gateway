import { Elysia } from "elysia";
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

const app = new Elysia()
  .all("/*", async ({ request, path }) => {
    const upstream = matchRoute(path);

    if (!upstream) {
      return new Response("Not Found", { status: 404 });
    }

    const url = upstream + request.url.slice(request.url.indexOf(path));

    const res = await fetch(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  })
  .listen(appConfig.port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
