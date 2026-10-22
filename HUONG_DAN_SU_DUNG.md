# HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG HỆ THỐNG TECHCARE PRO
## Website Quản Lý Bảo Hành & Hỗ Trợ Kỹ Thuật PC & Laptop

---

### 1. Giới thiệu tổng quan
Hệ thống quản lý dịch vụ bảo hành, tiếp nhận và hỗ trợ kỹ thuật chuyên sâu cho Laptop & Máy tính để bàn (PC), sử dụng công nghệ:
- **Frontend:** HTML5, CSS3 hiện đại, JavaScript ES6+, FontAwesome Icons, Chart.js, SheetJS (XLSX), Html5-QRCode.
- **Backend & Database:** **Firebase Firestore** (cơ sở dữ liệu đám mây thời gian thực) và **Firebase Authentication** (xác thực người dùng an toàn).
- **Phân hệ và Phân quyền độc lập:**
  - **Trang Quản trị viên (Admin):** Nằm tại `admin/dashboard.html`. Quản lý toàn bộ nhân sự, danh mục dịch vụ, kho vật tư, thống kê báo cáo và điều phối phiếu sửa chữa.
  - **Bàn làm việc Kỹ thuật viên (KTV):** Nằm tại `admin/ktv-workspace.html`. Xem danh sách máy được phân công, chẩn đoán lỗi, đề xuất linh kiện thay thế, tra cứu tồn kho (`warehouse.html`) và xem lịch trực (`schedules.html`).
  - **Khu vực Tiếp nhận & Bán hàng (Sale / CSKH):** Nằm tại `admin/sale-workspace.html`. Tra cứu tức thì linh kiện trong kho để tư vấn báo giá cho khách, tạo phiếu tiếp nhận máy mới (`tickets.html`) và tra cứu bảng giá dịch vụ (`services.html`).
  - **Khu vực Quản lý Kho vật tư (Thủ Kho):** Nằm tại `admin/inventory.html`. Quản lý tồn kho linh kiện thực tế, nhập kho, xuất kho tự động trừ tồn, cảnh báo linh kiện sắp hết, duyệt yêu cầu linh kiện đặc thù của KTV và xem thống kê vật tư (`reports.html`).
  - **Cổng Khách Hàng (User Portal):** Nằm tại `user/dashboard.html`. Chỉ tài khoản Khách hàng mới truy cập được: theo dõi tiến độ sửa chữa thời gian thực, duyệt/từ chối báo giá, đặt lịch hẹn mang máy và đánh giá chất lượng phục vụ.
  - **Đăng ký tài khoản công khai:** Khách hàng **chỉ có thể đăng ký tài khoản Khách hàng** tại trang `register.html`, vai trò luôn được hệ thống gán cố định là `khachhang`, hoàn toàn không thể tự ý đăng ký làm Admin hay Nhân viên.

---

