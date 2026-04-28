<?php

namespace App\Http;

class Request
{
    public array $body;
    public array $query;
    public array $server;

    public $user;
    public $userId;
    public function __construct()
    {
        // Tự động parse JSON body
        $input = file_get_contents('php://input');
        $this->body = json_decode($input, true) ?? [];
        $this->query = $_GET;
        $this->server = $_SERVER;
    }

    public function getMethod(): string
    {
        return $this->server['REQUEST_METHOD'] ?? 'GET';
    }

    public function getPath(): string
    {
        return parse_url($this->server['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    }

    public function input(string $key, $default = null)
    {
        return $this->body[$key] ?? $this->query[$key] ?? $default;
    }
}
