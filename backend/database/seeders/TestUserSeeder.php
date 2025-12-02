<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test user
        User::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('password'),
            'user_type' => 'personal',
            'status' => 'active',
            'email_verified' => true,
            'admin_approved' => true,
        ]);

        // Create another test user
        User::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@example.com',
            'password' => Hash::make('password'),
            'user_type' => 'personal',
            'status' => 'active',
            'email_verified' => true,
            'admin_approved' => true,
        ]);
    }
}