<?php

namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private ?PDO $conn = null;

    public function getConnection(): PDO
    {
        // Nếu đã có kết nối rồi thì dùng lại, chưa có thì mới tạo
        if ($this->conn === null) {
            try {
                $dsn = "mysql:host=" . $_ENV['DB_HOST'] . ";port=" . $_ENV['DB_PORT'] . ";dbname=" . $_ENV['DB_NAME'] . ";charset=utf8mb4";

                // Các tùy chọn bảo mật và tối ưu cho PDO
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Ném lỗi văng ra ngoài để file index.php bắt
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Trả data về dạng mảng (Array)
                    PDO::ATTR_EMULATE_PREPARES => false, // Bắt buộc dùng Prepared Statement thực sự của MySQL (Chống SQL Injection)
                ];

                $this->conn = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS'], $options);
            } catch (PDOException $e) {
                // Tuyệt đối không echo lỗi PDO ra màn hình vì sẽ lộ thông tin DB.
                // Ném exception lên trên để Global Error Handler ở index.php bắt.
                throw new \Exception("Database connection failed: " . $e->getMessage());
            }
        }
        return $this->conn;
    }
}
