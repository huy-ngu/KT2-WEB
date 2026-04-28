<?php

namespace App\Controllers;

use App\Http\Response;

abstract class BaseController
{
    // Chứa các helper dùng chung cho mọi Controller
    protected function json(mixed $data, int $code = 200): Response
    {
        return Response::success($data, $code);
    }
}
