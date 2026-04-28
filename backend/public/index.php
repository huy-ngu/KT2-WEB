<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Http\Request;
use App\Http\Response;
use App\Router\Router;
use App\Config\Database;
use App\Controllers\AuthController;
use App\Middleware\AuthMiddleware;
use App\Controllers\PostController;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Cấu hình CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Bắt lỗi toàn cục
set_error_handler(function ($severity, $message, $file, $line) {
    throw new \ErrorException($message, 0, $severity, $file, $line);
});

// Sử dụng class Response mới để xử lý Exception
set_exception_handler(function (\Throwable $exception) {
    Response::error("Lỗi hệ thống: " . $exception->getMessage(), 500)->send();
});

// Khởi tạo Router
$router = new Router();

// Test Route bằng kiến trúc mới
$router->get('/ping', function (Request $request) {
    return Response::success(["message" => "Pong! Kiến trúc mới hoạt động cực kỳ trơn tru."]);
});

$router->get('/test-db', function (Request $request) {
    $db = new Database();
    $conn = $db->getConnection();
    return Response::success(["message" => "Kết nối CSDL thành công!"]);
});

// thêm route

$router->post('/register', [AuthController::class, 'register']);
$router->post('/login', [AuthController::class, 'login']);
$router->get('/me', function (Request $request) {
    return Response::success([
        "message" => "Chào mừng bạn đã truy cập vào khu vực bí mật!",
        "current_user" => $request->user
    ]);
}, [AuthMiddleware::class]);


// post
$router->get('/posts', [PostController::class, 'index']);
$router->get('/posts/{id}', [PostController::class, 'show']);
$router->post('/posts', [PostController::class, 'store'], [AuthMiddleware::class]);
$router->put('/posts/{id}', [PostController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/posts/{id}', [PostController::class, 'destroy'], [AuthMiddleware::class]);


// 1. Khởi tạo đối tượng Request (nó tự động lấy body, query, headers)
$request = new Request();


// 2. Giao Request cho Router xử lý
$router->dispatch($request);
