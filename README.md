# eGov XML Editor

Công cụ web để xử lý và chỉnh sửa file XML từ API eGov của chính phủ Nhật Bản.

## Tính năng

- **Decode & Unzip**: Tự động decode base64 và unzip file data từ API
- **Hiển thị danh sách files**: Xem tất cả files trong archive
- **XML Editor**:
  - Chế độ Form: Chỉnh sửa XML qua giao diện form thân thiện
  - Chế độ Code: Chỉnh sửa trực tiếp mã XML
- **Quản lý files**:
  - Xóa file không cần thiết
  - Upload thêm file mới
- **Encode & Zip**: Tự động zip và encode base64 để gửi lại API
- **Xử lý trên RAM**: Không lưu dữ liệu, tất cả xử lý tại client

## Cài đặt

### Yêu cầu

- Node.js 18+ (khuyến nghị sử dụng nvm)
- npm hoặc yarn

### Cài đặt Node.js (nếu chưa có)

**macOS:**
```bash
# Sử dụng Homebrew
brew install node

# Hoặc sử dụng nvm (khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Hoặc sử dụng nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Windows:**
- Tải và cài đặt từ https://nodejs.org/

### Cài đặt dependencies

```bash
npm install
```

## Chạy ứng dụng

### Development mode

```bash
npm run dev
```

Mở trình duyệt tại http://localhost:5173

### Build production

```bash
npm run build
npm run preview
```

## Hướng dẫn sử dụng

### 1. Load dữ liệu

**Cách 1: Sử dụng sample data**
- Click nút "Tải Sample" để load dữ liệu test từ file sample.md

**Cách 2: Paste dữ liệu thủ công**
- Copy chuỗi base64 từ API eGov
- Paste vào textarea "Input - Dữ liệu Base64"
- Click "Decode & Unzip"

### 2. Xem và chỉnh sửa files

- Danh sách files sẽ hiển thị ở panel giữa
- Click vào file XML để mở editor ở panel bên phải
- Chọn chế độ "Form" để chỉnh sửa dễ dàng hoặc "Code" để chỉnh sửa trực tiếp XML

### 3. Quản lý files

- **Xóa file**: Click icon thùng rác bên cạnh file
- **Thêm file**: Click "Chọn file để thêm" và chọn file từ máy tính

### 4. Export kết quả

- Click "Zip & Encode" ở panel trái
- Chuỗi base64 kết quả sẽ hiện ở textarea "Output"
- Click "Copy" để copy vào clipboard
- Sử dụng chuỗi này để gửi lại API eGov

## Cấu trúc thư mục

```
.
├── src/
│   ├── components/       # React components
│   │   ├── FileList.jsx      # Hiển thị danh sách files
│   │   ├── XMLEditor.jsx     # Editor cho file XML
│   │   └── InputPanel.jsx    # Panel input/output
│   ├── utils/
│   │   └── zipHandler.js # Xử lý zip/unzip và base64
│   ├── App.jsx          # Component chính
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── sample.md            # File sample data để test
├── index.html
├── vite.config.js
└── package.json
```

## Công nghệ sử dụng

- **React 18**: UI framework
- **Vite**: Build tool và dev server
- **fflate**: Thư viện zip/unzip nhanh và nhẹ
- **lucide-react**: Icon library
- **Native Web APIs**: Base64 encoding/decoding, XML parsing

## Lưu ý

- Ứng dụng hoàn toàn chạy trên client, không gửi dữ liệu đến server
- Dữ liệu chỉ tồn tại trong RAM, reload page sẽ mất
- File XML phải đúng format để parser có thể xử lý
- Hỗ trợ mọi loại file trong ZIP archive

## Troubleshooting

### Lỗi decode base64
- Đảm bảo chuỗi base64 không có ký tự thừa hoặc xuống dòng không mong muốn
- Chuỗi phải là base64 hợp lệ của một ZIP file

### Lỗi parse XML
- Kiểm tra file XML có đúng format không
- Sử dụng chế độ "Code" để xem và sửa trực tiếp

### File không hiển thị
- Kiểm tra console của browser để xem lỗi chi tiết
- Đảm bảo ZIP file chứa ít nhất một file (không phải chỉ thư mục trống)

## License

MIT
