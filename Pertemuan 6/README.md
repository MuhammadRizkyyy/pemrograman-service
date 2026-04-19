# Tugas OAuth - GitHub & Facebook

Projek ini adalah implementasi OAuth menggunakan Node.js, Express, dan Passport.js untuk autentikasi melalui GitHub dan Facebook.

## Prasyarat

- Node.js terinstall di komputer Anda.
- Akun GitHub dan Facebook (Developer).

## Instalasi

1. Masuk ke direktori proyek:
   ```bash
   cd tugas-oauth
   ```
2. Install dependensi:
   ```bash
   npm install
   ```

## Konfigurasi OAuth

Anda perlu membuat aplikasi di platform developer masing-masing untuk mendapatkan Client ID dan Client Secret.

### 1. GitHub OAuth Setup
- Buka [GitHub Developer Settings](https://github.com/settings/developers).
- Pilih **New OAuth App**.
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/auth/github/callback`
- Copy **Client ID** dan **Client Secret** ke file `.env`.

### 2. Facebook OAuth Setup
- Buka [Facebook Developers](https://developers.facebook.com/).
- Buat aplikasi baru (tipe "Consumer" atau "None").
- Tambahkan produk **Facebook Login**.
- Di Settings Facebook Login, tambahkan Valid OAuth Redirect URIs: `http://localhost:3000/auth/facebook/callback`.
- Copy **App ID** dan **App Secret** dari Dashboard ke file `.env`.

## Menjalankan Aplikasi

1. Isi file `.env` dengan kredensial yang Anda dapatkan:
   ```env
   PORT=3000
   SESSION_SECRET=bebas_apa_saja
   
   GITHUB_CLIENT_ID=your_id
   GITHUB_CLIENT_SECRET=your_secret
   GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
   
   FACEBOOK_APP_ID=your_id
   FACEBOOK_APP_SECRET=your_secret
   FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback
   ```

2. Jalankan server:
   ```bash
   node index.js
   ```

3. Buka browser dan akses `http://localhost:3000`.

## Struktur File
- `index.js`: Logika utama server, konfigurasi Passport, dan routing.
- `.env`: File konfigurasi sensitif (ID & Secret).
- `package.json`: Daftar dependensi.