// payment-service/server.js
const app = require("./app.js");

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`✓ Payment Service running on http://localhost:${PORT}`);
  console.log(`✓ Test: curl http://localhost:${PORT}/health`);
});
