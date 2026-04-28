<?php

namespace App\Models;

use PDO;

class Post
{
    private PDO $db;
    private string $table = 'posts';

    // Các thuộc tính cơ bản ánh xạ với Database
    public ?int $id = null;
    public ?int $user_id = null;
    public ?string $title = null;
    public ?string $content = null;
    public ?string $created_at = null;
    public ?string $updated_at = null;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Tìm kiếm và phân trang
     */
    public function findWithFilters(string $title = '', int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $search = "%$title%";

        $query = "SELECT id, user_id, title, content, created_at, updated_at 
                  FROM " . $this->table . " 
                  WHERE title LIKE :title 
                  ORDER BY created_at DESC 
                  LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':title', $search);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $posts = [];
        while ($row = $stmt->fetch()) {
            $posts[] = $this->mapDataToModel($row);
        }
        return $posts;
    }

    /**
     * Đếm tổng số bản ghi khớp với điều kiện tìm kiếm
     */
    public function countWithFilters(string $title = ''): int
    {
        $search = "%$title%";
        $query = "SELECT COUNT(*) FROM " . $this->table . " WHERE title LIKE :title";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':title' => $search]);
        return (int)$stmt->fetchColumn();
    }


    /**
     * Lấy danh sách tất cả bài đăng 
     */
    public function findAll(): array
    {
        $query = "SELECT id, user_id, title, content, created_at, updated_at FROM " . $this->table . " ORDER BY created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();

        $posts = [];
        while ($row = $stmt->fetch()) {
            $posts[] = $this->mapDataToModel($row);
        }
        return $posts;
    }

    /**
     * Lấy chi tiết 1 bài đăng theo ID
     */
    public function findById(int $id): ?self
    {
        $query = "SELECT id, user_id, title, content, created_at, updated_at FROM " . $this->table . " WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);

        $row = $stmt->fetch();
        if (!$row) return null;

        return $this->mapDataToModel($row);
    }

    /**
     * Tạo bài đăng mới
     */
    public function create(int $userId, string $title, string $content): bool
    {
        $query = "INSERT INTO " . $this->table . " (user_id, title, content) VALUES (:user_id, :title, :content)";
        $stmt = $this->db->prepare($query);

        return $stmt->execute([
            ':user_id' => $userId,
            ':title' => $title,
            ':content' => $content
        ]);
    }

    /**
     * Cập nhật bài đăng
     */
    public function update(int $id, string $title, string $content): bool
    {
        $query = "UPDATE " . $this->table . " SET title = :title, content = :content WHERE id = :id";
        $stmt = $this->db->prepare($query);

        return $stmt->execute([
            ':title' => $title,
            ':content' => $content,
            ':id' => $id
        ]);
    }

    /**
     * Xóa bài đăng
     */
    public function delete(int $id): bool
    {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->db->prepare($query);

        return $stmt->execute([':id' => $id]);
    }

    /**
     * Helper: Mapping dữ liệu từ Array sang Đối tượng
     */
    private function mapDataToModel(array $data): self
    {
        $post = new self($this->db);
        $post->id = isset($data['id']) ? (int)$data['id'] : null;
        $post->user_id = isset($data['user_id']) ? (int)$data['user_id'] : null;
        $post->title = $data['title'] ?? null;
        $post->content = $data['content'] ?? null;
        $post->created_at = $data['created_at'] ?? null;
        $post->updated_at = $data['updated_at'] ?? null;
        return $post;
    }
}
