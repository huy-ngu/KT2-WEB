<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Services\PostService;
use App\Models\Post;
use App\Config\Database;
use Exception;

class PostController implements ResourceControllerInterface
{
    private PostService $postService;

    public function __construct()
    {
        $db = new Database();
        $this->postService = new PostService(new Post($db->getConnection()));
    }

    // 1. GET /posts
    public function index(Request $request): Response
    {
        try {
            // Lấy tham số từ query string, đặt giá trị mặc định nếu thiếu
            $title = $request->query['title'] ?? '';
            $page  = (int)($request->query['page'] ?? 1);
            $limit = (int)($request->query['limit'] ?? 10);

            // Đảm bảo page và limit luôn dương
            $page = $page > 0 ? $page : 1;
            $limit = ($limit > 0 && $limit <= 100) ? $limit : 10;

            $result = $this->postService->getFilteredPosts($title, $page, $limit);

            return Response::success($result);
        } catch (Exception $e) {
            return Response::error($e->getMessage(), 500);
        }
    }

    // 2. GET /posts/{id}
    public function show(Request $request, int $id): Response
    {
        try {
            $post = $this->postService->getPostById($id);
            return Response::success($post);
        } catch (Exception $e) {
            return Response::error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // 3. POST /posts (Yêu cầu đăng nhập)
    public function store(Request $request): Response
    {
        try {
            $title = $request->input('title');
            $content = $request->input('content');
            $userId = $request->userId; // Lấy từ AuthMiddleware

            if (empty($title) || empty($content)) {
                return Response::error("Tiêu đề và nội dung không được để trống.", 400);
            }

            $title = htmlspecialchars(strip_tags($title));
            $content = htmlspecialchars(strip_tags($content));

            $this->postService->createPost($userId, $title, $content);

            return Response::success(["message" => "Tạo bài đăng thành công!"], 201);
        } catch (Exception $e) {
            return Response::error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // 4. PUT /posts/{id} (Yêu cầu đăng nhập)
    public function update(Request $request, int $id): Response
    {
        try {
            $title = $request->input('title');
            $content = $request->input('content');
            $userId = $request->userId;

            if (empty($title) || empty($content)) {
                return Response::error("Tiêu đề và nội dung không được để trống.", 400);
            }

            $this->postService->updatePost($id, $userId, $title, $content);

            return Response::success(["message" => "Cập nhật thành công!"]);
        } catch (Exception $e) {
            return Response::error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    // 5. DELETE /posts/{id} (Yêu cầu đăng nhập)
    public function destroy(Request $request, int $id): Response
    {
        try {
            $userId = $request->userId;
            $this->postService->deletePost($id, $userId);

            return Response::success(["message" => "Xóa bài đăng thành công!"]);
        } catch (Exception $e) {
            return Response::error($e->getMessage(), $e->getCode() ?: 500);
        }
    }
}
