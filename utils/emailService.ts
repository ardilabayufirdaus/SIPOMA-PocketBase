import { pb } from './pocketbase';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Using PocketBase email service (assuming there's an email_queue collection)
      // This needs to be configured in PocketBase or use an external email service
      await pb.collection('email_queue').create({
        to: emailData.to,
        subject: emailData.subject,
        html_body: emailData.html,
        text_body: emailData.text || '',
        status: 'queued',
        created: new Date().toISOString(),
      });

      return true;
    } catch {
      // Error handling silently to prevent app crashes
      return false;
    }
  }

  async sendRegistrationRequestNotification(email: string, name: string): Promise<void> {
    const subject = 'Permintaan Registrasi SIPOMA - Menunggu Verifikasi';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Permintaan Registrasi Diterima</h2>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Terima kasih telah mengajukan permintaan registrasi untuk sistem SIPOMA.</p>
        <p>Permintaan Anda sedang dalam proses verifikasi oleh administrator. Anda akan menerima email konfirmasi dalam 1-2 hari kerja.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Detail Permintaan:</strong></p>
          <ul>
            <li>Email: ${email}</li>
            <li>Nama: ${name}</li>
            <li>Status: Menunggu Verifikasi</li>
          </ul>
        </div>
        <p>Jika Anda memiliki pertanyaan, silakan hubungi administrator sistem.</p>
        <p>Salam,<br/>Tim SIPOMA</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: `Permintaan registrasi Anda telah diterima. Status: Menunggu Verifikasi. Tim SIPOMA`,
    });
  }

  async sendRegistrationApprovalNotification(
    email: string,
    name: string,
    username: string
  ): Promise<void> {
    const subject = 'Registrasi SIPOMA - Disetujui';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Registrasi Disetujui!</h2>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Selamat! Permintaan registrasi Anda telah disetujui oleh administrator.</p>
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #059669;">
          <p><strong>Informasi Akun:</strong></p>
          <ul>
            <li>Username: ${username}</li>
            <li>Email: ${email}</li>
            <li>Status: Aktif</li>
          </ul>
        </div>
        <p>Anda sekarang dapat login ke sistem SIPOMA menggunakan username dan password yang telah ditentukan.</p>
        <p><a href="${process.env.VITE_APP_URL || 'https://sipoma-app.com'}/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Sekarang</a></p>
        <p>Salam,<br/>Tim SIPOMA</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: `Registrasi Anda telah disetujui. Username: ${username}. Silakan login ke sistem SIPOMA.`,
    });
  }

  async sendRegistrationRejectionNotification(
    email: string,
    name: string,
    reason?: string
  ): Promise<void> {
    const subject = 'Registrasi SIPOMA - Ditolak';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Registrasi Ditolak</h2>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Mohon maaf, permintaan registrasi Anda tidak dapat disetujui.</p>
        ${
          reason
            ? `
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p><strong>Alasan Penolakan:</strong></p>
          <p>${reason}</p>
        </div>
        `
            : ''
        }
        <p>Jika Anda memiliki pertanyaan atau ingin mengajukan permintaan ulang, silakan hubungi administrator sistem.</p>
        <p>Salam,<br/>Tim SIPOMA</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text: `Permintaan registrasi Anda telah ditolak. ${reason ? `Alasan: ${reason}` : ''} Silakan hubungi administrator untuk informasi lebih lanjut.`,
    });
  }

  async sendAdminNotification(newRequest: {
    email: string;
    name: string;
    id: string;
  }): Promise<void> {
    // In a real application, you'd get admin emails from a config or database
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@sipoma.com'];

    const subject = 'Permintaan Registrasi Baru - SIPOMA';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Permintaan Registrasi Baru</h2>
        <p>Ada permintaan registrasi baru yang memerlukan persetujuan Anda:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Detail Permintaan:</strong></p>
          <ul>
            <li>Email: ${newRequest.email}</li>
            <li>Nama: ${newRequest.name}</li>
            <li>ID Request: ${newRequest.id}</li>
          </ul>
        </div>
        <p><a href="${process.env.VITE_APP_URL || 'https://sipoma-app.com'}/admin/registration-requests" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Permintaan</a></p>
        <p>Salam,<br/>Sistem SIPOMA</p>
      </div>
    `;

    for (const adminEmail of adminEmails) {
      await this.sendEmail({
        to: adminEmail,
        subject,
        html,
        text: `Permintaan registrasi baru dari ${newRequest.name} (${newRequest.email}). Silakan review di admin panel.`,
      });
    }
  }
}

export const emailService = EmailService.getInstance();
