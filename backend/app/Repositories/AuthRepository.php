<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\AgentStore;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthRepository
{
    public function createUser(array $data): User
    {
        return User::create([
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'phone' => $data['phone'],
            'user_type' => $data['user_type'],
            'status' => 'pending',
            'email_verified' => false,
            'admin_approved' => $data['user_type'] === 'agent' ? false : true,
            'subscription_status' => 'active',
        ]);
    }

    public function createAgentStore(array $data, string $userId): AgentStore
    {
        return AgentStore::create([
            'user_id' => $userId,
            'store_name' => $data['store_name'],
            'address' => $data['address'],
            'city' => $data['city'],
            'country' => $data['country'],
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'phone' => $data['store_phone'] ?? $data['phone'],
            'opening_hours' => $data['opening_hours'] ?? null,
            'status' => 'pending',
        ]);
    }

    public function findUserByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function findUserById(string $id): ?User
    {
        return User::find($id);
    }

    public function updateUser(User $user, array $data): bool
    {
        return $user->update($data);
    }

    public function verifyUserEmail(User $user): bool
    {
        return $user->update([
            'email_verified' => true,
            'status' => 'active'
        ]);
    }

    public function approveAgent(User $user): bool
    {
        return $user->update([
            'admin_approved' => true,
            'status' => 'active'
        ]);
    }

    public function getUserWithAgentStore(string $userId): ?User
    {
        return User::with('agentStores')->find($userId);
    }

    public function getPersonalUsers(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = User::where('user_type', 'personal');

        // Apply search filter
        if (isset($filters['search']) && !empty($filters['search'])) {
            $searchTerm = $filters['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('first_name', 'like', "%{$searchTerm}%")
                  ->orWhere('last_name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%")
                  ->orWhere('phone', 'like', "%{$searchTerm}%");
            });
        }

        // Apply status filter
        if (isset($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        // Apply verification filter
        if (isset($filters['verification']) && $filters['verification'] !== 'all') {
            if ($filters['verification'] === 'verified') {
                $query->where('email_verified', true);
            } elseif ($filters['verification'] === 'unverified') {
                $query->where('email_verified', false);
            }
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Paginate results
        $perPage = $filters['per_page'] ?? 20;
        return $query->paginate($perPage);
    }

    public function suspendUser(string $userId): bool
    {
        $user = User::find($userId);
        if (!$user) {
            return false;
        }
        
        return $user->update(['status' => 'suspended']);
    }

    public function unsuspendUser(string $userId): bool
    {
        $user = User::find($userId);
        if (!$user) {
            return false;
        }
        
        return $user->update(['status' => 'active']);
    }
}
