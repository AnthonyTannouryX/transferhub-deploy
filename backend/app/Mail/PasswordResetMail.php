<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $resetToken;

    public function __construct(User $user, string $resetToken)
    {
        $this->user = $user;
        $this->resetToken = $resetToken;
    }

    public function build()
    {
        $resetUrl = config('transferhub.frontend_url') . '/reset-password?token=' . $this->resetToken;

        return $this->from(config('mail.from.address'), config('mail.from.name'))
            ->subject('Password Reset - TransferHub')
            ->view('emails.password-reset')
            ->with([
                'user' => $this->user,
                'resetUrl' => $resetUrl,
                'resetToken' => $this->resetToken
            ]);
    }
}
