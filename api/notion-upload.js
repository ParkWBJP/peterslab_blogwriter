const { createNotionUpload, getJsonBody, sendJson, sendError, methodNotAllowed } = require("./_shared");

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    methodNotAllowed(response);
    return;
  }

  try {
    const body = getJsonBody(request);
    sendJson(response, 200, await createNotionUpload(body));
  } catch (error) {
    sendError(response, 500, error.message || "Unexpected server error.");
  }
};