### 2. Cấu hình Firebase (Bắt buộc 1 lần duy nhất)
Mở file [js/firebase-config.js](file:///js/firebase-config.js) và kiểm tra thông tin cấu hình Firebase:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

#### Các dịch vụ cần bật trên Firebase Console (https://console.firebase.google.com):
1. **Authentication:**
   - Vào menu **Authentication** &rarr; tab **Sign-in method** &rarr; Bật **Email/Password**.
2. **Firestore Database:**
   - Vào menu **Firestore Database** &rarr; Chọn **Create database** &rarr; Chọn chế độ **Start in test mode** (để đọc ghi dữ liệu thoải mái khi thử nghiệm).

---

### 3. Cấu trúc các trang theo từng Phân Hệ

#### A. Cổng Khách Vãng Lai & Đăng Nhập:
1. `index.html`: Trang đăng nhập hệ thống thông minh. Người dùng nhập email và mật khẩu, hệ thống tự động nhận diện vai trò và chuyển thẳng vào trang làm việc riêng biệt (Admin vào Dashboard, KTV vào Bàn làm việc KTV, Sale vào Tra cứu Bán hàng, Kho vào Quản lý Kho, Khách hàng vào Cổng Khách hàng).
2. `register.html`: Đăng ký tài khoản Khách hàng mới.
3. `forgot-password.html`: Khôi phục mật khẩu qua Email.
4. `services.html`: Xem bảng giá tham khảo dịch vụ sửa chữa và linh kiện PC/Laptop cho khách vãng lai.
5. `tracking.html`: Tra cứu tiến độ phiếu sửa chữa bằng Mã phiếu (Ticket ID) + Số điện thoại hoặc quét mã QR in trên phiếu biên nhận.

#### B. Phân Hệ Quản Trị & Nghiệp Vụ (`admin/`):
1. `admin/dashboard.html`: Tổng quan chỉ số tiếp nhận trong ngày, đang xử lý, chờ linh kiện, hoàn thành (dành cho Admin).
2. `admin/ktv-workspace.html`: Bàn làm việc chuyên dụng cho KTV - chẩn đoán, báo giá và cập nhật tiến độ máy của mình.
3. `admin/warehouse.html`: Tra cứu kho và gửi yêu cầu đặt linh kiện đặc thù cho KTV.
4. `admin/sale-workspace.html`: Không gian làm việc cho NV Tiếp nhận/Sale - tra cứu tồn kho thời gian thực, kịch bản tư vấn báo giá cho khách.
5. `admin/tickets.html`: Trung tâm tiếp nhận máy, tạo phiếu biên nhận, tra cứu lịch sử Serial/IMEI, check-in, phân công KTV và in hóa đơn.
6. `admin/services.html`: Quản lý danh mục Dịch vụ & Linh kiện (Thêm, Sửa, Xóa, Tìm kiếm).
7. `admin/employees.html`: Quản lý nhân sự, phân quyền vai trò (KTV, Sale, Kho, Thu ngân, Admin), khóa/mở khóa tài khoản, import từ Excel và nút tạo tài khoản mẫu nhanh.
8. `admin/schedules.html`: Quản lý Lịch làm việc và ca trực Sáng - Chiều - Tối của từng KTV theo tuần.
9. `admin/inventory.html`: Quản lý kho vật tư, nhập/xuất kho tự động trừ số lượng, cảnh báo mức tồn tối thiểu, duyệt yêu cầu linh kiện.
10. `admin/reports.html`: Báo cáo tỷ lệ tiếp nhận PC/Laptop, năng suất KPI hoàn thành của KTV, báo cáo doanh thu tài chính và xuất file Excel.

#### C. Phân Hệ Khách Hàng (`user/`):
1. `user/dashboard.html`: Tổng quan thiết bị, trạng thái sửa chữa, cảnh báo báo giá cần duyệt.
2. `user/profile.html`: Quản lý thông tin cá nhân và danh sách thiết bị PC/Laptop của khách.
3. `user/new-request.html`: Đặt lịch hẹn mang máy đến cửa hàng hoặc gửi yêu cầu sửa chữa.
4. `user/my-tickets.html`: Xem tiến độ thời gian thực, hủy lịch hẹn, **đồng ý hoặc từ chối báo giá sửa chữa của KTV**.
5. `user/history.html`: Tra cứu lịch sử sửa chữa và các linh kiện đã từng thay thế.
6. `user/notifications.html`: Hộp thư thông báo tức thời khi trạng thái phiếu thay đổi.
7. `user/reviews.html`: Đánh giá 1-5 sao và nhận xét chất lượng phục vụ sau khi nhận lại thiết bị.

---

### 4. Tài khoản Kiểm Thử Sẵn Có

| Vai trò | Email đăng nhập | Mật khẩu | Trang tự động chuyển vào |
|---------|-----------------|----------|--------------------------|
| **Quản trị viên (Master Admin)** | `admin@techcare.vn` | `admin123` | `admin/dashboard.html` |
| **Kỹ thuật viên (KTV)** | `ktv@techcare.vn` | `123456` | `admin/ktv-workspace.html` |
| **Sale / CSKH / Tiếp nhận** | `sale@techcare.vn` | `123456` | `admin/sale-workspace.html` |
| **Quản lý kho (Thủ Kho)** | `kho@techcare.vn` | `123456` | `admin/inventory.html` |
| **Khách hàng** | Đăng ký tại `register.html` | Mật khẩu tự tạo | `user/dashboard.html` |

> [!NOTE]
> Khi đăng nhập với tài khoản Admin, bạn có thể vào trang **Quản lý Nhân sự** (`admin/employees.html`) và nhấn nút **"Khởi tạo tài khoản mẫu (KTV, Sale, Kho)"** để tạo tự động toàn bộ các tài khoản mẫu trên nếu lần đầu chạy trên Database trống.

---

### 5. Cơ chế Bảo Vệ Phân Quyền (Anti-Role Jumping)
Hệ thống áp dụng cơ chế bảo vệ phân quyền 2 tầng:
1. **Zero-Flash Session Caching:** Lưu trữ thông tin vai trò vào session trình duyệt, nạp tức thì thông tin nhân viên, nhãn chức danh và menu tương ứng ngay khi bấm chuyển trang mà không bị chớp hay nhảy sang nhãn Admin.
2. **Page Authorization Guard:** Mỗi trang nghiệp vụ đều có danh sách vai trò được cấp phép (`allowedRoles`). Nếu một nhân viên (ví dụ Sale hoặc Kho) cố tình truy cập vào trang không thuộc quyền quản lý của mình (ví dụ trang Dashboard hoặc Nhân sự của Admin), hệ thống sẽ tự động ngăn chặn và điều hướng an toàn về đúng trang làm việc chính thức của nhân viên đó.
