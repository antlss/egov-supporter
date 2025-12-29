# Hướng dẫn cài đặt eGov XML Editor

## Yêu cầu hệ thống

- Node.js phiên bản 18 trở lên
- npm (đi kèm với Node.js) hoặc yarn
- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)

## Cài đặt Node.js

### macOS

**Cách 1: Sử dụng Homebrew (khuyến nghị)**

```bash
# Cài Homebrew nếu chưa có
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài Node.js
brew install node

# Kiểm tra phiên bản
node --version
npm --version
```

**Cách 2: Sử dụng nvm (Node Version Manager)**

```bash
# Cài nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Khởi động lại terminal, sau đó:
nvm install 20
nvm use 20
nvm alias default 20

# Kiểm tra
node --version
```

**Cách 3: Download trực tiếp**

1. Truy cập https://nodejs.org/
2. Tải bản "LTS" (Long Term Support)
3. Mở file .pkg và làm theo hướng dẫn

### Linux (Ubuntu/Debian)

```bash
# Cách 1: NodeSource repository (khuyến nghị)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cách 2: Sử dụng nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Kiểm tra
node --version
npm --version
```

### Windows

**Cách 1: Download trực tiếp**

1. Truy cập https://nodejs.org/
2. Tải bản "LTS" (Long Term Support)
3. Chạy file .msi và làm theo hướng dẫn
4. Khởi động lại terminal/command prompt

**Cách 2: Sử dụng Chocolatey**

```powershell
# Trong PowerShell với quyền Administrator
choco install nodejs-lts
```

**Cách 3: Sử dụng nvm-windows**

1. Tải nvm-windows từ: https://github.com/coreybutler/nvm-windows/releases
2. Cài đặt nvm-setup.exe
3. Mở Command Prompt hoặc PowerShell:

```cmd
nvm install 20
nvm use 20
```

## Cài đặt ứng dụng

### Bước 1: Mở terminal/command prompt

**macOS/Linux:**
- Mở Terminal

**Windows:**
- Mở Command Prompt hoặc PowerShell

### Bước 2: Di chuyển vào thư mục project

```bash
cd /Users/ponostech/Desktop/ssss
```

(Hoặc đường dẫn tương ứng trên hệ thống của bạn)

### Bước 3: Cài đặt dependencies

```bash
npm install
```

Quá trình này sẽ tải về tất cả các thư viện cần thiết (React, Vite, fflate, lucide-react, v.v.)

⏱️ **Thời gian:** Khoảng 1-3 phút tùy tốc độ mạng

### Bước 4: Chạy ứng dụng

```bash
npm run dev
```

Bạn sẽ thấy output như sau:

```
  VITE v6.0.5  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Bước 5: Mở trình duyệt

Mở trình duyệt và truy cập: **http://localhost:5173**

🎉 **Hoàn thành!** Ứng dụng đã sẵn sàng sử dụng.

## Dừng ứng dụng

Trong terminal đang chạy `npm run dev`, nhấn `Ctrl + C`

## Xử lý lỗi thường gặp

### Lỗi: "npm: command not found"

**Nguyên nhân:** Node.js chưa được cài đặt hoặc chưa có trong PATH

**Giải pháp:**
1. Cài đặt Node.js theo hướng dẫn ở trên
2. Khởi động lại terminal
3. Kiểm tra: `node --version`

### Lỗi: "Port 5173 đã được sử dụng"

**Giải pháp 1:** Đóng ứng dụng đang chạy ở port 5173

**Giải pháp 2:** Chạy với port khác:
```bash
npm run dev -- --port 3000
```

### Lỗi: "EACCES: permission denied"

**macOS/Linux:**
```bash
sudo chown -R $USER /Users/ponostech/Desktop/ssss/node_modules
```

Hoặc xóa node_modules và cài lại:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: "Module not found"

```bash
# Xóa và cài lại dependencies
rm -rf node_modules package-lock.json
npm install
```

## Build production

Để tạo bản build production:

```bash
npm run build
```

Kết quả sẽ được tạo trong thư mục `dist/`

Để xem preview bản build:

```bash
npm run preview
```

## Cập nhật ứng dụng

Khi có thay đổi trong code:

```bash
# Nếu có thêm dependencies mới
npm install

# Chạy lại dev server
npm run dev
```

## Gỡ cài đặt

Để gỡ hoàn toàn:

```bash
# Xóa dependencies
rm -rf node_modules package-lock.json

# Xóa build output
rm -rf dist
```

Để gỡ Node.js:

**macOS (Homebrew):**
```bash
brew uninstall node
```

**Linux:**
```bash
sudo apt-get remove nodejs
```

**Windows:**
- Vào Control Panel > Programs > Uninstall a program
- Tìm và gỡ Node.js

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra phiên bản Node.js: `node --version` (cần >= 18)
2. Kiểm tra console trong browser (F12) để xem lỗi
3. Xóa cache và cài lại dependencies

## Tài nguyên

- Node.js: https://nodejs.org/
- npm: https://www.npmjs.com/
- Vite: https://vitejs.dev/
- React: https://react.dev/
