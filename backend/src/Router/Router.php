<?php

namespace App\Router;

use App\Http\Request;
use App\Http\Response;

class Router
{
    private array $routes = [];

    // Nâng cấp: Cho phép nhận thêm mảng $middlewares
    public function get(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->routes['GET'][$path] = [
            'handler' => $handler,
            'middlewares' => $middlewares
        ];
    }

    public function post(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->routes['POST'][$path] = [
            'handler' => $handler,
            'middlewares' => $middlewares
        ];
    }

    public function dispatch(Request $request): void
    {
        $method = $request->getMethod();
        $uri = $request->getPath();

        if (isset($this->routes[$method])) {
            foreach ($this->routes[$method] as $routePath => $routeData) {
                // Đổi cấu trúc kiểu /posts/{id} thành Regex: \/posts\/([0-9]+)
                $pattern = preg_replace('/\{[a-zA-Z0-9_]+\}/', '([0-9]+)', $routePath);
                $pattern = "@^" . $pattern . "$@D";

                // Nếu URL khớp với Regex
                if (preg_match($pattern, $uri, $matches)) {
                    array_shift($matches); // Bỏ kết quả match toàn bộ chuỗi

                    $handler = $routeData['handler'];
                    $middlewares = $routeData['middlewares'];

                    $coreAction = function ($req) use ($handler, $matches) {
                        if (is_callable($handler)) {
                            return $handler($req, ...$matches);
                        }
                        $controller = new $handler[0]();
                        $action = $handler[1];
                        // Truyền Request và giải nén mảng $matches (chính là $id) vào tham số thứ 2
                        return $controller->$action($req, ...$matches);
                    };

                    $pipeline = array_reduce(
                        array_reverse($middlewares),
                        function ($nextLayer, $middlewareClass) {
                            return function ($req) use ($middlewareClass, $nextLayer) {
                                $middleware = new $middlewareClass();
                                return $middleware->handle($req, $nextLayer);
                            };
                        },
                        $coreAction
                    );

                    $response = $pipeline($request);

                    if ($response instanceof Response) {
                        $response->send();
                    }
                    return; // Chạy xong thì thoát luôn
                }
            }
        }

        Response::error("Endpoint not found: $method $uri", 404)->send();
    }

    // Nâng cấp: Thêm method PUT và DELETE vào Router class
    public function put(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->routes['PUT'][$path] = ['handler' => $handler, 'middlewares' => $middlewares];
    }

    public function delete(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->routes['DELETE'][$path] = ['handler' => $handler, 'middlewares' => $middlewares];
    }
}
