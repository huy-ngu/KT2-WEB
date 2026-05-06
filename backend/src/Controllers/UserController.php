<?php

namespace App\Controllers;

use App\Config\Database;
use App\Http\Request;
use App\Http\Response;
use App\Models\User;
use App\Services\UserService;
use Exception;

class UserController
{
    private UserService $userService;

    public function __construct()
    {
        $db = new Database();
        $this->userService = new UserService(new User($db->getConnection()));
    }

    // GET /users?search=&role=&page=&limit=
    public function index(Request $request): Response
    {
        try {
            $search = trim((string)($request->query['search'] ?? ''));
            $role = trim((string)($request->query['role'] ?? ''));
            $page = (int)($request->query['page'] ?? 1);
            $limit = (int)($request->query['limit'] ?? 10);

            $page = $page > 0 ? $page : 1;
            $limit = ($limit > 0 && $limit <= 100) ? $limit : 10;

            $result = $this->userService->getFilteredUsers($search, $role, $page, $limit);

            return Response::success($result);
        } catch (Exception $e) {
            $code = (int)$e->getCode();
            $code = $code > 0 ? $code : 500;
            return Response::error($e->getMessage(), $code);
        }
    }

    // DELETE /users/{id}
    public function destroy(Request $request, int $id): Response
    {
        try {
            $this->userService->deleteUser($id);
            return Response::success(["message" => "Xóa user thành công."]);
        } catch (Exception $e) {
            $code = (int)$e->getCode();
            $code = $code > 0 ? $code : 500;
            return Response::error($e->getMessage(), $code);
        }
    }
}


