<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config/db.php';

try {
    $pdo = getConnection();
    $pdo->query("SELECT 1");
    $dbStatus = 'connected';
} catch (Exception $e) {
    $dbStatus = 'disconnected: ' . $e->getMessage();
}

echo json_encode([
    'service'   => 'Service B - Toko Sepatu (PHP Native)',
    'status'    => 'running',
    'version'   => '1.0.0',
    'database'  => $dbStatus,
    'endpoints' => [
        'GET    /api/sepatu.php'           => 'Ambil semua sepatu',
        'GET    /api/sepatu.php?id={id}'   => 'Ambil sepatu by ID',
        'POST   /api/sepatu.php'           => 'Tambah sepatu baru',
        'PUT    /api/sepatu.php?id={id}'   => 'Update sepatu',
        'DELETE /api/sepatu.php?id={id}'   => 'Hapus sepatu',
        'GET    /api/orders.php'           => 'Ambil semua orders',
        'GET    /api/orders.php?id={id}'   => 'Ambil order by ID',
        'POST   /api/orders.php'           => 'Buat order baru'
    ]
]);
