<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {

    case 'GET':
        $pdo = getConnection();

        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM sepatu WHERE id = ?");
            $stmt->execute([$id]);
            $sepatu = $stmt->fetch();

            if (!$sepatu) {
                http_response_code(404);
                echo json_encode(['status' => 404, 'error' => 'Not Found',
                    'message' => "Sepatu dengan ID $id tidak ditemukan"]);
            } else {
                $sepatu['harga'] = (float)$sepatu['harga'];
                $sepatu['stok']  = (int)$sepatu['stok'];
                echo json_encode(['status' => 200, 'message' => 'Data sepatu berhasil diambil', 'data' => $sepatu]);
            }
        } else {
            $stmt = $pdo->query("SELECT * FROM sepatu ORDER BY created_at DESC");
            $data = $stmt->fetchAll();
            foreach ($data as &$row) {
                $row['harga'] = (float)$row['harga'];
                $row['stok']  = (int)$row['stok'];
            }
            echo json_encode(['status' => 200, 'message' => 'Data sepatu berhasil diambil',
                'total' => count($data), 'data' => $data]);
        }
        break;

    case 'POST':
        $input    = json_decode(file_get_contents('php://input'), true);
        $required = ['nama', 'merek', 'ukuran', 'warna', 'harga', 'stok'];

        foreach ($required as $field) {
            if (!isset($input[$field]) || ($input[$field] === '' && $input[$field] !== 0)) {
                http_response_code(400);
                echo json_encode(['status' => 400, 'error' => 'Bad Request',
                    'message' => "Field '$field' wajib diisi"]);
                exit();
            }
        }

        $pdo  = getConnection();
        $stmt = $pdo->prepare(
            "INSERT INTO sepatu (nama, merek, ukuran, warna, harga, stok, deskripsi, gambar_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            trim($input['nama']),
            trim($input['merek']),
            trim($input['ukuran']),
            trim($input['warna']),
            (float)$input['harga'],
            (int)$input['stok'],
            isset($input['deskripsi']) ? trim($input['deskripsi']) : '',
            isset($input['gambar_url']) ? trim($input['gambar_url']) : ''
        ]);

        http_response_code(201);
        echo json_encode([
            'status'  => 201,
            'message' => 'Sepatu berhasil ditambahkan',
            'data'    => [
                'id'     => (int)$pdo->lastInsertId(),
                'nama'   => trim($input['nama']),
                'merek'  => trim($input['merek']),
                'ukuran' => trim($input['ukuran']),
                'warna'  => trim($input['warna']),
                'harga'  => (float)$input['harga'],
                'stok'   => (int)$input['stok']
            ]
        ]);
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['status' => 400, 'error' => 'Bad Request',
                'message' => 'Parameter ID wajib disertakan untuk update']);
            exit();
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $pdo   = getConnection();

        $check = $pdo->prepare("SELECT id FROM sepatu WHERE id = ?");
        $check->execute([$id]);
        if (!$check->fetch()) {
            http_response_code(404);
            echo json_encode(['status' => 404, 'error' => 'Not Found',
                'message' => "Sepatu dengan ID $id tidak ditemukan"]);
            exit();
        }

        $fields = [];
        $values = [];

        if (isset($input['nama']))       { $fields[] = 'nama = ?';       $values[] = trim($input['nama']); }
        if (isset($input['merek']))      { $fields[] = 'merek = ?';      $values[] = trim($input['merek']); }
        if (isset($input['ukuran']))     { $fields[] = 'ukuran = ?';     $values[] = trim($input['ukuran']); }
        if (isset($input['warna']))      { $fields[] = 'warna = ?';      $values[] = trim($input['warna']); }
        if (isset($input['harga']))      { $fields[] = 'harga = ?';      $values[] = (float)$input['harga']; }
        if (isset($input['stok']))       { $fields[] = 'stok = ?';       $values[] = (int)$input['stok']; }
        if (isset($input['deskripsi']))  { $fields[] = 'deskripsi = ?';  $values[] = trim($input['deskripsi']); }
        if (isset($input['gambar_url'])) { $fields[] = 'gambar_url = ?'; $values[] = trim($input['gambar_url']); }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['status' => 400, 'error' => 'Bad Request',
                'message' => 'Tidak ada field yang diupdate']);
            exit();
        }

        $values[] = $id;
        $stmt = $pdo->prepare("UPDATE sepatu SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($values);

        echo json_encode(['status' => 200, 'message' => "Sepatu ID $id berhasil diupdate"]);
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['status' => 400, 'error' => 'Bad Request',
                'message' => 'Parameter ID wajib disertakan untuk hapus']);
            exit();
        }

        $pdo = getConnection();

        $check = $pdo->prepare("SELECT id FROM sepatu WHERE id = ?");
        $check->execute([$id]);
        if (!$check->fetch()) {
            http_response_code(404);
            echo json_encode(['status' => 404, 'error' => 'Not Found',
                'message' => "Sepatu dengan ID $id tidak ditemukan"]);
            exit();
        }

        $orderCheck = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE sepatu_id = ?");
        $orderCheck->execute([$id]);
        $total = (int)$orderCheck->fetchColumn();

        if ($total > 0) {
            http_response_code(409);
            echo json_encode(['status' => 409, 'error' => 'Conflict',
                'message' => "Sepatu tidak dapat dihapus karena masih memiliki $total pesanan terkait"]);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM sepatu WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['status' => 200, 'message' => "Sepatu ID $id berhasil dihapus"]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 405, 'error' => 'Method Not Allowed',
            'message' => "Method $method tidak didukung"]);
        break;
}
