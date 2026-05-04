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

    public function findWithFilters(string $search = '', int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $query = "SELECT id, username, role FROM " . $this->table;

        if ($search !== '') {
            $query .= " WHERE username LIKE :search OR role LIKE :search";
        }

        $query .= " ORDER BY id DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($query);

        if ($search !== '') {
            $stmt->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        $rows = $stmt->fetchAll();

        return $rows ?: [];
    }

    public function countWithFilters(string $search = ''): int
    {
        $query = "SELECT COUNT(*) as total FROM " . $this->table;

        if ($search !== '') {
            $query .= " WHERE username LIKE :search OR role LIKE :search";
        }

        $stmt = $this->db->prepare($query);

        if ($search !== '') {
            $stmt->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
        }

        $stmt->execute();
        $result = $stmt->fetch();

        return (int)($result['total'] ?? 0);
    }

    public function findById(int $id): ?array
    {
        $query = "SELECT id, username, role FROM " . $this->table . " WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function delete(int $id): bool
    {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([':id' => $id]);
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
