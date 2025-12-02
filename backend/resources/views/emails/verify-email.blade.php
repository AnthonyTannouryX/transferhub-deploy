<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify Your Email - TransferHub</title>
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
        .welcome-section {
            background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
            border: 1px solid #c3e6c3;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
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
        .security-notice {
            background-color: #e8f4fd;
            border: 1px solid #b3d9ff;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            color: #0066cc;
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
            <h2>Welcome! Verify Your Email Address</h2>
        </div>
        
        <div class="content">
            <p><strong>Hello {{ $user->first_name }},</strong></p>
            
            <div class="welcome-section">
                <h3 style="color: #2d5a2d; margin-bottom: 12px;">🎉 Welcome to TransferHub!</h3>
                <p style="margin: 0; color: #2d5a2d;">Thank you for joining our secure money transfer platform. We're excited to have you on board!</p>
            </div>
            
            <p>To complete your registration and start using TransferHub, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $verificationUrl }}" class="button" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">✅ Verify My Email Address</a>
            </div>
            
            <div class="expiry-notice">
                <strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.
            </div>
            
            <p><strong>Alternative Method:</strong> If the button above doesn't work, you can copy and paste the following link into your browser:</p>
            
            <div class="link-box">
                {{ $verificationUrl }}
            </div>
            
            <div class="security-notice">
                <strong>🔒 Security Notice:</strong> If you didn't create an account with TransferHub, please ignore this email. No further action is required.
            </div>
            
            <p><strong>What's Next?</strong> Once you verify your email, you'll be able to:</p>
            <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li>Access your TransferHub dashboard</li>
                <li>Send money securely to family and friends</li>
                <li>Track your transfer history</li>
                <li>Manage your account settings</li>
            </ul>
            
            <p>If you have any questions or need assistance, our support team is here to help!</p>
        </div>
        
        <div class="footer">
            <p><strong>TransferHub Team</strong></p>
            <p>© {{ date('Y') }} TransferHub. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 12px; color: #adb5bd;">
                This is an automated welcome email. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
