<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Exception;

class AuthService
{
    private User $userModel;

    public function __construct(User $userModel)
    {
        $this->userModel = $userModel;
    }

    /**
     * Logic nghiệp vụ Đăng ký
     */
    public function registerUser(string $username, string $password): array
    {
        // 1. Kiểm tra tồn tại
        if ($this->userModel->exists($username)) {
            // Ném lỗi (Exception) với mã lỗi HTTP tương ứng
            throw new Exception("Username này đã có người sử dụng.", 409);
        }

        // 2. Băm mật khẩu
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        // 3. Lưu Database
        if (!$this->userModel->create($username, $hashedPassword)) {
            throw new Exception("Không thể tạo tài khoản lúc này. Lỗi hệ thống.", 500);
        }

        return ["username" => $username];
    }

    /**
     * Logic nghiệp vụ Đăng nhập & Tạo Token
     */
    public function loginUser(string $username, string $password): array
    {
        // 1. Tìm user
        $user = $this->userModel->findByUsername($username);

        // 2. Xác thực
        if (!$user || !password_verify($password, $user->password)) {
            throw new Exception("Tài khoản hoặc mật khẩu không chính xác.", 401);
        }

        // 3. Tạo Payload cho JWT
        $issuedAt = time();
        $expirationTime = $issuedAt + (int)$_ENV['JWT_EXPIRATION'];

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'sub' => $user->id,
            'data' => [
                'username' => $user->username,
                'role' => $user->role
            ]
        ];

        // 4. Ký Token
        $secretKey = $_ENV['JWT_SECRET'];
        $jwt = JWT::encode($payload, $secretKey, 'HS256');

        // 5. Trả về kết quả
        return [
            "access_token" => $jwt,
            "user" => [
                "username" => $user->username,
                "role" => $user->role
            ]
        ];
    }

    /**
     * Logic nghiệp vụ Đổi mật khẩu
     */
    public function changePassword(int $userId, string $oldPassword, string $newPassword): bool
    {
        // 1. Tìm user theo ID
        $user = $this->userModel->findByIdObject($userId);

        if (!$user) {
            throw new Exception("Người dùng không tồn tại.", 404);
        }

        // 2. Kiểm tra mật khẩu cũ
        if (!password_verify($oldPassword, $user->password)) {
            throw new Exception("Mật khẩu cũ không chính xác.", 400);
        }

        // 3. Băm mật khẩu mới
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

        // 4. Cập nhật DB
        if (!$this->userModel->updatePassword($userId, $hashedPassword)) {
            throw new Exception("Không thể cập nhật mật khẩu lúc này. Lỗi hệ thống.", 500);
        }

        return true;
    }
}
