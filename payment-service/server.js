// payment-service/server.js
const app = require("./app.js");

const PORT = process.env.PORT || 3004;

const server = app.listen(PORT, () => {
  console.log(`✓ Payment Service running on http://localhost:${PORT}`);
  console.log(`✓ Health: curl http://localhost:${PORT}/health`);
  console.log(`✓ Ready: curl http://localhost:${PORT}/ready`);
});

// Setup graceful shutdown
app.setupGracefulShutdown(server);

// Make server available if needed
module.exports = server;
