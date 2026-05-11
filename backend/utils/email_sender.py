import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from core.config import config
from utils.logger import logger


# ==========================================
# Check Email Configuration
# ==========================================
EMAIL_CONFIGURED = bool(
    config.EMAIL_USERNAME and config.EMAIL_PASSWORD
)


class EmailSender:
    def __init__(self):

        if EMAIL_CONFIGURED:
            self.smtp_host = config.EMAIL_HOST
            self.smtp_port = config.EMAIL_PORT
            self.username = config.EMAIL_USERNAME

            # Remove spaces from app password if present
            self.password = (
                config.EMAIL_PASSWORD.replace(" ", "")
                if config.EMAIL_PASSWORD
                else ""
            )

            self.from_email = (
                config.EMAIL_FROM or config.EMAIL_USERNAME
            )

            self.from_name = config.EMAIL_FROM_NAME

            logger.info("✅ Email service configured")

        else:
            self.smtp_host = None
            self.smtp_port = None
            self.username = None
            self.password = None
            self.from_email = None
            self.from_name = None

            logger.warning(
                "⚠️ Email not configured - email features disabled"
            )

    # ==========================================
    # Generate Reset Password HTML
    # ==========================================
    def get_reset_password_html(
        self,
        reset_link: str,
        username: str
    ) -> str:

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reset Your Password</title>

            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    background: #f5f5f5;
                    margin: 0;
                    padding: 0;
                }}

                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}

                .header {{
                    background: #4F46E5;
                    color: white;
                    padding: 25px;
                    text-align: center;
                }}

                .content {{
                    padding: 30px;
                }}

                .button {{
                    display: inline-block;
                    padding: 12px 24px;
                    background: #4F46E5;
                    color: white !important;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                }}

                .footer {{
                    text-align: center;
                    padding: 20px;
                    font-size: 12px;
                    color: #777;
                    background: #f9f9f9;
                }}
            </style>
        </head>

        <body>

            <div class="container">

                <div class="header">
                    <h1>Reset Your Password</h1>
                </div>

                <div class="content">

                    <p>Hello {username},</p>

                    <p>
                        We received a request to reset your password.
                        Click the button below to continue:
                    </p>

                    <div style="text-align:center; margin:30px 0;">
                        <a href="{reset_link}" class="button">
                            Reset Password
                        </a>
                    </div>

                    <p>
                        This password reset link will expire in
                        <strong>24 hours</strong>.
                    </p>

                    <p>
                        If you did not request a password reset,
                        please ignore this email.
                    </p>

                    <hr>

                    <p>
                        Best regards,<br>
                        <strong>StockAI Team</strong>
                    </p>

                </div>

                <div class="footer">
                    © 2026 StockAI Platform. All rights reserved.
                </div>

            </div>

        </body>
        </html>
        """

    # ==========================================
    # Test SMTP Connection
    # ==========================================
    def test_connection(self) -> bool:

        if not EMAIL_CONFIGURED:
            logger.warning(
                "⚠️ Email configuration missing"
            )
            return False

        try:
            with smtplib.SMTP(
                self.smtp_host,
                self.smtp_port
            ) as server:

                server.starttls()
                server.login(
                    self.username,
                    self.password
                )

                logger.info(
                    "✅ SMTP connection successful"
                )

                return True

        except Exception as e:
            logger.error(
                f"❌ SMTP connection failed: {str(e)}"
            )
            return False

    # ==========================================
    # Send Email
    # ==========================================
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str
    ) -> bool:

        # Email disabled mode
        if not EMAIL_CONFIGURED:
            logger.info(
                f"📧 Email would be sent to: {to_email}"
            )

            logger.info(f"📌 Subject: {subject}")

            return True

        try:
            # Create message
            msg = MIMEMultipart("alternative")

            msg["From"] = (
                f"{self.from_name} <{self.from_email}>"
            )

            msg["To"] = to_email
            msg["Subject"] = subject

            # Attach HTML content
            msg.attach(
                MIMEText(html_content, "html")
            )

            # Send email
            with smtplib.SMTP(
                self.smtp_host,
                self.smtp_port
            ) as server:

                server.starttls()

                server.login(
                    self.username,
                    self.password
                )

                server.send_message(msg)

            logger.info(
                f"✅ Email sent successfully to {to_email}"
            )

            return True

        except smtplib.SMTPAuthenticationError as e:

            logger.error(
                "❌ SMTP Authentication failed"
            )

            logger.error(str(e))

            logger.info(
                "💡 Use Gmail App Password instead of normal password"
            )

            return False

        except Exception as e:

            logger.error(
                f"❌ Failed to send email: {str(e)}"
            )

            return False

    # ==========================================
    # Send Password Reset Email
    # ==========================================
    def send_password_reset(
        self,
        to_email: str,
        token: str,
        username: str
    ) -> bool:

        reset_link = (
            f"http://localhost:5173/reset-password/{token}"
        )

        html_content = self.get_reset_password_html(
            reset_link,
            username
        )

        return self.send_email(
            to_email,
            "Reset Your StockAI Password",
            html_content
        )


# ==========================================
# Create Email Sender Instance
# ==========================================
email_sender = EmailSender()


# ==========================================
# Test Email Connection on Startup
# ==========================================
if EMAIL_CONFIGURED:
    email_sender.test_connection()