const express = require("express");
const app = express();

// Default route
app.get("/", (req, res) => {
  res.send("🚀 Hello, Express is running!");
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
