<?php

namespace App\Controllers;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\RequestInterface;

class Mahasiswa extends ResourceController
{
  protected $modelName = 'App\Models\MahasiswaModel';
  protected $format = 'json';
  use ResponseTrait;

  // Menampilkan semua data mahasiswa
  public function index() {
    return $this->respond([
    'statusCode' => 200,
    'message' => 'OK',
    'data' => $this->model->orderBy('nim', 'ASC')->findAll()
    ], 200);
  }

  // Menampilkan data mahasiswa berdasarkan NIM
  public function show($nim = null) {
    return $this->respond([
    'statusCode' => 200,
    'message' => 'Berhasil',
    'data' => $this->model->find($id)
    ], 200);
  }

  // Menambahkan data mahasiswa baru
  public function create() {
    if ($this->request){
    $data = $this->model->insert([
    'nim' => $this->request->getVar('nim'),
    'nama' => $this->request->getVar('nama'),
    'prodi' => $this->request->getVar('prodi')
    ]);
    }
    return $this->respond([
    'statusCode' => 201,
    'message' => 'Data Mahasiswa Berhasil Disimpan!',
    ], 201);
  }


  // Memperbarui data mahasiswa berdasarkan NIM
  public function update($nim = null) {

  }

  // Menghapus data mahasiswa berdasarkan NIM
  public function delete($nim = null) {

  }
}