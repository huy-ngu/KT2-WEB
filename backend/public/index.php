<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Http\Request;
use App\Http\Response;
use App\Router\Router;
use App\Config\Database;
use App\Controllers\AuthController;
use App\Middleware\AuthMiddleware;
use App\Middleware\AdminMiddleware;
use App\Middleware\RateLimitMiddleware;
use App\Controllers\PostController;
use App\Controllers\UserController;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Cấu hình CORS
// header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
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

// xử lý Exception
set_exception_handler(function (\Throwable $exception) {
    Response::error("Lỗi hệ thống: " . $exception->getMessage(), 500)->send();
});

// Khởi tạo Router
$router = new Router();


// thêm route

//auth
$router->post('/register', [AuthController::class, 'register'], [RateLimitMiddleware::class]);
$router->post('/login', [AuthController::class, 'login'], [RateLimitMiddleware::class]);
$router->post('/logout', [AuthController::class, 'logout'], [AuthMiddleware::class]);
$router->put('/change-password', [AuthController::class, 'changePassword'], [AuthMiddleware::class]);
$router->get('/profile', [UserController::class, 'profile'], [AuthMiddleware::class]);


// post
$router->get('/posts', [PostController::class, 'index']);
$router->get('/posts/{id}', [PostController::class, 'show']);
$router->get('/mypost', [PostController::class, 'myPosts'], [AuthMiddleware::class]);
$router->post('/posts', [PostController::class, 'store'], [AuthMiddleware::class]);
$router->put('/posts/{id}', [PostController::class, 'update'], [AuthMiddleware::class]);
$router->delete('/posts/{id}', [PostController::class, 'destroy'], [AuthMiddleware::class]);

// user (role admin)
$router->get('/users', [UserController::class, 'index'], [AuthMiddleware::class, AdminMiddleware::class]);
$router->delete('/users/{id}', [UserController::class, 'destroy'], [AuthMiddleware::class, AdminMiddleware::class]);


// 1. Khởi tạo đối tượng Request (nó tự động lấy body, query, headers)
$request = new Request();


// 2. Giao Request cho Router xử lý
$router->dispatch($request);
