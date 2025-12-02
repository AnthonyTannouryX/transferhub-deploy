<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New Agent Registration - TransferHub</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #f4f6f8;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        .header h2 {
            font-size: 18px;
            font-weight: 400;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .content p {
            margin-bottom: 16px;
            font-size: 16px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            margin: 24px 0;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: transform 0.2s ease;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .agent-info {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 24px;
            border-radius: 8px;
            margin: 24px 0;
            border-left: 4px solid #667eea;
        }
        .agent-info h3 {
            color: #495057;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .agent-info p {
            margin-bottom: 8px;
            font-size: 15px;
        }
        .agent-info strong {
            color: #495057;
            font-weight: 600;
        }
        .footer {
            background-color: #f8f9fa;
            text-align: center;
            padding: 30px;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
        }
        .urgent-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            color: #856404;
        }
        @media (max-width: 600px) {
            .email-container {
                margin: 0 10px;
            }
            .content, .header {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>TransferHub</h1>
            <h2>New Agent Registration Notification</h2>
        </div>
        
        <div class="content">
            <p><strong>Dear Administrator,</strong></p>
            
            <p>A new agent has successfully completed the registration process and email verification. Please review their application details below:</p>
            
            <div class="agent-info">
                <h3>📋 Agent Application Details</h3>
                <p><strong>Full Name:</strong> {{ $user->first_name }} {{ $user->last_name }}</p>
                <p><strong>Email Address:</strong> {{ $user->email }}</p>
                <p><strong>Phone Number:</strong> {{ $user->phone }}</p>
                <p><strong>Store Name:</strong> {{ $user->agentStores->first()->store_name ?? 'Not provided' }}</p>
                <p><strong>Store Address:</strong> {{ $user->agentStores->first()->address ?? 'Not provided' }}</p>
                <p><strong>City:</strong> {{ $user->agentStores->first()->city ?? 'Not provided' }}</p>
                <p><strong>Country:</strong> {{ $user->agentStores->first()->country ?? 'Not provided' }}</p>
            </div>
            
            <div class="urgent-notice">
                <strong>⚠️ Action Required:</strong> This agent cannot access their account until their application is reviewed and approved by an administrator.
            </div>
            
            <p>Please review the agent information thoroughly and take appropriate action:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $approvalUrl }}" class="button">Review & Approve Application</a>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li>Review the agent's store information and documentation</li>
                <li>Verify the legitimacy of the business</li>
                <li>Approve or reject the application based on your findings</li>
            </ul>
            
            <p>If you have any questions about this application, please contact our support team.</p>
        </div>
        
        <div class="footer">
            <p><strong>TransferHub Administration</strong></p>
            <p>© {{ date('Y') }} TransferHub. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 12px; color: #adb5bd;">
                This is an automated notification. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
