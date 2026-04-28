<?php

namespace App\Middleware;

use App\Http\Request;
use App\Http\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class AuthMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): Response
    {
        // 1. Lấy Header Authorization từ Server
        // PHP tự động chuyển header 'Authorization' thành 'HTTP_AUTHORIZATION' trong $_SERVER
        $authHeader = $request->server['HTTP_AUTHORIZATION'] ?? '';

        // 2. Kiểm tra định dạng "Bearer <token>"
        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return Response::error("Không tìm thấy Token xác thực hoặc sai định dạng.", 401);
        }

        $token = $matches[1];

        // 3. Giải mã và xác thực Token
        try {
            $secretKey = $_ENV['JWT_SECRET'];

            // Sử dụng class Key của thư viện JWT (Bắt buộc từ version 6.x trở lên)
            $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));

            // 4. Bơm (Inject) thông tin User vào Request
            // Nhờ bước này, các Controller phía sau sẽ biết được AI đang gọi API
            $request->user = $decoded->data;
            $request->userId = $decoded->sub;

            // 5. Mọi thứ hợp lệ -> Cho phép đi qua cổng để đến Controller
            return $next($request);
        } catch (\Firebase\JWT\ExpiredException $e) {
            return Response::error("Token đã hết hạn. Vui lòng đăng nhập lại.", 401);
        } catch (Exception $e) {
            return Response::error("Token không hợp lệ.", 401);
        }
    }
}
