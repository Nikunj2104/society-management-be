import nodemailer from 'nodemailer';

/**
 * Sends an email using Nodemailer.
 * Falls back to a generated Ethereal test account if no SMTP credentials are provided.
 */
export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
    let transporter;

    // 1. Check if the user has provided real SMTP credentials (e.g. for Gmail or Zoho)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log(`📡 Using custom SMTP (${process.env.SMTP_HOST}) to send email...`);
    } else {
        // 2. Default: Use Ethereal Email (Infinite free testing, no verification needed)
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log(`📝 Using Ethereal Test Email (No real delivery, preview only)`);
        } catch (error) {
            console.error('❌ Error creating test account:', error);
            throw new Error('Failed to initialize email service');
        }
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Society Management" <noreply@societymanagement.com>',
            to,
            subject,
            text,
            html,
        });

        // If using Ethereal, log the preview link
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`✅ Email processed! View it here: ${previewUrl}`);
        } else {
            console.log(`✅ Real email sent via SMTP to ${to}`);
        }
    } catch (error: any) {
        console.error('❌ Email sending failed:', error.message);
        throw new Error('Email delivery failed: ' + error.message);
    }
};
