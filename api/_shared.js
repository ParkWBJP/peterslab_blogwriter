const {
  createTrendResponse,
  createIdeaResponse,
  createDraftResponse,
  createNotionUpload,
  getHealthStatus,
} = require("../lib/peterslab-service");

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

function getJsonBody(request) {
  if (!request.body) {
    return {};
  }

  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      throw new Error("Request body must be valid JSON.");
    }
  }

  return request.body;
}

function methodNotAllowed(response) {
  sendError(response, 405, "Method not allowed.");
}

module.exports = {
  createTrendResponse,
  createIdeaResponse,
  createDraftResponse,
  createNotionUpload,
  getHealthStatus,
  sendJson,
  sendError,
  getJsonBody,
  methodNotAllowed,
};
