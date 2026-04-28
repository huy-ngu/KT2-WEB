<?php

namespace App\Services;

use App\Models\Post;
use Exception;

class PostService
{
    private Post $postModel;

    public function __construct(Post $postModel)
    {
        $this->postModel = $postModel;
    }

    public function getFilteredPosts(string $title = '', int $page = 1, int $limit = 10): array
    {
        $posts = $this->postModel->findWithFilters($title, $page, $limit);
        $totalRecords = $this->postModel->countWithFilters($title);
        $totalPages = ceil($totalRecords / $limit);

        return [
            "data" => $posts,
            "pagination" => [
                "total_records" => $totalRecords,
                "total_pages"   => (int)$totalPages,
                "current_page"  => $page,
                "limit"         => $limit
            ]
        ];
    }

    public function getAllPosts(): array
    {
        return $this->postModel->findAll();
    }

    public function getPostById(int $id)
    {
        $post = $this->postModel->findById($id);
        if (!$post) {
            throw new Exception("Không tìm thấy bài đăng.", 404);
        }
        return $post;
    }

    public function createPost(int $userId, string $title, string $content): bool
    {
        if (!$this->postModel->create($userId, $title, $content)) {
            throw new Exception("Lỗi hệ thống khi lưu bài đăng.", 500);
        }
        return true;
    }

    public function updatePost(int $id, int $userId, string $title, string $content): bool
    {
        // 1. Kiểm tra bài đăng có tồn tại không
        $post = $this->getPostById($id);

        // 2. CHỐT CHẶN BẢO MẬT: Kiểm tra quyền sở hữu
        if ($post->user_id !== $userId) {
            throw new Exception("Bạn không có quyền chỉnh sửa bài đăng này.", 403); // 403 Forbidden
        }

        // 3. Thực thi cập nhật
        if (!$this->postModel->update($id, $title, $content)) {
            throw new Exception("Lỗi hệ thống khi cập nhật.", 500);
        }
        return true;
    }

    public function deletePost(int $id, int $userId): bool
    {
        $post = $this->getPostById($id);

        if ($post->user_id !== $userId) {
            throw new Exception("Bạn không có quyền xóa bài đăng này.", 403);
        }

        if (!$this->postModel->delete($id)) {
            throw new Exception("Lỗi hệ thống khi xóa bài.", 500);
        }
        return true;
    }
}
