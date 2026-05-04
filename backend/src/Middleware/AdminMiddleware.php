<?php

namespace App\Middleware;

use App\Http\Request;
use App\Http\Response;

class AdminMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): Response
    {
        $role = $request->user->role ?? null;

        if ($role !== 'admin') {
            return Response::error("Bạn không có quyền truy cập vào tài nguyên này.", 403);
        }

        return $next($request);
    }
}
