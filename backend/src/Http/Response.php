<?php

namespace App\Http;

class Response
{
    private int $statusCode;
    private mixed $data;

    public function __construct(mixed $data, int $statusCode = 200)
    {
        $this->data = $data;
        $this->statusCode = $statusCode;
    }

    // Factory method cho thành công
    public static function success(mixed $data, int $code = 200): self
    {
        return new self($data, $code);
    }

    // Factory method cho lỗi
    public static function error(string $message, int $code = 400): self
    {
        return new self([
            "status" => "error",
            "message" => $message
        ], $code);
    }

    // Hàm thực thi gửi phản hồi về client
    public function send(): void
    {
        http_response_code($this->statusCode);
        echo json_encode($this->data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
