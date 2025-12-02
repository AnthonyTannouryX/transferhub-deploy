<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Password Reset - TransferHub</title>
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
        .security-notice {
            background-color: #e8f4fd;
            border: 1px solid #b3d9ff;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            color: #0066cc;
        }
        .link-box {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #495057;
        }
        .footer {
            background-color: #f8f9fa;
            text-align: center;
            padding: 30px;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
        }
        .expiry-notice {
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
            <h2>Password Reset Request</h2>
        </div>
        
        <div class="content">
            <p><strong>Hello {{ $user->first_name }},</strong></p>
            
            <p>We received a request to reset the password for your TransferHub account. If you made this request, please click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $resetUrl }}" class="button">🔐 Reset My Password</a>
            </div>
            
            <div class="expiry-notice">
                <strong>⏰ Important:</strong> This password reset link will expire in 1 hour for security reasons.
            </div>
            
            <p><strong>Alternative Method:</strong> If the button above doesn't work, you can copy and paste the following link into your browser:</p>
            
            <div class="link-box">
                {{ $resetUrl }}
            </div>
            
            <div class="security-notice">
                <strong>🔒 Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.
            </div>
            
            <p><strong>Need Help?</strong> If you're having trouble accessing your account or have any questions, please contact our support team.</p>
        </div>
        
        <div class="footer">
            <p><strong>TransferHub Security Team</strong></p>
            <p>© {{ date('Y') }} TransferHub. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 12px; color: #adb5bd;">
                This is an automated security notification. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
