<?php

namespace App\Middleware;

use App\Http\Request;
use App\Http\Response;

interface MiddlewareInterface
{
    /**
     * @param Request $request Dữ liệu đầu vào
     * @param callable $next Hàm để gọi middleware tiếp theo (hoặc Controller)
     */
    public function handle(Request $request, callable $next): Response;
}
