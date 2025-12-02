<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SearchTestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test users for search functionality
        $testUsers = [
            [
                'id' => Str::uuid(),
                'first_name' => 'Maurice',
                'last_name' => 'Johnson',
                'email' => 'maurice.johnson@example.com',
                'phone' => '+1234567890',
                'password' => Hash::make('password'),
                'user_type' => 'user',
                'status' => 'active',
                'email_verified' => true,
                'admin_approved' => true,
            ],
            [
                'id' => Str::uuid(),
                'first_name' => 'Sarah',
                'last_name' => 'Wilson',
                'email' => 'sarah.wilson@example.com',
                'phone' => '+1234567891',
                'password' => Hash::make('password'),
                'user_type' => 'user',
                'status' => 'active',
                'email_verified' => true,
                'admin_approved' => true,
            ],
            [
                'id' => Str::uuid(),
                'first_name' => 'John',
                'last_name' => 'Smith',
                'email' => 'john.smith@example.com',
                'phone' => '+1234567892',
                'password' => Hash::make('password'),
                'user_type' => 'agent',
                'status' => 'active',
                'email_verified' => true,
                'admin_approved' => true,
            ],
        ];

        foreach ($testUsers as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        $this->command->info('Test users created successfully!');
    }
}
