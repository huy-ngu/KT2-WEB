<?php

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;

interface ResourceControllerInterface
{
    public function index(Request $request): Response;
    public function show(Request $request, int $id): Response;
    public function store(Request $request): Response;
    public function update(Request $request, int $id): Response;
    public function destroy(Request $request, int $id): Response;
}
