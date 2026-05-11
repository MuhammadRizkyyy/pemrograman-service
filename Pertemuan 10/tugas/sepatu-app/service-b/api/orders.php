<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
            $stmt = $pdo->prepare(
                "SELECT o.*, s.nama AS nama_sepatu, s.merek, s.ukuran, s.warna
                 FROM orders o
                 JOIN sepatu s ON o.sepatu_id = s.id
                 WHERE o.id = ?"
            );
            $stmt->execute([$id]);
            $order = $stmt->fetch();

            if (!$order) {
                http_response_code(404);
                echo json_encode(['status' => 404, 'error' => 'Not Found',
                    'message' => "Order dengan ID $id tidak ditemukan"]);
            } else {
                $order['total_harga'] = (float)$order['total_harga'];
                $order['jumlah']      = (int)$order['jumlah'];
                echo json_encode(['status' => 200, 'message' => 'Data order berhasil diambil', 'data' => $order]);
            }
        } else {
            $stmt = $pdo->query(
                "SELECT o.*, s.nama AS nama_sepatu, s.merek, s.ukuran, s.warna
                 FROM orders o
                 JOIN sepatu s ON o.sepatu_id = s.id
                 ORDER BY o.created_at DESC"
            );
            $data = $stmt->fetchAll();
            foreach ($data as &$row) {
                $row['total_harga'] = (float)$row['total_harga'];
                $row['jumlah']      = (int)$row['jumlah'];
            }
            echo json_encode(['status' => 200, 'message' => 'Data orders berhasil diambil',
                'total' => count($data), 'data' => $data]);
        }
        break;

    case 'POST':
        $input    = json_decode(file_get_contents('php://input'), true);
        $required = ['nama_pembeli', 'email_pembeli', 'alamat', 'sepatu_id', 'jumlah'];

        foreach ($required as $field) {
            if (empty($input[$field]) && $input[$field] !== 0) {
                http_response_code(400);
                echo json_encode(['status' => 400, 'error' => 'Bad Request',
                    'message' => "Field '$field' wajib diisi"]);
                exit();
            }
        }

        $pdo      = getConnection();
        $sepatuId = (int)$input['sepatu_id'];
        $jumlah   = (int)$input['jumlah'];

        $stmtSepatu = $pdo->prepare("SELECT id, nama, harga, stok FROM sepatu WHERE id = ?");
        $stmtSepatu->execute([$sepatuId]);
        $sepatu = $stmtSepatu->fetch();

        if (!$sepatu) {
            http_response_code(404);
            echo json_encode(['status' => 404, 'error' => 'Not Found',
                'message' => "Sepatu dengan ID $sepatuId tidak ditemukan"]);
            exit();
        }

        if ((int)$sepatu['stok'] < $jumlah) {
            http_response_code(400);
            echo json_encode(['status' => 400, 'error' => 'Bad Request',
                'message' => "Stok tidak mencukupi. Stok tersedia: {$sepatu['stok']}, diminta: $jumlah"]);
            exit();
        }

        $totalHarga = (float)$sepatu['harga'] * $jumlah;

        $pdo->beginTransaction();
        try {
            $stmtOrder = $pdo->prepare(
                "INSERT INTO orders (nama_pembeli, email_pembeli, telepon, alamat, sepatu_id, jumlah, total_harga, catatan)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmtOrder->execute([
                trim($input['nama_pembeli']),
                trim($input['email_pembeli']),
                isset($input['telepon']) ? trim($input['telepon']) : '',
                trim($input['alamat']),
                $sepatuId,
                $jumlah,
                $totalHarga,
                isset($input['catatan']) ? trim($input['catatan']) : ''
            ]);
            $newOrderId = (int)$pdo->lastInsertId();

            $stmtStok = $pdo->prepare("UPDATE sepatu SET stok = stok - ? WHERE id = ?");
            $stmtStok->execute([$jumlah, $sepatuId]);

            $pdo->commit();

            http_response_code(201);
            echo json_encode([
                'status'  => 201,
                'message' => 'Pesanan berhasil dibuat',
                'data'    => [
                    'order_id'     => $newOrderId,
                    'nama_pembeli' => trim($input['nama_pembeli']),
                    'sepatu'       => $sepatu['nama'],
                    'jumlah'       => $jumlah,
                    'total_harga'  => $totalHarga,
                    'status'       => 'pending'
                ]
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 500, 'error' => 'Internal Server Error',
                'message' => 'Gagal membuat pesanan: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 405, 'error' => 'Method Not Allowed',
            'message' => "Method $method tidak didukung"]);
        break;
}
