<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmailVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $verificationToken;

    public function __construct(User $user, string $verificationToken)
    {
        $this->user = $user;
        $this->verificationToken = $verificationToken;
    }

    public function build()
    {
        $frontendUrl = config('transferhub.frontend_url') ?: env('FRONTEND_URL', 'http://localhost:8080');
        $verificationUrl = $frontendUrl . '/verify-email?token=' . $this->verificationToken . '&email=' . urlencode($this->user->email);
        
        // Log the URL for debugging
        \Log::info('Email verification URL generated:', [
            'frontend_url' => $frontendUrl,
            'verification_url' => $verificationUrl,
            'user_email' => $this->user->email,
            'token' => $this->verificationToken
        ]);

        return $this->from(config('mail.from.address'), config('mail.from.name'))
            ->subject('Verify Your Email - TransferHub')
            ->view('emails.verify-email')
            ->with([
                'user' => $this->user,
                'verificationUrl' => $verificationUrl,
                'verificationToken' => $this->verificationToken
            ]);
    }
}
