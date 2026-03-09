const { loadMahasiswa, saveMahasiswa } = require("../utils/function");

const getMahasiswa = (req, res) => {
  const mhs = loadMahasiswa();
  res.json(mhs);
};

const addMahasiswa = (req, res) => {
  const mhs = loadMahasiswa();
  const newMhs = {
    id: Date.now(),
    nama: req.body.nama,
    prodi: req.body.prodi,
  };

  mhs.push(newMhs);
  saveMahasiswa(mhs);
  res.status(201).json(newMhs);
};

const updateMahasiswa = (req, res) => {
  const mhs = loadMahasiswa();
  const mhsId = parseInt(req.params.id);
  const mhsIndex = mhs.findIndex((mhs) => mhs.id === mhsId);

  if (mhsIndex !== -1) {
    mhs[mhsIndex].nama = req.body.nama;
    mhs[mhsIndex].prodi = req.body.prodi;
    saveMahasiswa(mhs);
    res.json(mhs[mhsIndex]);
  } else {
    res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
  }
};

const deleteMahasiswa = (req, res) => {
  const mhs = loadMahasiswa();
  const mhsId = parseInt(req.params.id);
  const updatedMhs = mhs.filter((mhs) => mhs.id !== mhsId);

  if (updatedMhs.length !== mhs.length) {
    saveMahasiswa(updatedMhs);
    res.json({ message: "Mahasiswa berhasil dihapus" });
  } else {
    res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
  }
};

module.exports = {
  getMahasiswa,
  addMahasiswa,
  updateMahasiswa,
  deleteMahasiswa,
};
