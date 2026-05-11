import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import config
from utils.logger import logger

class EmailSender:
    
    def __init__(self):
        self.smtp_host = config.EMAIL_HOST
        self.smtp_port = config.EMAIL_PORT
        self.username = config.EMAIL_USERNAME
        # Remove spaces from app password if present
        self.password = config.EMAIL_PASSWORD.replace(" ", "") if config.EMAIL_PASSWORD else ""
        self.from_email = config.EMAIL_FROM or config.EMAIL_USERNAME
        self.from_name = config.EMAIL_FROM_NAME
    
    def get_reset_password_html(self, reset_link: str, username: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reset Your Password</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #4F46E5; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; background: #f9f9f9; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reset Your Password</h1>
                </div>
                <div class="content">
                    <p>Hello {username},</p>
                    <p>We received a request to reset your password. Click the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </div>
                    <p>This link expires in 24 hours.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr>
                    <p>Best regards,<br>StockAI Team</p>
                </div>
                <div class="footer">
                    <p>© 2024 StockAI Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def test_connection(self) -> bool:
        """Test SMTP connection"""
        try:
            if not self.username or not self.password:
                logger.warning("Email credentials not configured")
                return False
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                logger.info("✅ SMTP connection successful")
                return True
        except Exception as e:
            logger.error(f"❌ SMTP connection failed: {str(e)}")
            return False
    
    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email using SMTP"""
        
        # Check if credentials exist
        if not self.username or not self.password:
            logger.warning(f"Email not sent - Missing credentials. Would send to: {to_email}")
            logger.info(f"Subject: {subject}")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_content, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            logger.info(f"✅ Password reset email sent to: {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ Authentication failed. Please check EMAIL_USERNAME and EMAIL_PASSWORD in .env")
            logger.error(f"Error details: {str(e)}")
            logger.info("💡 Tip: Use App Password, not your regular Gmail password")
            return False
            
        except Exception as e:
            logger.error(f"❌ Email failed: {str(e)}")
            return False
    
    def send_password_reset(self, to_email: str, token: str, username: str) -> bool:
        """Send password reset email"""
        reset_link = f"http://localhost:5173/reset-password/{token}"
        html = self.get_reset_password_html(reset_link, username)
        return self.send_email(to_email, "Reset Your StockAI Password", html)

# Create instance
email_sender = EmailSender()

# Test connection on startup
email_sender.test_connection()