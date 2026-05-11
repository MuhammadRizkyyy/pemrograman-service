<?php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 34502);
define('DB_USER', 'root');
define('DB_PASS', 'root123');
define('DB_NAME', 'toko_sepatu');

function getConnection() {
    $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'status'  => 500,
            'error'   => 'Database Connection Failed',
            'message' => 'Tidak dapat terhubung ke database: ' . $e->getMessage()
        ]);
        exit();
    }
}
