<?php

namespace App\Models;

use PDO;

class User
{
    private PDO $db;
    private string $table = 'users';

    // Chỉ giữ lại 4 thuộc tính cốt lõi
    public ?int $id = null;
    public ?string $username = null;
    public ?string $password = null;
    public ?string $role = null;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Tìm người dùng theo Username
     */
    public function findByUsername(string $username): ?self
    {
        $query = "SELECT id, username, password, role FROM " . $this->table . " WHERE username = :username LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':username' => $username]);

        $row = $stmt->fetch();
        if (!$row) return null;

        return $this->mapDataToModel($row);
    }

    /**
     * Kiểm tra username đã tồn tại chưa
     */
    public function exists(string $username): bool
    {
        return $this->findByUsername($username) !== null;
    }

    /**
     * Tạo user mới
     */
    public function create(string $username, string $hashedPassword, string $role = 'user'): bool
    {
        $query = "INSERT INTO " . $this->table . " (username, password, role) 
                  VALUES (:username, :password, :role)";

        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            ':username' => $username,
            ':password' => $hashedPassword,
            ':role'     => $role
        ]);
    }

    /**
     * Helper: Chuyển đổi mảng từ DB thành đối tượng Model
     */
    private function mapDataToModel(array $data): self
    {
        $user = new self($this->db);
        $user->id = (int)$data['id'];
        $user->username = $data['username'];
        $user->password = $data['password'];
        $user->role = $data['role'];
        return $user;
    }
}
