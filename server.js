const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const {
  loadDotEnv,
  createTrendResponse,
  createIdeaResponse,
  createDraftResponse,
  createNotionUpload,
  getHealthStatus,
} = require("./lib/peterslab-service");

loadDotEnv(__dirname);

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

function serveStatic(requestPath, response) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(ROOT, normalizedPath.replace(/^\/+/, ""));
  const extension = path.extname(filePath).toLowerCase();

  if (![".html", ".css", ".js", ".md"].includes(extension)) {
    return false;
  }

  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }

  response.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath).pipe(response);
  return true;
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      sendJson(response, 200, getHealthStatus());
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/trends") {
      const body = await readBody(request);
      sendJson(response, 200, await createTrendResponse(body.filters || {}));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/ideas") {
      const body = await readBody(request);
      sendJson(response, 200, await createIdeaResponse(body));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/draft") {
      const body = await readBody(request);
      sendJson(response, 200, await createDraftResponse(body));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/notion-upload") {
      const body = await readBody(request);
      sendJson(response, 200, await createNotionUpload(body));
      return;
    }

    if (request.method === "GET" && serveStatic(requestUrl.pathname, response)) {
      return;
    }

    sendError(response, 404, "Route not found.");
  } catch (error) {
    sendError(response, 500, error.message || "Unexpected server error.");
  }
});

server.listen(PORT, () => {
  console.log(`Peter's Lab Blog Writer server listening on http://localhost:${PORT}`);
});
