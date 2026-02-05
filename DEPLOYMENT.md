## Deploy ke VPS + PostgreSQL

### 1) Persiapan server
- Install Node.js 20+ dan PostgreSQL
- Buat database dan user

Contoh:

```bash
sudo -u postgres psql
CREATE USER laci_user WITH PASSWORD 'ganti_password';
CREATE DATABASE laci_db OWNER laci_user;
```

### 2) Konfigurasi environment
Salin `.env.example` menjadi `.env` lalu isi:

- DATABASE_URL
- ACCESS_TOKEN_SECRET
- REFRESH_TOKEN_SECRET
- APP_URL
- UPLOAD_DIR
- RESEND_API_KEY dan RESEND_FROM (jika pakai email)

### 3) Install dependency dan generate Prisma

```bash
npm install
npm run db:generate
```

### 4) Migrasi database dan seed

```bash
npm run db:migrate:deploy
npm run db:seed
```

### 5) Pastikan folder upload ada dan writable

```bash
sudo mkdir -p /var/www/be-laci/uploads
sudo chown -R $USER:$USER /var/www/be-laci/uploads
```

### 6) Jalankan aplikasi

```bash
npm start
```

### 7) (Opsional) Menjalankan dengan systemd

Buat `/etc/systemd/system/be-laci.service`:

```
[Unit]
Description=Be Laci API
After=network.target

[Service]
WorkingDirectory=/var/www/be-laci
ExecStart=/usr/bin/node /var/www/be-laci/src/index.js
Restart=always
User=www-data
EnvironmentFile=/var/www/be-laci/.env

[Install]
WantedBy=multi-user.target
```

Aktifkan:

```bash
sudo systemctl daemon-reload
sudo systemctl enable be-laci
sudo systemctl start be-laci
```
