const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;
const {
  getMahasiswa,
  addMahasiswa,
  updateMahasiswa,
  deleteMahasiswa,
} = require("./service/mhsService");

app.use(bodyParser.json());

app.get("/mahasiswa", getMahasiswa);
app.post("/mahasiswa", addMahasiswa);
app.put("/mahasiswa/:id", updateMahasiswa);
app.delete("/mahasiswa/:id", deleteMahasiswa);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
