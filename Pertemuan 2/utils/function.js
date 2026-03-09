const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "mhs.json");

function loadMahasiswa() {
  const data = fs.readFileSync(dataPath);
  return JSON.parse(data);
}

function saveMahasiswa(mahasiswa) {
  fs.writeFileSync(dataPath, JSON.stringify(mahasiswa));
}

module.exports = { loadMahasiswa, saveMahasiswa };
