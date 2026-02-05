const verificationEmailTemplate = ({ name, verificationUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Langkah terakhir pendaftaran: Verifikasi email Anda untuk mengaktifkan akun Laci Digital.
  </div>
  <div style="background-color: #15803d; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Laci Digital</h1>
    <p style="color: #f0f0f0; margin: 10px 0 0 0;">PC IPNU IPPNU Magetan</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #15803d; margin-top: 0;">Verifikasi Email Anda</h2>
    <p>Halo <strong>${name}</strong>,</p>
    <p>Terima kasih telah mendaftar di Laci Digital. Untuk melengkapi pendaftaran Anda, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background-color: #15803d; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Verifikasi Email
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">Atau salin dan tempel link berikut di browser Anda:</p>
    <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #15803d;">
      ${verificationUrl}
    </p>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      <strong>Catatan:</strong> Link verifikasi ini akan kadaluarsa dalam 24 jam.
    </p>
    <p style="color: #666; font-size: 14px;">
      Jika Anda tidak mendaftar di Laci Digital, abaikan email ini.
    </p>
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 5px 0;">
        &copy; 2026 <strong style="color: #15803d;">Laci Digital</strong>. Semua hak dilindungi.
      </p>
      <p style="margin: 0 0 15px 0;">
        PC IPNU IPPNU Magetan | Jawa Timur, Indonesia
      </p>
    </div>
  </div>
</body>
</html>
`;

const verificationEmailText = ({ name, verificationUrl }) => `
Halo ${name},
Terima kasih telah mendaftar di Laci Digital. Verifikasi disini: ${verificationUrl}
`;

const pengajuanPACUserTemplate = (props) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengajuan Berhasil</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Alhamdulillah! Pengajuan PAC ${props.pacName} Anda telah berhasil dikirim.
  </div>
  <div style="background-color: #15803d; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Laci Digital</h1>
    <p style="color: #f0f0f0; margin: 10px 0 0 0;">PC IPNU IPPNU Magetan</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #15803d; margin-top: 0;">Pengajuan Telah Diterima</h2>
    <p>Halo <strong>${props.userName}</strong>,</p>
    <p>Terima kasih telah melakukan pengajuan data untuk <strong>${props.pacName}</strong> melalui sistem Laci Digital.</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">Ringkasan Pengajuan:</p>
      <p style="margin: 5px 0;"><strong>PAC:</strong> ${props.pacName}</p>
      <p style="margin: 5px 0;"><strong>Tanggal:</strong> ${props.submissionDate}</p>
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #d97706; font-weight: bold;">Menunggu Verifikasi</span></p>
    </div>
    <p>Tim admin PC IPNU IPPNU Magetan akan segera meninjau pengajuan Anda. Anda dapat memantau status pengajuan melalui dashboard.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${props.detailUrl}" style="background-color: #15803d; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Lihat Detail Pengajuan
      </a>
    </div>
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 5px 0;">
        &copy; 2026 <strong style="color: #15803d;">Laci Digital</strong>. Semua hak dilindungi.
      </p>
      <p style="margin: 0;">
        PC IPNU IPPNU Magetan | Jawa Timur, Indonesia
      </p>
      <div style="color: #ffffff; font-size: 1px; line-height: 1px; max-height: 0px; opacity: 0;">
        ${Date.now()}
      </div>
    </div>
  </div>
</body>
</html>
`;

const pengajuanPACAdminTemplate = (props) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notifikasi Pengajuan Baru</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Pemberitahuan: Ada pengajuan PAC baru dari ${props.pacName} yang memerlukan tindakan.
  </div>
  <div style="background-color: #1e293b; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Laci Digital Admin</h1>
    <p style="color: #cbd5e1; margin: 10px 0 0 0;">Notifikasi Sistem Pengajuan</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #0f172a; margin-top: 0;">Pengajuan Baru Perlu Ditinjau</h2>
    <p>Halo Admin,</p>
    <p>Sistem mendeteksi adanya pengajuan baru yang dikirimkan oleh user. Mohon segera lakukan tindak lanjut.</p>
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 14px; color: #64748b;">Informasi Pengajuan:</p>
      <p style="margin: 5px 0;"><strong>Pengaju:</strong> ${props.userName}</p>
      <p style="margin: 5px 0;"><strong>PAC:</strong> ${props.pacName}</p>
      <p style="margin: 5px 0;"><strong>Tanggal:</strong> ${props.submissionDate}</p>
    </div>
    <p>Silakan klik tombol di bawah ini untuk masuk ke panel admin dan meninjau berkas yang diajukan.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${props.detailUrl}" style="background-color: #0f172a; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Tinjau Pengajuan Sekarang
      </a>
    </div>
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">Email otomatis dari Sistem Laci Digital PC IPNU IPPNU Magetan</p>
      <div style="color: #ffffff; font-size: 1px; line-height: 1px; max-height: 0px; opacity: 0;">
        ${Date.now()}
      </div>
    </div>
  </div>
</body>
</html>
`;

const pengajuanPACUserText = (props) => `
Halo ${props.userName}, pengajuan PAC ${props.pacName} Anda telah berhasil dikirim pada ${props.submissionDate}.
`;

const pengajuanPACAdminText = (props) => `
Ada pengajuan baru dari ${props.userName} (PAC ${props.pacName}) pada ${props.submissionDate}. Segera lakukan peninjauan!
`;

const pengajuanPACStatusTemplate = (props) => {
  const isAccepted = props.status === "DITERIMA";
  const statusLabel = isAccepted ? "Diterima" : "Ditolak";
  const brandColor = isAccepted ? "#15803d" : "#ef4444";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update Status Pengajuan</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Update Status Pengajuan PAC ${props.pacName}: ${statusLabel}.
  </div>
  <div style="background-color: ${brandColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Laci Digital</h1>
    <p style="color: #f0f0f0; margin: 10px 0 0 0;">PC IPNU IPPNU Magetan</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: ${brandColor}; margin-top: 0;">Pengajuan Anda Telah ${statusLabel}</h2>
    <p>Halo <strong>${props.userName}</strong>,</p>
    <p>Kami ingin menginformasikan bahwa pengajuan PAC Anda untuk <strong>${props.pacName}</strong> telah selesai ditinjau oleh Sekretaris Cabang.</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">Informasi Pengajuan:</p>
      <p style="margin: 5px 0;"><strong>PAC:</strong> ${props.pacName}</p>
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${brandColor}; font-weight: bold;">${statusLabel}</span></p>
      ${
        !isAccepted && props.alasanPenolakan
          ? `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e5e7eb;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Alasan Penolakan:</p>
        <p style="margin: 5px 0; color: #ef4444;">${props.alasanPenolakan}</p>
      </div>
      `
          : ""
      }
    </div>
    <p>${
      isAccepted
        ? "Terima kasih atas kerja samanya. Pengajuan Anda telah resmi tercatat di sistem."
        : "Silakan lakukan revisi sesuai alasan di atas dan ajukan kembali jika diperlukan. Jika ada pertanyaan, silahkan hubungi Sekretaris Cabang."
    }</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${props.detailUrl}" style="background-color: ${brandColor}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Lihat Detail Di Dashboard
      </a>
    </div>
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 5px 0;">
        &copy; 2026 <strong style="color: #15803d;">Laci Digital</strong>. Semua hak dilindungi.
      </p>
      <p style="margin: 0;">
        PC IPNU IPPNU Magetan | Jawa Timur, Indonesia
      </p>
      <div style="color: #ffffff; font-size: 1px; line-height: 1px; max-height: 0px; opacity: 0;">
        ${Date.now()}
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

const pengajuanPACStatusText = (props) => {
  const isAccepted = props.status === "DITERIMA";
  const statusStr = isAccepted ? "DITERIMA" : "DITOLAK";
  const contactMsg = isAccepted
    ? ""
    : " Jika ada pertanyaan, silahkan hubungi Sekretaris Cabang.";
  return `Halo ${props.userName}, pengajuan PAC ${props.pacName} Anda telah ${statusStr}.${
    !isAccepted && props.alasanPenolakan ? " Alasan: " + props.alasanPenolakan : ""
  }${contactMsg}`;
};

module.exports = {
  verificationEmailTemplate,
  verificationEmailText,
  pengajuanPACUserTemplate,
  pengajuanPACAdminTemplate,
  pengajuanPACUserText,
  pengajuanPACAdminText,
  pengajuanPACStatusTemplate,
  pengajuanPACStatusText,
};
