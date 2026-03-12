const { getHealthStatus, sendJson, methodNotAllowed } = require("./_shared");

module.exports = async (request, response) => {
  if (request.method !== "GET") {
    methodNotAllowed(response);
    return;
  }

  sendJson(response, 200, getHealthStatus());
};
