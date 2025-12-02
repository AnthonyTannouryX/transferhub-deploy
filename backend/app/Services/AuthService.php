<?php

namespace App\Services;

use App\Interfaces\AuthInterface;
use App\Repositories\AuthRepository;
use App\Services\SubscriptionService;
use App\Services\WalletService;
use App\Mail\EmailVerificationMail;
use App\Mail\AgentApprovalMail;
use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthService implements AuthInterface
{
    protected $authRepository;
    protected $subscriptionService;
    protected $walletService;

    public function __construct(AuthRepository $authRepository)
    {
        $this->authRepository = $authRepository;
        $this->subscriptionService = new SubscriptionService();
        $this->walletService = new WalletService(new \App\Repositories\WalletRepository());
    }

    public function register(array $data): array
    {
        try {
            DB::beginTransaction();

            // Check if email already exists
            if ($this->authRepository->findUserByEmail($data['email'])) {
                throw ValidationException::withMessages([
                    'email' => ['Email already registered.']
                ]);
            }

            // Create user
            $user = $this->authRepository->createUser($data);

            // If agent, create agent store
            if ($data['user_type'] === 'agent') {
                $this->authRepository->createAgentStore($data, $user->id);
            }

            // Create default USD wallet for all users
            $this->walletService->getOrCreateWallet($user, 'USD');

            // Assign free plan to personal users
            if ($data['user_type'] === 'personal') {
                $this->subscriptionService->assignFreePlan($user);
            }

            // Generate email verification token
            $verificationToken = Str::random(64);
            $user->update(['email_verification_token' => $verificationToken]);

            // Send verification email
            Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationToken));

            DB::commit();

            return [
                'success' => true,
                'message' => 'Registration successful. Please check your email for verification.',
                'user' => $user->only(['id', 'email', 'first_name', 'last_name', 'user_type', 'status'])
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function login(array $credentials): array
    {
        $user = $this->authRepository->findUserByEmail($credentials['email']);

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.']
            ]);
        }

        if (!$user->email_verified) {
            throw ValidationException::withMessages([
                'email' => ['Please verify your email before logging in.']
            ]);
        }

        if ($user->status === 'suspended') {
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended.']
            ]);
        }

        // For agents, check if admin approved
        if ($user->user_type === 'agent' && !$user->admin_approved) {
            throw ValidationException::withMessages([
                'email' => ['Your agent account is pending admin approval.']
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'success' => true,
            'message' => 'Login successful.',
            'token' => $token,
            'user' => $this->getUserData($user)
        ];
    }

    public function logout(): array
    {
        Auth::user()->currentAccessToken()->delete();

        return [
            'success' => true,
            'message' => 'Logout successful.'
        ];
    }

    public function verifyEmail(string $token): array
    {
        $user = User::where('email_verification_token', $token)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'token' => ['Invalid verification token.']
            ]);
        }

        if ($user->email_verified) {
            throw ValidationException::withMessages([
                'token' => ['Email already verified.']
            ]);
        }

        $this->authRepository->verifyUserEmail($user);

        // If agent, notify admin for approval
        if ($user->user_type === 'agent') {
            Mail::to(config('mail.from.address'))->send(new AgentApprovalMail($user));
        }

        return [
            'success' => true,
            'message' => 'Email verified successfully.'
        ];
    }

    public function resendVerificationEmail(string $email): array
    {
        $user = $this->authRepository->findUserByEmail($email);

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['User not found.']
            ]);
        }

        if ($user->email_verified) {
            throw ValidationException::withMessages([
                'email' => ['Email already verified.']
            ]);
        }

        $verificationToken = Str::random(64);
        $user->update(['email_verification_token' => $verificationToken]);

        Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationToken));

        return [
            'success' => true,
            'message' => 'Verification email sent successfully.'
        ];
    }

    public function forgotPassword(string $email): array
    {
        $user = $this->authRepository->findUserByEmail($email);

        if (!$user) {
            // Don't reveal if email exists or not
            return [
                'success' => true,
                'message' => 'If the email exists, a password reset link has been sent.'
            ];
        }

        $resetToken = Str::random(64);
        $user->update(['password_reset_token' => $resetToken]);

        Mail::to($user->email)->send(new PasswordResetMail($user, $resetToken));

        return [
            'success' => true,
            'message' => 'If the email exists, a password reset link has been sent.'
        ];
    }

    public function resetPassword(array $data): array
    {
        $user = User::where('password_reset_token', $data['token'])->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'token' => ['Invalid reset token.']
            ]);
        }

        $user->update([
            'password' => Hash::make($data['password']),
            'password_reset_token' => null
        ]);

        return [
            'success' => true,
            'message' => 'Password reset successfully.'
        ];
    }

    public function getPersonalUsers(array $filters = []): array
    {
        try {
            $users = $this->authRepository->getPersonalUsers($filters);
            
            // Get user statistics
            $totalUsers = \App\Models\User::where('user_type', 'personal')->count();
            $activeUsers = \App\Models\User::where('user_type', 'personal')->where('status', 'active')->count();
            $suspendedUsers = \App\Models\User::where('user_type', 'personal')->where('status', 'suspended')->count();
            $pendingUsers = \App\Models\User::where('user_type', 'personal')->where('status', 'pending')->count();
            $verifiedUsers = \App\Models\User::where('user_type', 'personal')->where('email_verified', true)->count();
            $unverifiedUsers = \App\Models\User::where('user_type', 'personal')->where('email_verified', false)->count();

            return [
                'success' => true,
                'users' => $users->items(),
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ],
                'statistics' => [
                    'total' => $totalUsers,
                    'active' => $activeUsers,
                    'suspended' => $suspendedUsers,
                    'pending' => $pendingUsers,
                    'verified' => $verifiedUsers,
                    'unverified' => $unverifiedUsers,
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch personal users',
                'error' => $e->getMessage()
            ];
        }
    }

    private function getUserData($user): array
    {
        $userData = $user->only(['id', 'email', 'first_name', 'last_name', 'user_type', 'status']);

        if ($user->user_type === 'agent') {
            $userData['agent_store'] = $user->agentStores()->first();
        }

        return $userData;
    }

    public function suspendUser(string $userId): array
    {
        try {
            $user = $this->authRepository->findUserById($userId);
            
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'User not found'
                ];
            }

            if ($user->user_type === 'admin') {
                return [
                    'success' => false,
                    'message' => 'Cannot suspend admin users'
                ];
            }

            if ($user->status === 'suspended') {
                return [
                    'success' => false,
                    'message' => 'User is already suspended'
                ];
            }

            $result = $this->authRepository->suspendUser($userId);

            if ($result) {
                return [
                    'success' => true,
                    'message' => 'User suspended successfully',
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'status' => 'suspended'
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to suspend user'
                ];
            }

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to suspend user: ' . $e->getMessage()
            ];
        }
    }

    public function unsuspendUser(string $userId): array
    {
        try {
            $user = $this->authRepository->findUserById($userId);
            
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'User not found'
                ];
            }

            if ($user->status !== 'suspended') {
                return [
                    'success' => false,
                    'message' => 'User is not suspended'
                ];
            }

            $result = $this->authRepository->unsuspendUser($userId);

            if ($result) {
                return [
                    'success' => true,
                    'message' => 'User unsuspended successfully',
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'status' => 'active'
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to unsuspend user'
                ];
            }

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to unsuspend user: ' . $e->getMessage()
            ];
        }
    }
}
