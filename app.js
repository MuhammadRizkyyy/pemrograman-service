const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const { port } = require("./config");

const app = express();
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
