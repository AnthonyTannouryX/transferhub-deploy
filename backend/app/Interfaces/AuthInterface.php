<?php

namespace App\Interfaces;

interface AuthInterface
{
    public function register(array $data): array;
    public function login(array $credentials): array;
    public function logout(): array;
    public function verifyEmail(string $token): array;
    public function resendVerificationEmail(string $email): array;
    public function forgotPassword(string $email): array;
    public function resetPassword(array $data): array;
    public function getPersonalUsers(array $filters = []): array;
    public function suspendUser(string $userId): array;
    public function unsuspendUser(string $userId): array;
}
