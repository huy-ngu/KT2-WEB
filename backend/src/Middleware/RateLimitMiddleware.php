<?php

namespace App\Middleware;

use App\Http\Request;
use App\Http\Response;

class RateLimitMiddleware implements MiddlewareInterface
{
    private int $maxAttempts;
    private int $windowSeconds;

    public function __construct(int $maxAttempts = 5, int $windowSeconds = 60)
    {
        $this->maxAttempts = $maxAttempts;
        $this->windowSeconds = $windowSeconds;
    }

    public function handle(Request $request, callable $next): Response
    {
        $ip = $request->server['REMOTE_ADDR'] ?? 'unknown';
        $path = $request->getPath();
        $key = md5($ip . '|' . $path);
        $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'kt2_rate_limit_' . $key . '.json';
        $now = time();

        $data = [
            'start' => $now,
            'count' => 0
        ];

        if (file_exists($file)) {
            $raw = file_get_contents($file);
            $decoded = json_decode($raw ?: '', true);
            if (is_array($decoded) && isset($decoded['start'], $decoded['count'])) {
                $data = $decoded;
            }
        }

        if (($now - (int)$data['start']) >= $this->windowSeconds) {
            $data = [
                'start' => $now,
                'count' => 0
            ];
        }

        $data['count']++;
        file_put_contents($file, json_encode($data));

        if ((int)$data['count'] > $this->maxAttempts) {
            return Response::error('Too many requests. Please try again later.', 429);
        }

        return $next($request);
    }
}
