<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AgentApprovalMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function build()
    {
        $approvalUrl = config('transferhub.admin_url') . '/admin/agents/' . $this->user->id . '/approve';

        return $this->from(config('mail.from.address'), config('mail.from.name'))
            ->subject('New Agent Registration - TransferHub')
            ->view('emails.agent-approval')
            ->with([
                'user' => $this->user,
                'approvalUrl' => $approvalUrl
            ]);
    }
}
