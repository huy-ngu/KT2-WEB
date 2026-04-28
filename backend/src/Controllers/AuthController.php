<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\AuthService;
use App\Config\Database;
use App\Models\User;
use Exception;

class AuthController
{
    private AuthService $authService;

    public function __construct()
    {
        // Khởi tạo kết nối và bơm (inject) vào Service
        $db = new Database();
        $userModel = new User($db->getConnection());
        $this->authService = new AuthService($userModel);
    }

    /**
     * API: POST /register
     */
    public function register(Request $request): Response
    {
        try {
            $username = $request->input('username');
            $password = $request->input('password');

            if (empty($username) || empty($password)) {
                return Response::error("Vui lòng nhập đủ username và password.", 400);
            }

            $username = htmlspecialchars(strip_tags($username));
            $result = $this->authService->registerUser($username, $password);

            return Response::success([
                "message" => "Đăng ký tài khoản thành công!",
                "data" => $result
            ], 201);
        } catch (Exception $e) {
            // Bắt lỗi do Service ném ra và trả về cho Client
            $code = $e->getCode() !== 0 ? $e->getCode() : 500;
            return Response::error($e->getMessage(), $code);
        }
    }

    /**
     * API: POST /login
     */
    public function login(Request $request): Response
    {
        try {
            $username = $request->input('username');
            $password = $request->input('password');

            if (empty($username) || empty($password)) {
                return Response::error("Vui lòng nhập đủ username và password.", 400);
            }

            $result = $this->authService->loginUser($username, $password);

            return Response::success([
                "message" => "Đăng nhập thành công!",
                "data" => $result
            ], 200);
        } catch (Exception $e) {
            $code = $e->getCode() !== 0 ? $e->getCode() : 500;
            return Response::error($e->getMessage(), $code);
        }
    }
}
