<?php

namespace App\Services;

use App\Models\User;
use Exception;

class UserService
{
    private User $userModel;

    public function __construct(User $userModel)
    {
        $this->userModel = $userModel;
    }

    public function getProfile(int $userId): array
    {
        if ($userId <= 0) {
            throw new Exception("Token không hợp lệ.", 401);
        }

        $user = $this->userModel->findById($userId);
        if (!$user) {
            throw new Exception("Không tìm thấy user.", 404);
        }

        return [
            "id" => (int)$user["id"],
            "username" => $user["username"],
            "role" => $user["role"]
        ];
    }

    public function getFilteredUsers(string $search = '', string $role = '', int $page = 1, int $limit = 10): array
    {
        $users = $this->userModel->findWithFilters($search, $role, $page, $limit);
        $totalRecords = $this->userModel->countWithFilters($search, $role);
        $totalPages = (int)ceil($totalRecords / $limit);

        return [
            "data" => $users,
            "pagination" => [
                "total_records" => $totalRecords,
                "total_pages" => $totalPages,
                "current_page" => $page,
                "limit" => $limit
            ]
        ];
    }

    public function deleteUser(int $id): bool
    {
        $user = $this->userModel->findById($id);
        if (!$user) {
            throw new Exception("Không tìm thấy user.", 404);
        }

        if (!$this->userModel->delete($id)) {
            throw new Exception("Lỗi hệ thống khi xóa user.", 500);
        }

        return true;
    }
}
