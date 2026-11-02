// ==========================================
// TechCare Pro - Smart Chatbot Assistant v2
// Per-user history + Dual mode: Customer / Staff
// ==========================================

(function () {
    'use strict';

    // ==========================================
    // 1. CSS INJECTION
    // ==========================================
    const CHATBOT_CSS = `
    .tcbot-fab {
        position: fixed;
        bottom: 80px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        color: #ffffff;
        font-size: 1.45rem;
        cursor: pointer;
        z-index: 9990;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: tcbot-fabPulse 3s infinite;
    }
    .tcbot-fab.mode-customer {
        background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
        box-shadow: 0 6px 20px rgba(2, 132, 199, 0.45);
    }
    .tcbot-fab.mode-staff {
        background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
        box-shadow: 0 6px 20px rgba(124, 58, 237, 0.45);
    }
    .tcbot-fab:hover { transform: scale(1.1); }
    .tcbot-fab.open { animation: none; transform: rotate(90deg) scale(1); }
    .tcbot-fab.open:hover { transform: rotate(90deg) scale(1.08); }
    @keyframes tcbot-fabPulse {
        0%, 100% { box-shadow: 0 6px 20px rgba(2, 132, 199, 0.45); }
        50% { box-shadow: 0 6px 28px rgba(2, 132, 199, 0.65), 0 0 0 8px rgba(14, 165, 233, 0.12); }
    }
    .tcbot-fab .fab-icon-close { display: none; }
    .tcbot-fab.open .fab-icon-chat { display: none; }
    .tcbot-fab.open .fab-icon-close { display: inline; }

    .tcbot-unread-badge {
        position: absolute; top: -4px; right: -4px;
        width: 22px; height: 22px; border-radius: 50%;
        background: #ef4444; color: #fff;
        font-size: 0.7rem; font-weight: 800;
        display: flex; align-items: center; justify-content: center;
        border: 2.5px solid var(--card-bg, #ffffff);
        box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
        animation: tcbot-badgeBounce 0.4s ease;
    }
    @keyframes tcbot-badgeBounce {
        0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); }
    }

    .tcbot-window {
        position: fixed; bottom: 148px; right: 24px;
        width: 400px; max-height: 560px;
        background: var(--card-bg, #ffffff);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 20px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
        z-index: 9991;
        display: flex; flex-direction: column; overflow: hidden;
        opacity: 0; visibility: hidden;
        transform: translateY(20px) scale(0.95);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .tcbot-window.open { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }

    .tcbot-header {
        color: #ffffff; padding: 16px 18px;
        display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    .tcbot-header.mode-customer { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); }
    .tcbot-header.mode-staff { background: linear-gradient(135deg, #1e1145 0%, #4c1d95 100%); }

    .tcbot-avatar {
        width: 42px; height: 42px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.2rem; flex-shrink: 0;
    }
    .tcbot-avatar.mode-customer { background: linear-gradient(135deg, #0ea5e9, #38bdf8); box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.3); }
    .tcbot-avatar.mode-staff { background: linear-gradient(135deg, #8b5cf6, #a78bfa); box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3); }

    .tcbot-header-info h4 { margin: 0; font-size: 1rem; font-weight: 700; color: #ffffff !important; }
    .tcbot-header-info small { color: #94a3b8; font-size: 0.78rem; display: flex; align-items: center; gap: 5px; }
    .tcbot-status-dot {
        width: 7px; height: 7px; border-radius: 50%; background: #22c55e; display: inline-block;
        animation: tcbot-statusPulse 2s infinite;
    }
    @keyframes tcbot-statusPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .tcbot-header-actions { margin-left: auto; display: flex; gap: 6px; }
    .tcbot-header-actions button {
        background: rgba(255,255,255,0.12); border: none; color: #cbd5e1;
        width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
    }
    .tcbot-header-actions button:hover { background: rgba(255,255,255,0.22); color: #ffffff; }

    .tcbot-user-bar {
        padding: 8px 18px; font-size: 0.76rem; font-weight: 600;
        border-bottom: 1px solid var(--border, #e2e8f0);
        display: flex; align-items: center; gap: 6px;
        background: var(--bg, #f8fafc); color: var(--text-light, #64748b);
    }
    .tcbot-user-bar i { font-size: 0.72rem; }

    .tcbot-messages {
        flex: 1; overflow-y: auto; padding: 18px 16px;
        display: flex; flex-direction: column; gap: 14px;
        background: var(--bg, #f8fafc); scrollbar-width: thin;
        scrollbar-color: var(--border, #e2e8f0) transparent;
    }
    .tcbot-messages::-webkit-scrollbar { width: 5px; }
    .tcbot-messages::-webkit-scrollbar-track { background: transparent; }
    .tcbot-messages::-webkit-scrollbar-thumb { background: var(--border, #e2e8f0); border-radius: 10px; }

    .tcbot-msg { display: flex; gap: 10px; max-width: 88%; animation: tcbot-msgIn 0.35s ease; }
    @keyframes tcbot-msgIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .tcbot-msg.bot { align-self: flex-start; }
    .tcbot-msg.user { align-self: flex-end; flex-direction: row-reverse; }
    .tcbot-msg-avatar {
        width: 30px; height: 30px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.75rem; color: #fff; flex-shrink: 0; margin-top: 2px;
    }
    .tcbot-msg.bot .tcbot-msg-avatar { background: linear-gradient(135deg, #0ea5e9, #38bdf8); }
    .tcbot-msg.user .tcbot-msg-avatar { background: linear-gradient(135deg, #6366f1, #818cf8); }
    .mode-staff .tcbot-msg.bot .tcbot-msg-avatar { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }

    .tcbot-bubble {
        padding: 12px 16px; border-radius: 16px; font-size: 0.9rem; line-height: 1.55;
        color: var(--text, #334155); word-wrap: break-word;
    }
    .tcbot-msg.bot .tcbot-bubble {
        background: var(--card-bg, #ffffff); border: 1px solid var(--border, #e2e8f0);
        border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .tcbot-msg.user .tcbot-bubble {
        background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
        color: #ffffff !important; border-bottom-right-radius: 4px;
        box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);
    }
    .tcbot-bubble strong { font-weight: 700; }
    .tcbot-bubble a { color: var(--accent, #0ea5e9); text-decoration: underline; font-weight: 600; }
    .tcbot-msg.user .tcbot-bubble a { color: #bae6fd; }

    .tcbot-quick-replies {
        display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px;
        padding-left: 40px; animation: tcbot-msgIn 0.4s ease;
    }
    .tcbot-qr-btn {
        padding: 7px 14px; border-radius: 18px;
        background: var(--card-bg, #ffffff); border: 1.5px solid var(--accent, #0ea5e9);
        color: var(--accent, #0ea5e9); font-size: 0.82rem; font-weight: 600;
        cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
    }
    .tcbot-qr-btn:hover {
        background: var(--accent, #0ea5e9); color: #ffffff;
        transform: translateY(-1px); box-shadow: 0 3px 10px rgba(14, 165, 233, 0.3);
    }
    .tcbot-qr-btn i { margin-right: 4px; font-size: 0.78rem; }
    .mode-staff .tcbot-qr-btn { border-color: #8b5cf6; color: #7c3aed; }
    .mode-staff .tcbot-qr-btn:hover { background: #7c3aed; color: #fff; box-shadow: 0 3px 10px rgba(124,58,237,0.3); }

    .tcbot-typing { display: flex; align-items: center; gap: 10px; animation: tcbot-msgIn 0.3s ease; }
    .tcbot-typing-dots {
        display: flex; gap: 4px; padding: 12px 18px;
        background: var(--card-bg, #ffffff); border: 1px solid var(--border, #e2e8f0);
        border-radius: 16px; border-bottom-left-radius: 4px;
    }
    .tcbot-typing-dots span {
        width: 7px; height: 7px; border-radius: 50%;
        background: var(--text-muted, #94a3b8); animation: tcbot-dotBounce 1.4s infinite;
    }
    .tcbot-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .tcbot-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes tcbot-dotBounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-6px); opacity: 1; }
    }

    .tcbot-input-area {
        padding: 12px 14px; border-top: 1px solid var(--border, #e2e8f0);
        background: var(--card-bg, #ffffff); display: flex; align-items: center; gap: 8px; flex-shrink: 0;
    }
    .tcbot-input {
        flex: 1; height: 42px; padding: 0 14px; border-radius: 21px;
        border: 1.5px solid var(--input-border, #e2e8f0);
        background: var(--input-bg, #f8fafc); color: var(--text, #334155);
        font-size: 0.9rem; font-family: inherit; transition: all 0.2s; outline: none;
    }
    .tcbot-input:focus { border-color: var(--accent, #0ea5e9); box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12); }
    .tcbot-input::placeholder { color: var(--text-muted, #94a3b8); }
    .tcbot-send-btn {
        width: 42px; height: 42px; border-radius: 50%; border: none; color: #fff;
        font-size: 1rem; cursor: pointer; display: flex; align-items: center;
        justify-content: center; transition: all 0.2s; flex-shrink: 0;
    }
    .tcbot-send-btn.mode-customer { background: linear-gradient(135deg, #0284c7, #0ea5e9); }
    .tcbot-send-btn.mode-staff { background: linear-gradient(135deg, #7c3aed, #8b5cf6); }
    .tcbot-send-btn:hover { transform: scale(1.08); }
    .tcbot-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .tcbot-result-card {
        margin-top: 10px; padding: 12px; border-radius: 10px;
        background: var(--bg, #f8fafc); border: 1px solid var(--border, #e2e8f0);
    }
    .tcbot-result-card .rc-title { font-weight: 700; font-size: 0.92rem; color: var(--accent, #0ea5e9); margin-bottom: 6px; }
    .tcbot-result-card .rc-row {
        display: flex; justify-content: space-between; font-size: 0.82rem; padding: 3px 0; color: var(--text, #334155);
    }
    .tcbot-result-card .rc-row .rc-label { color: var(--text-light, #64748b); }
    .tcbot-result-card .rc-row .rc-value { font-weight: 600; }
    .tcbot-result-card .rc-status {
        margin-top: 8px; padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-align: center;
    }

    .tcbot-svc-list { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
    .tcbot-svc-item {
        padding: 10px 12px; background: var(--bg, #f8fafc);
        border: 1px solid var(--border, #e2e8f0); border-radius: 10px;
        border-left: 3px solid var(--accent, #0ea5e9);
    }
    .tcbot-svc-item .svc-name { font-weight: 700; font-size: 0.86rem; color: var(--text-heading, #0f172a); margin-bottom: 3px; }
    .tcbot-svc-item .svc-price { font-weight: 800; font-size: 0.9rem; color: #0284c7; }
    [data-theme="dark"] .tcbot-svc-item .svc-price { color: #38bdf8; }
    .tcbot-svc-item .svc-meta { font-size: 0.76rem; color: var(--text-light, #64748b); margin-top: 2px; }

    .tcbot-diag-card {
        margin-top: 8px; padding: 12px 14px; border-radius: 10px;
        background: rgba(22, 163, 74, 0.08); border: 1px solid rgba(22, 163, 74, 0.2);
        border-left: 4px solid #16a34a;
    }
    .tcbot-diag-card h5 { margin: 0 0 6px 0; font-size: 0.88rem; color: #16a34a; font-weight: 700; }
    .tcbot-diag-card ul { margin: 0; padding-left: 18px; font-size: 0.84rem; color: var(--text, #334155); line-height: 1.6; }

    .tcbot-stat-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;
    }
    .tcbot-stat-box {
        padding: 10px 12px; border-radius: 10px; text-align: center;
        background: var(--bg, #f8fafc); border: 1px solid var(--border, #e2e8f0);
    }
    .tcbot-stat-box .stat-num { font-size: 1.3rem; font-weight: 800; color: var(--accent, #0ea5e9); }
    .tcbot-stat-box .stat-lbl { font-size: 0.72rem; color: var(--text-light, #64748b); font-weight: 600; margin-top: 2px; }

    @media (max-width: 480px) {
        .tcbot-window { right: 8px; left: 8px; bottom: 80px; width: auto; max-height: 75vh; border-radius: 16px; }
        .tcbot-fab { bottom: 20px; right: 18px; width: 50px; height: 50px; }
    }
    `;

    // ==========================================
    // 2. KNOWLEDGE BASES
    // ==========================================
    const STATUS_LABELS = {
        'cho_xu_ly': { text: 'Chờ xử lý', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        'dang_kiem_tra': { text: 'Đang kiểm tra', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
        'cho_bao_gia': { text: 'Chờ báo giá', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
        'dang_sua': { text: 'Đang sửa chữa', color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
        'cho_linh_kien': { text: 'Chờ linh kiện', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
        'hoan_thanh': { text: 'Đã sửa xong ✅', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
        'da_ban_giao': { text: 'Đã bàn giao ✅', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
        'da_huy': { text: 'Đã hủy ❌', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
    };

    const CUSTOMER_FAQ = {
        warranty: {
            answer: `<strong>Chính sách bảo hành TechCare Pro:</strong><br>• Linh kiện: <strong>6-36 tháng</strong> tùy loại<br>• Sửa chữa phần cứng: <strong>1-3 tháng</strong><br>• Cài đặt phần mềm: <strong>trọn đời</strong><br>• Đổi mới <strong>1 đổi 1</strong> nếu lỗi nhà sản xuất<br>• <strong>Không BH</strong> nếu: rơi, va đập, vô nước, tự tháo`
        },
        contact: {
            answer: `<strong>Liên hệ TechCare Pro:</strong><br>📞 Hotline: <strong>0912.345.678</strong> (8h-21h)<br>📧 Email: <strong>support@techcare.vn</strong><br>🏪 Địa chỉ: 123 Nguyễn Trãi, Q.1, TP.HCM<br>⏰ Giờ làm: <strong>8:00 - 21:00</strong> (T2-CN)`
        },
        process: {
            answer: `<strong>6 bước quy trình:</strong><br>1️⃣ <strong>Tiếp nhận</strong> - Kiểm tra, lập phiếu<br>2️⃣ <strong>Chẩn đoán</strong> - KTV kiểm tra lỗi<br>3️⃣ <strong>Báo giá</strong> - Chờ bạn duyệt<br>4️⃣ <strong>Sửa chữa</strong> - Tiến hành khi đồng ý<br>5️⃣ <strong>Kiểm tra</strong> - Test kỹ trước bàn giao<br>6️⃣ <strong>Bàn giao</strong> - Nhận máy & phiếu BH`
        },
        send_device: {
            answer: `<strong>Cách gửi máy:</strong><br>🏪 <strong>Mang trực tiếp</strong> tới cửa hàng<br>🚚 <strong>Ship COD</strong> qua GHTK, GHN, J&T<br>📅 <strong>Đặt lịch online</strong> tại <a href="register.html">trang đăng ký</a><br>💡 <em>Nhớ ghi mã phiếu lên hộp khi gửi ship!</em>`
        },
        payment: {
            answer: `<strong>Thanh toán:</strong><br>💵 Tiền mặt<br>🏦 Chuyển khoản ngân hàng<br>📱 Ví: Momo, ZaloPay, VNPay<br>💳 Quẹt thẻ VISA/Mastercard<br>🔄 Trả góp 0% (đơn từ 3 triệu)`
        }
    };

    const DIAGNOSIS_RULES = [
        {
            keywords: ['không lên nguồn', 'không bật', 'mất nguồn', 'không khởi động', 'chết máy'],
            title: '⚡ Lỗi nguồn / Không lên nguồn',
            causes: ['Pin chai hoặc phồng', 'Adapter sạc hỏng', 'IC nguồn mainboard chập/cháy', 'Mạch sạc bị đứt'],
            suggestion: 'Sửa nguồn Mainboard / Thay Pin', cost: '350.000 - 850.000 đ'
        },
        {
            keywords: ['chậm', 'lag', 'giật', 'đơ', 'treo', 'loading lâu', 'khởi động lâu'],
            title: '🐌 Máy chạy chậm / Lag',
            causes: ['Ổ cứng HDD cũ bad sector', 'RAM dưới 8GB', 'CPU quá nóng', 'Virus / phần mềm rác'],
            suggestion: 'Nâng cấp SSD + RAM / Vệ sinh', cost: '120.000 - 1.500.000 đ'
        },
        {
            keywords: ['nóng', 'quạt kêu', 'quạt to', 'tản nhiệt', 'quá nhiệt'],
            title: '🌡️ Máy quá nóng',
            causes: ['Keo tản nhiệt khô', 'Quạt kẹt bụi', 'Heatpipe hở khí', 'Che kín lỗ thoát gió'],
            suggestion: 'Vệ sinh & Thay keo tản nhiệt', cost: '150.000 - 250.000 đ'
        },
        {
            keywords: ['màn hình', 'sọc', 'vỡ màn', 'đen màn', 'nhòe', 'nháy màn', 'màn tối'],
            title: '🖥️ Lỗi màn hình',
            causes: ['Panel LCD/IPS vỡ', 'Cáp màn hình đứt', 'Chip GPU lỗi', 'Backlight hỏng'],
            suggestion: 'Thay Màn hình Laptop Full HD IPS', cost: '800.000 - 2.500.000 đ'
        },
        {
            keywords: ['bàn phím', 'liệt phím', 'phím chập', 'bung phím', 'gõ lỗi'],
            title: '⌨️ Lỗi bàn phím',
            causes: ['Đổ nước, ẩm mốc', 'Mạch bàn phím oxy hóa', 'Gãy chốt pantograph', 'Driver xung đột'],
            suggestion: 'Thay Bàn phím Laptop', cost: '250.000 - 550.000 đ'
        },
        {
            keywords: ['pin', 'chai pin', 'phồng pin', 'sập nguồn', 'hết pin nhanh', 'pin yếu'],
            title: '🔋 Lỗi pin',
            causes: ['Pin chai dưới 40%', 'Cell pin phồng', 'Mạch bảo vệ pin hỏng', 'IC sạc lỗi'],
            suggestion: 'Thay Pin Laptop chính hãng', cost: '450.000 - 950.000 đ'
        },
        {
            keywords: ['loa', 'âm thanh', 'không nghe', 'rè', 'mất tiếng', 'mic'],
            title: '🔊 Lỗi âm thanh',
            causes: ['Loa rách màng', 'Jack cắm oxy hóa', 'Driver lỗi', 'IC Audio chập'],
            suggestion: 'Thay loa / Sửa jack / Cài driver', cost: '100.000 - 400.000 đ'
        },
        {
            keywords: ['wifi', 'mạng', 'mất wifi', 'yếu wifi', 'bluetooth', 'không kết nối'],
            title: '📶 Lỗi WiFi / Kết nối',
            causes: ['Card WiFi lỏng/hỏng', 'Anten WiFi đứt', 'Driver lỗi', 'Xung đột VPN/Firewall'],
            suggestion: 'Thay card WiFi / Cài driver', cost: '100.000 - 350.000 đ'
        }
    ];

    const STAFF_ROLES = ['admin', 'ktv', 'nhanvien_tiepnhan', 'quanlykho', 'thungan'];
    const ROLE_NAMES = {
        admin: 'Quản trị viên', ktv: 'Kỹ thuật viên',
        nhanvien_tiepnhan: 'NV Tiếp nhận', quanlykho: 'Quản lý kho', thungan: 'Thu ngân'
    };

    // ==========================================
    // 3. CHATBOT CLASS
    // ==========================================
    class TechCareChatbot {
        constructor() {
            this.isOpen = false;
            this.messages = [];
            this.conversationState = null;
            this.mode = 'customer'; // 'customer' | 'staff'
            this.userId = null;
            this.userRole = null;
            this.userName = null;
            this.initialized = false;
            this._authListenerSet = false;
        }

        init() {
            if (this.initialized) return;
            this.initialized = true;

            const style = document.createElement('style');
            style.textContent = CHATBOT_CSS;
            document.head.appendChild(style);

            const container = document.createElement('div');
            container.id = 'tcbotContainer';
            document.body.appendChild(container);

            this._setupAuthListener();

            setTimeout(() => {
                if (!this._authListenerSet) this._buildUI();
            }, 2000);
        }

        _setupAuthListener() {
            if (typeof auth === 'undefined') return;
            this._authListenerSet = true;

            auth.onAuthStateChanged(async (user) => {
                const prevUserId = this.userId;
                const prevMode = this.mode;

                if (user) {
                    this.userId = user.uid;
                    try {
                        const doc = await db.collection('users').doc(user.uid).get();
                        if (doc.exists) {
                            const data = doc.data();
                            this.userRole = data.role || 'khachhang';
                            this.userName = data.fullName || user.email;
                        } else {
                            this.userRole = 'khachhang';
                            this.userName = user.email;
                        }
                    } catch (e) {
                        this.userRole = 'khachhang';
                        this.userName = user.email;
                    }
                } else {
                    this.userId = null;
                    this.userRole = null;
                    this.userName = null;
                }

                this.mode = (this.userRole && STAFF_ROLES.includes(this.userRole)) ? 'staff' : 'customer';

                // Rebuild UI if user or mode changed
                if (prevUserId !== this.userId || prevMode !== this.mode) {
                    this.messages = [];
                    this.conversationState = null;
                    this._buildUI();
                }
            });
        }

        _getStorageKey() {
            return this.userId ? `tcbot_v2_${this.userId}` : 'tcbot_v2_guest';
        }

        _buildUI() {
            const container = document.getElementById('tcbotContainer');
            if (!container) return;

            const isStaff = this.mode === 'staff';
            const modeClass = isStaff ? 'mode-staff' : 'mode-customer';
            const botName = isStaff ? 'TechCare Staff Bot' : 'TechCare Assistant';
            const botEmoji = isStaff ? '🛠️' : '🤖';
            const subtitle = isStaff
                ? `Xin chào ${ROLE_NAMES[this.userRole] || 'Nhân viên'}`
                : 'Trực tuyến - Sẵn sàng hỗ trợ';
            const fabIcon = isStaff ? 'fas fa-tools' : 'fas fa-headset';
            const userBarHtml = this.userName
                ? `<div class="tcbot-user-bar"><i class="fas fa-user-circle"></i> Đang đăng nhập: <strong>${this._escapeHtml(this.userName)}</strong> (${ROLE_NAMES[this.userRole] || 'Khách hàng'})</div>`
                : '';

            container.innerHTML = `
                <button type="button" class="tcbot-fab ${modeClass}" id="tcbotFab" title="Trợ lý TechCare Pro">
                    <span class="fab-icon-chat"><i class="${fabIcon}"></i></span>
                    <span class="fab-icon-close"><i class="fas fa-times"></i></span>
                    <span class="tcbot-unread-badge" id="tcbotUnread" style="display:none;">1</span>
                </button>
                <div class="tcbot-window ${modeClass}" id="tcbotWindow">
                    <div class="tcbot-header ${modeClass}">
                        <div class="tcbot-avatar ${modeClass}">${botEmoji}</div>
                        <div class="tcbot-header-info">
                            <h4>${botName}</h4>
                            <small><span class="tcbot-status-dot"></span> ${subtitle}</small>
                        </div>
                        <div class="tcbot-header-actions">
                            <button type="button" onclick="TCBot.clearChat()" title="Xóa hội thoại"><i class="fas fa-trash-alt"></i></button>
                            <button type="button" onclick="TCBot.toggle()" title="Thu nhỏ"><i class="fas fa-chevron-down"></i></button>
                        </div>
                    </div>
                    ${userBarHtml}
                    <div class="tcbot-messages" id="tcbotMessages"></div>
                    <div class="tcbot-input-area">
                        <input type="text" class="tcbot-input" id="tcbotInput" placeholder="${isStaff ? 'Nhập lệnh, mã phiếu hoặc SĐT khách...' : 'Nhập câu hỏi hoặc mã phiếu...'}" autocomplete="off">
                        <button type="button" class="tcbot-send-btn ${modeClass}" id="tcbotSendBtn" onclick="TCBot.sendUserMessage()" title="Gửi">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('tcbotInput').addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendUserMessage(); }
            });
            document.getElementById('tcbotFab').addEventListener('click', () => this.toggle());

            // Tự động chặn và điều hướng chuẩn xác mọi link trong cửa sổ chat (khắc phục 404 khi đứng từ user/ hoặc admin/)
            const msgCont = document.getElementById('tcbotMessages');
            if (msgCont) {
                msgCont.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (!link) return;
                    const href = link.getAttribute('href');
                    if (!href) return;
                    
                    const isSub = window.location.pathname.includes('/user/') || window.location.pathname.includes('/admin/');
                    if (isSub && !/^(https?:|\/|\.\.\/|tel:|mailto:|javascript:)/i.test(href)) {
                        e.preventDefault();
                        const target = link.getAttribute('target') || '_self';
                        const resolved = '../' + href;
                        if (target === '_blank') {
                            window.open(resolved, '_blank');
                        } else {
                            window.location.href = resolved;
                        }
                    }
                });
            }

            this._adjustPosition();
            this._loadSession();

            if (this.isOpen) {
                document.getElementById('tcbotFab').classList.add('open');
                document.getElementById('tcbotWindow').classList.add('open');
            }

            const visited = sessionStorage.getItem('tcbot_visited_' + this.mode);
            if (!visited && !this.isOpen) {
                setTimeout(() => this._showUnreadBadge(), 2500);
            }
        }

        _adjustPosition() {
            const fab = document.getElementById('tcbotFab');
            const floatingToggle = document.getElementById('floatingThemeToggle');
            if (floatingToggle && fab) {
                fab.style.bottom = '84px';
                const win = document.getElementById('tcbotWindow');
                if (win) win.style.bottom = '152px';
            }
        }

        _showUnreadBadge() {
            if (this.isOpen) return;
            const badge = document.getElementById('tcbotUnread');
            if (badge) { badge.textContent = '1'; badge.style.display = 'flex'; }
        }

        toggle() {
            this.isOpen = !this.isOpen;
            const fab = document.getElementById('tcbotFab');
            const win = document.getElementById('tcbotWindow');
            const badge = document.getElementById('tcbotUnread');
            if (!fab || !win) return;

            fab.classList.toggle('open', this.isOpen);
            win.classList.toggle('open', this.isOpen);

            if (this.isOpen) {
                if (badge) badge.style.display = 'none';
                sessionStorage.setItem('tcbot_visited_' + this.mode, '1');
                if (this.messages.length === 0) this._sendWelcome();
                setTimeout(() => {
                    const inp = document.getElementById('tcbotInput');
                    if (inp) inp.focus();
                    this._scrollToBottom();
                }, 350);
            }
        }

        // ==========================================
        // MESSAGE RENDERING
        // ==========================================
        _resolveLinks(html) {
            const isSub = window.location.pathname.includes('/user/') || window.location.pathname.includes('/admin/');
            if (!isSub) return html;
            return html.replace(/href="(?!(?:https?:\/\/|mailto:|tel:|javascript:|\/|\.\.\/))([^"]+)"/g, 'href="../$1"');
        }

        _addMessage(role, html, skipSave) {
            const resolvedHtml = this._resolveLinks(html);
            this.messages.push({ role, html: resolvedHtml, time: Date.now() });
            const el = document.createElement('div');
            el.className = `tcbot-msg ${role}`;
            const icon = role === 'bot' ? (this.mode === 'staff' ? '🛠️' : '🤖') : '👤';
            el.innerHTML = `<div class="tcbot-msg-avatar">${icon}</div><div class="tcbot-bubble">${resolvedHtml}</div>`;
            const cont = document.getElementById('tcbotMessages');
            if (cont) cont.appendChild(el);
            this._scrollToBottom();
            if (!skipSave) this._saveSession();
        }

        _addQuickReplies(buttons) {
            const c = document.createElement('div');
            c.className = 'tcbot-quick-replies';
            buttons.forEach(b => {
                const el = document.createElement('button');
                el.type = 'button'; el.className = 'tcbot-qr-btn';
                el.innerHTML = b.icon ? `<i class="${b.icon}"></i> ${b.label}` : b.label;
                el.addEventListener('click', () => {
                    document.querySelectorAll('.tcbot-quick-replies').forEach(qr => qr.remove());
                    this._processInput(b.value || b.label);
                });
                c.appendChild(el);
            });
            const cont = document.getElementById('tcbotMessages');
            if (cont) cont.appendChild(c);
            this._scrollToBottom();
        }

        _showTyping() {
            const el = document.createElement('div'); el.className = 'tcbot-typing'; el.id = 'tcbotTyping';
            const icon = this.mode === 'staff' ? '🛠️' : '🤖';
            el.innerHTML = `<div class="tcbot-msg-avatar" style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,${this.mode === 'staff' ? '#8b5cf6,#a78bfa' : '#0ea5e9,#38bdf8'});display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:#fff;">${icon}</div><div class="tcbot-typing-dots"><span></span><span></span><span></span></div>`;
            const cont = document.getElementById('tcbotMessages');
            if (cont) cont.appendChild(el);
            this._scrollToBottom();
        }
        _hideTyping() { const el = document.getElementById('tcbotTyping'); if (el) el.remove(); }
        _scrollToBottom() { const c = document.getElementById('tcbotMessages'); if (c) setTimeout(() => { c.scrollTop = c.scrollHeight; }, 50); }

        // ==========================================
        // SESSION PERSISTENCE (per user)
        // ==========================================
        _saveSession() {
            try {
                const data = this.messages.slice(-40);
                localStorage.setItem(this._getStorageKey(), JSON.stringify(data));
            } catch (e) { }
        }
        _loadSession() {
            try {
                const raw = localStorage.getItem(this._getStorageKey());
                if (raw) {
                    const data = JSON.parse(raw);
                    if (data && data.length) {
                        data.forEach(msg => this._addMessage(msg.role, msg.html, true));
                    }
                }
            } catch (e) { }
        }
        clearChat() {
            this.messages = []; this.conversationState = null;
            localStorage.removeItem(this._getStorageKey());
            const cont = document.getElementById('tcbotMessages');
            if (cont) cont.innerHTML = '';
            this._sendWelcome();
        }

        // ==========================================
        // WELCOME
        // ==========================================
        _sendWelcome() {
            const hour = new Date().getHours();
            let g = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

            if (this.mode === 'staff') {
                const name = this.userName ? `, <strong>${this._escapeHtml(this.userName)}</strong>` : '';
                const roleName = ROLE_NAMES[this.userRole] || 'Nhân viên';
                this._addMessage('bot',
                    `${g}${name}! 🛠️ Chào mừng <strong>${roleName}</strong> quay lại hệ thống.<br><br>
                    Mình là <strong>TechCare Staff Bot</strong>, hỗ trợ bạn:<br>
                    🔍 Tra cứu nhanh phiếu theo mã hoặc SĐT khách<br>
                    📦 Kiểm tra tồn kho linh kiện<br>
                    📊 Xem thống kê nhanh hôm nay<br>
                    📋 Đếm phiếu theo trạng thái<br>
                    🔧 Tra cứu quy trình nội bộ<br><br>
                    Cần gì cứ hỏi mình! 💪`
                );
                this._addQuickReplies([
                    { label: 'Thống kê hôm nay', icon: 'fas fa-chart-bar', value: 'thống kê hôm nay' },
                    { label: 'Phiếu chờ xử lý', icon: 'fas fa-clock', value: 'phiếu chờ xử lý' },
                    { label: 'Kiểm tra tồn kho', icon: 'fas fa-boxes', value: 'kiểm tra tồn kho' },
                    { label: 'Tra phiếu theo SĐT', icon: 'fas fa-phone-alt', value: 'tìm phiếu theo sđt' },
                    { label: 'Quy trình nội bộ', icon: 'fas fa-tasks', value: 'quy trình nội bộ' }
                ]);
            } else {
                this._addMessage('bot',
                    `${g}! 👋 Mình là <strong>TechCare Assistant</strong> - trợ lý ảo của TechCare Pro.<br><br>
                    Mình có thể giúp bạn:<br>
                    🔍 Tra cứu tiến độ phiếu sửa chữa<br>
                    💰 Tư vấn dịch vụ & báo giá<br>
                    🩺 Chẩn đoán lỗi máy sơ bộ<br>
                    📅 Hướng dẫn đặt lịch hẹn<br>
                    ❓ Trả lời thắc mắc về bảo hành<br><br>
                    Bạn cần hỗ trợ gì nào? 😊`
                );
                this._addQuickReplies([
                    { label: 'Tra cứu phiếu', icon: 'fas fa-search', value: 'tra cứu phiếu' },
                    { label: 'Bảng giá dịch vụ', icon: 'fas fa-tags', value: 'bảng giá dịch vụ' },
                    { label: 'Chẩn đoán lỗi máy', icon: 'fas fa-stethoscope', value: 'chẩn đoán lỗi' },
                    { label: 'Chính sách BH', icon: 'fas fa-shield-alt', value: 'chính sách bảo hành' },
                    { label: 'Liên hệ hotline', icon: 'fas fa-phone-alt', value: 'liên hệ' }
                ]);
            }
        }

        // ==========================================
        // INPUT PROCESSING
        // ==========================================
        sendUserMessage() {
            const input = document.getElementById('tcbotInput');
            const text = (input.value || '').trim();
            if (!text) return;
            input.value = '';
            document.querySelectorAll('.tcbot-quick-replies').forEach(qr => qr.remove());
            this._processInput(text);
        }

        async _processInput(text) {
            this._addMessage('user', this._escapeHtml(text));
            this._showTyping();

            if (this.conversationState) { await this._handleState(text); return; }

            await this._wait(500 + Math.random() * 700);
            const lower = text.toLowerCase().normalize('NFC');

            // Ticket ID detection
            const ticketMatch = text.match(/TK[-_]?\d{6,8}[-_]?\d{1,3}/i);
            if (ticketMatch) { await this._handleTrackTicket(ticketMatch[0].toUpperCase().replace(/_/g, '-')); return; }

            // Phone detection for staff
            if (this.mode === 'staff') {
                const phoneMatch = text.match(/0\d{9,10}/);
                if (phoneMatch && this._matchKW(lower, ['tìm', 'khách', 'sđt', 'số điện', 'phone', 'tra'])) {
                    await this._staffFindByPhone(phoneMatch[0]); return;
                }
            }

            // Route to mode-specific handler
            if (this.mode === 'staff') {
                await this._processStaffInput(lower, text);
            } else {
                await this._processCustomerInput(lower, text);
            }
        }

        // ==========================================
        // CUSTOMER INTENTS
        // ==========================================
        async _processCustomerInput(lower, text) {
            if (this._matchKW(lower, ['xin chào', 'chào bạn', 'hello', 'hi ', 'hey', 'alo', 'bạn ơi'])) { this._handleGreeting(); return; }
            if (this._matchKW(lower, ['tra cứu', 'kiểm tra phiếu', 'track', 'tiến độ', 'mã phiếu', 'tra cứu phiếu'])) { this._handleAskTicketId(); return; }
            if (this._matchKW(lower, ['dịch vụ', 'bảng giá', 'giá bao nhiêu', 'bao nhiêu tiền', 'báo giá', 'chi phí', 'tư vấn dịch vụ'])) { await this._handleServiceInquiry(); return; }
            if (this._matchKW(lower, ['thay màn', 'màn hình', 'giá màn', 'ssd', 'ram', 'ổ cứng', 'bàn phím', 'thay phím', 'pin', 'thay pin', 'vệ sinh', 'cài win', 'nâng cấp', 'bản lề'])) { this._handleServiceSearch(lower); return; }
            if (this._matchKW(lower, ['chẩn đoán', 'máy bị', 'lỗi gì', 'bị lỗi', 'bị hỏng', 'không lên nguồn', 'chậm', 'lag', 'giật', 'nóng', 'quạt kêu', 'sọc màn', 'liệt phím', 'chai pin', 'mất wifi', 'mất tiếng', 'chẩn đoán lỗi'])) { this._handleDiagnosis(lower); return; }
            if (this._matchKW(lower, ['đặt lịch', 'hẹn', 'book', 'lịch hẹn', 'gửi máy'])) { this._handleBooking(); return; }
            if (this._matchKW(lower, ['bảo hành', 'chính sách', 'đổi trả'])) { this._handleFAQ('warranty'); return; }
            if (this._matchKW(lower, ['liên hệ', 'hotline', 'số điện thoại', 'địa chỉ', 'email', 'giờ mở cửa', 'giờ làm'])) { this._handleFAQ('contact'); return; }
            if (this._matchKW(lower, ['quy trình', 'các bước', 'thủ tục'])) { this._handleFAQ('process'); return; }
            if (this._matchKW(lower, ['thanh toán', 'chuyển khoản', 'momo', 'trả góp'])) { this._handleFAQ('payment'); return; }
            if (this._matchKW(lower, ['gửi máy', 'ship', 'mang đến'])) { this._handleFAQ('send_device'); return; }
            if (this._matchKW(lower, ['cảm ơn', 'thanks', 'bye', 'tạm biệt', 'được rồi'])) { this._handleGoodbye(); return; }
            this._handleFallback();
        }

        // ==========================================
        // STAFF INTENTS
        // ==========================================
        async _processStaffInput(lower, text) {
            if (this._matchKW(lower, ['xin chào', 'chào', 'hello', 'hi ', 'alo'])) { this._staffGreeting(); return; }
            if (this._matchKW(lower, ['tra cứu', 'kiểm tra phiếu', 'tìm phiếu', 'mã phiếu', 'tra phiếu'])) { this._handleAskTicketId(); return; }
            if (this._matchKW(lower, ['tìm phiếu theo', 'sđt', 'số điện thoại khách', 'tra theo sđt', 'tìm khách'])) { this._staffAskPhone(); return; }
            if (this._matchKW(lower, ['thống kê', 'tổng quan', 'báo cáo', 'dashboard', 'stats', 'overview'])) { await this._staffStats(); return; }
            if (this._matchKW(lower, ['phiếu chờ', 'chờ xử lý', 'pending', 'đang chờ', 'phiếu mới'])) { await this._staffPendingTickets(); return; }
            if (this._matchKW(lower, ['tồn kho', 'kho', 'inventory', 'linh kiện', 'kiểm tra tồn kho', 'còn hàng'])) { await this._staffInventory(lower); return; }
            if (this._matchKW(lower, ['sắp hết', 'cảnh báo', 'hết hàng', 'cần nhập'])) { await this._staffLowStock(); return; }
            if (this._matchKW(lower, ['quy trình', 'nội bộ', 'sop', 'hướng dẫn', 'thủ tục'])) { this._staffProcedures(); return; }
            if (this._matchKW(lower, ['phân công', 'assign', 'giao việc'])) { this._staffAssignment(); return; }
            if (this._matchKW(lower, ['cảm ơn', 'thanks', 'bye', 'tạm biệt', 'ok'])) { this._handleGoodbye(); return; }

            // Also support ticket ID directly
            const ticketMatch = text.match(/TK[-_]?\d{6,8}[-_]?\d{1,3}/i);
            if (ticketMatch) { await this._handleTrackTicket(ticketMatch[0].toUpperCase().replace(/_/g, '-')); return; }

            // Phone number lookup
            const phoneMatch = text.match(/0\d{9,10}/);
            if (phoneMatch) { await this._staffFindByPhone(phoneMatch[0]); return; }

            this._staffFallback();
        }

        // ---- Staff Handlers ----
        _staffGreeting() {
            this._hideTyping();
            this._addMessage('bot', `Chào ${ROLE_NAMES[this.userRole] || 'bạn'}! 💪 Cần hỗ trợ gì trong ca làm hôm nay?`);
            this._addQuickReplies([
                { label: 'Thống kê nhanh', icon: 'fas fa-chart-bar', value: 'thống kê hôm nay' },
                { label: 'Phiếu chờ xử lý', icon: 'fas fa-clock', value: 'phiếu chờ xử lý' },
                { label: 'Kiểm tra kho', icon: 'fas fa-boxes', value: 'kiểm tra tồn kho' }
            ]);
        }

        _staffAskPhone() {
            this._hideTyping();
            this.conversationState = 'awaiting_phone';
            this._addMessage('bot', `📞 Nhập <strong>số điện thoại</strong> khách hàng để tìm phiếu liên quan:<br><em>Ví dụ: 0912345678</em>`);
        }

        async _staffFindByPhone(phone) {
            this._hideTyping(); this._showTyping();
            try {
                const snap = await db.collection('tickets').where('customerPhone', '==', phone).orderBy('createdAt', 'desc').limit(5).get();
                this._hideTyping();
                if (snap.empty) {
                    this._addMessage('bot', `❌ Không tìm thấy phiếu nào với SĐT <strong>${phone}</strong>.`);
                } else {
                    let html = `📞 Tìm thấy <strong>${snap.size} phiếu</strong> với SĐT ${phone}:`;
                    snap.forEach(doc => {
                        const t = doc.data();
                        const st = STATUS_LABELS[t.status] || { text: t.status, color: '#64748b', bg: '#f1f5f9' };
                        html += `<div class="tcbot-result-card" style="margin-top:8px;">
                            <div class="rc-title">${t.ticketId}</div>
                            <div class="rc-row"><span class="rc-label">Khách:</span><span class="rc-value">${t.customerName || 'N/A'}</span></div>
                            <div class="rc-row"><span class="rc-label">Thiết bị:</span><span class="rc-value">${t.deviceBrand || ''} ${t.deviceModel || ''}</span></div>
                            <div class="rc-status" style="background:${st.bg};color:${st.color};">${st.text}</div>
                        </div>`;
                    });
                    this._addMessage('bot', html);
                }
            } catch (e) {
                this._hideTyping();
                this._addMessage('bot', `⚠️ Lỗi truy vấn: ${e.message}. Có thể cần tạo index Firestore cho trường customerPhone + createdAt.`);
            }
            this._addQuickReplies([
                { label: 'Tìm SĐT khác', icon: 'fas fa-phone-alt', value: 'tìm phiếu theo sđt' },
                { label: 'Thống kê', icon: 'fas fa-chart-bar', value: 'thống kê hôm nay' }
            ]);
        }

        async _staffStats() {
            this._hideTyping(); this._showTyping();
            try {
                const allSnap = await db.collection('tickets').get();
                let total = 0, pending = 0, inProgress = 0, done = 0, today = 0;
                const now = new Date(); const todayStr = now.toISOString().split('T')[0];

                allSnap.forEach(doc => {
                    total++;
                    const t = doc.data();
                    if (t.status === 'cho_xu_ly') pending++;
                    else if (['dang_kiem_tra', 'cho_bao_gia', 'dang_sua', 'cho_linh_kien'].includes(t.status)) inProgress++;
                    else if (['hoan_thanh', 'da_ban_giao'].includes(t.status)) done++;

                    if (t.createdAt) {
                        try {
                            const d = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                            if (d.toISOString().split('T')[0] === todayStr) today++;
                        } catch (e) {}
                    }
                });

                this._hideTyping();
                this._addMessage('bot',
                    `📊 <strong>Thống kê nhanh hệ thống:</strong>
                    <div class="tcbot-stat-grid">
                        <div class="tcbot-stat-box"><div class="stat-num">${total}</div><div class="stat-lbl">Tổng phiếu</div></div>
                        <div class="tcbot-stat-box"><div class="stat-num" style="color:#f59e0b;">${pending}</div><div class="stat-lbl">Chờ xử lý</div></div>
                        <div class="tcbot-stat-box"><div class="stat-num" style="color:#0ea5e9;">${inProgress}</div><div class="stat-lbl">Đang sửa</div></div>
                        <div class="tcbot-stat-box"><div class="stat-num" style="color:#16a34a;">${done}</div><div class="stat-lbl">Hoàn thành</div></div>
                    </div>
                    <br>📅 Phiếu mới hôm nay: <strong>${today}</strong>`
                );
            } catch (e) {
                this._hideTyping();
                this._addMessage('bot', `⚠️ Không thể tải thống kê: ${e.message}`);
            }
            this._addQuickReplies([
                { label: 'Phiếu chờ xử lý', icon: 'fas fa-clock', value: 'phiếu chờ xử lý' },
                { label: 'Kiểm tra kho', icon: 'fas fa-boxes', value: 'kiểm tra tồn kho' },
                { label: 'Hàng sắp hết', icon: 'fas fa-exclamation-triangle', value: 'sắp hết hàng' }
            ]);
        }

        async _staffPendingTickets() {
            this._hideTyping(); this._showTyping();
            try {
                const snap = await db.collection('tickets').where('status', '==', 'cho_xu_ly').limit(8).get();
                this._hideTyping();
                if (snap.empty) {
                    this._addMessage('bot', `✅ Tuyệt vời! Hiện <strong>không có phiếu nào chờ xử lý</strong>. Mọi thứ đều đang on track! 🎉`);
                } else {
                    let html = `⏳ Có <strong>${snap.size} phiếu đang chờ xử lý</strong> (hiển thị tối đa 8):`;
                    snap.forEach(doc => {
                        const t = doc.data();
                        const date = t.createdAt ? (t.createdAt.toDate ? t.createdAt.toDate().toLocaleDateString('vi-VN') : '') : '';
                        html += `<div class="tcbot-result-card" style="margin-top:8px;">
                            <div class="rc-title">${t.ticketId}</div>
                            <div class="rc-row"><span class="rc-label">Khách:</span><span class="rc-value">${t.customerName || 'N/A'} - ${t.customerPhone || ''}</span></div>
                            <div class="rc-row"><span class="rc-label">Thiết bị:</span><span class="rc-value">${t.deviceBrand || ''} ${t.deviceModel || ''}</span></div>
                            <div class="rc-row"><span class="rc-label">Ngày nhận:</span><span class="rc-value">${date}</span></div>
                        </div>`;
                    });
                    this._addMessage('bot', html);
                }
            } catch (e) {
                this._hideTyping();
                this._addMessage('bot', `⚠️ Lỗi: ${e.message}`);
            }
            this._addQuickReplies([
                { label: 'Thống kê tổng', icon: 'fas fa-chart-bar', value: 'thống kê hôm nay' },
                { label: 'Tìm theo SĐT', icon: 'fas fa-phone-alt', value: 'tìm phiếu theo sđt' }
            ]);
        }

        async _staffInventory(query) {
            this._hideTyping(); this._showTyping();
            try {
                const snap = await db.collection('inventory').limit(10).get();
                this._hideTyping();
                if (snap.empty) {
                    this._addMessage('bot', `📦 Kho linh kiện hiện <strong>chưa có dữ liệu</strong>. Vui lòng thêm linh kiện tại trang <a href="admin/inventory.html">Quản lý kho</a>.`);
                } else {
                    let html = `📦 <strong>Tồn kho linh kiện</strong> (top ${snap.size}):`;
                    const priceF = (p) => typeof formatVND === 'function' ? formatVND(p) : (p || 0).toLocaleString('vi-VN') + ' đ';
                    snap.forEach(doc => {
                        const item = doc.data();
                        const stockColor = (item.quantity || 0) <= (item.minStock || 3) ? '#ef4444' : '#16a34a';
                        html += `<div class="tcbot-svc-item" style="border-left-color:${stockColor};">
                            <div class="svc-name">${item.name || 'N/A'}</div>
                            <div class="svc-meta">Tồn kho: <strong style="color:${stockColor};">${item.quantity || 0}</strong> · Giá vốn: ${priceF(item.costPrice)} · Giá bán: ${priceF(item.sellPrice)}</div>
                        </div>`;
                    });
                    this._addMessage('bot', html);
                }
            } catch (e) {
                this._hideTyping();
                this._addMessage('bot', `⚠️ Lỗi truy vấn kho: ${e.message}`);
            }
            this._addQuickReplies([
                { label: 'Hàng sắp hết', icon: 'fas fa-exclamation-triangle', value: 'sắp hết hàng' },
                { label: 'Thống kê', icon: 'fas fa-chart-bar', value: 'thống kê hôm nay' }
            ]);
        }

        async _staffLowStock() {
            this._hideTyping(); this._showTyping();
            try {
                const snap = await db.collection('inventory').get();
                this._hideTyping();
                let lowItems = [];
                snap.forEach(doc => {
                    const item = doc.data();
                    if ((item.quantity || 0) <= (item.minStock || 3)) lowItems.push(item);
                });
                if (lowItems.length === 0) {
                    this._addMessage('bot', `✅ Tất cả linh kiện đều <strong>đủ hàng</strong>! Không có mục nào dưới mức tối thiểu. 👍`);
                } else {
                    let html = `⚠️ Có <strong>${lowItems.length} linh kiện sắp hết / đã hết</strong>:`;
                    lowItems.forEach(item => {
                        html += `<div class="tcbot-svc-item" style="border-left-color:#ef4444;">
                            <div class="svc-name">${item.name}</div>
                            <div class="svc-meta">Tồn kho: <strong style="color:#ef4444;">${item.quantity || 0}</strong> / Min: ${item.minStock || 3} → <strong>Cần nhập thêm!</strong></div>
                        </div>`;
                    });
                    this._addMessage('bot', html);
                }
            } catch (e) {
                this._hideTyping();
                this._addMessage('bot', `⚠️ Lỗi: ${e.message}`);
            }
            this._addQuickReplies([
                { label: 'Xem toàn bộ kho', icon: 'fas fa-boxes', value: 'kiểm tra tồn kho' },
                { label: 'Thống kê', icon: 'fas fa-chart-bar', value: 'thống kê hôm nay' }
            ]);
        }

        _staffProcedures() {
            this._hideTyping();
            this._addMessage('bot',
                `📋 <strong>Quy trình nội bộ TechCare Pro:</strong><br><br>
                <strong>🔹 Tiếp nhận máy:</strong><br>
                1. Kiểm tra ngoại quan + chụp ảnh<br>
                2. Tạo phiếu Ticket mới tại <a href="admin/sale-workspace.html">Sale Workspace</a><br>
                3. In phiếu biên nhận cho khách<br><br>
                <strong>🔹 Kiểm tra & Báo giá:</strong><br>
                1. KTV nhận phiếu tại <a href="admin/ktv-workspace.html">KTV Workspace</a><br>
                2. Chẩn đoán lỗi, ghi nhận kết quả<br>
                3. Lập báo giá, chờ khách duyệt<br><br>
                <strong>🔹 Sửa chữa & Xuất kho:</strong><br>
                1. Xuất linh kiện theo mã Ticket tại <a href="admin/inventory.html">Quản lý kho</a><br>
                2. Tiến hành sửa, chụp ảnh trước/sau<br>
                3. Test kỹ → Cập nhật trạng thái "Hoàn thành"<br><br>
                <strong>🔹 Bàn giao:</strong><br>
                1. Liên hệ khách đến nhận máy<br>
                2. Thu phí → Cập nhật "Đã bàn giao"`
            );
            this._addQuickReplies([
                { label: 'Phiếu chờ xử lý', icon: 'fas fa-clock', value: 'phiếu chờ xử lý' },
                { label: 'Thống kê', icon: 'fas fa-chart-bar', value: 'thống kê hôm nay' }
            ]);
        }

        _staffAssignment() {
            this._hideTyping();
            this._addMessage('bot',
                `🔧 <strong>Phân công KTV:</strong><br><br>
                Để phân công KTV cho phiếu, truy cập:<br>
                📋 <a href="admin/tickets.html">Quản lý Phiếu SC</a> → Chọn phiếu → Gán KTV<br>
                🗓️ <a href="admin/schedules.html">Lịch trực KTV</a> → Xem ai đang rảnh<br><br>
                💡 <em>Ưu tiên phân công theo chuyên môn (phần cứng/phần mềm) và tải công việc hiện tại của từng KTV.</em>`
            );
            this._addQuickReplies([
                { label: 'Phiếu chờ xử lý', icon: 'fas fa-clock', value: 'phiếu chờ xử lý' },
                { label: 'Thống kê', icon: 'fas fa-chart-bar', value: 'thống kê hôm nay' }
            ]);
        }

        _staffFallback() {
            this._hideTyping();
            this._addMessage('bot',
                `🤔 Mình chưa hiểu rõ. Bạn có thể thử:<br>
                • Nhập <strong>mã phiếu</strong> (TK-xxxxx) để tra cứu<br>
                • Nhập <strong>SĐT khách</strong> (09xxxxxxxx) để tìm phiếu<br>
                • Hỏi về <strong>tồn kho, thống kê, phiếu chờ</strong><br>
                Hoặc chọn nhanh bên dưới 👇`
            );
            this._addQuickReplies([
                { label: 'Thống kê', icon: 'fas fa-chart-bar', value: 'thống kê hôm nay' },
                { label: 'Phiếu chờ', icon: 'fas fa-clock', value: 'phiếu chờ xử lý' },
                { label: 'Kiểm tra kho', icon: 'fas fa-boxes', value: 'kiểm tra tồn kho' },
                { label: 'Tra phiếu', icon: 'fas fa-search', value: 'tra cứu phiếu' }
            ]);
        }

        // ==========================================
        // SHARED HANDLERS (both modes)
        // ==========================================
        _handleGreeting() {
            this._hideTyping();
            this._addMessage('bot', 'Chào bạn! 😊 Rất vui được hỗ trợ. Bạn đang cần giúp gì nhỉ?');
            this._addQuickReplies([
                { label: 'Tra cứu phiếu', icon: 'fas fa-search', value: 'tra cứu phiếu' },
                { label: 'Tư vấn dịch vụ', icon: 'fas fa-tags', value: 'bảng giá dịch vụ' },
                { label: 'Chẩn đoán lỗi', icon: 'fas fa-stethoscope', value: 'chẩn đoán lỗi' }
            ]);
        }

        _handleAskTicketId() {
            this._hideTyping();
            this.conversationState = 'awaiting_ticket_id';
            this._addMessage('bot',
                `🔍 Nhập <strong>mã phiếu</strong> (Ticket ID):<br>📋 Định dạng: <strong>TK-XXXXXXXX-XXX</strong><br>💡 Ví dụ: <code>TK-20261028-001</code>`
            );
        }

        async _handleTrackTicket(ticketId) {
            this._hideTyping(); this._showTyping();
            try {
                const snap = await db.collection('tickets').where('ticketId', '==', ticketId).get();
                this._hideTyping();
                if (snap.empty) {
                    this._addMessage('bot', `❌ Không tìm thấy phiếu <strong>${ticketId}</strong>. Kiểm tra lại mã hoặc gọi <strong>0912.345.678</strong>.`);
                    return;
                }
                let ticket = null;
                snap.forEach(doc => { ticket = { id: doc.id, ...doc.data() }; });
                const st = STATUS_LABELS[ticket.status] || { text: ticket.status, color: '#64748b', bg: '#f1f5f9' };
                const date = ticket.createdAt ? (ticket.createdAt.toDate ? ticket.createdAt.toDate().toLocaleDateString('vi-VN') : new Date(ticket.createdAt).toLocaleDateString('vi-VN')) : 'N/A';
                const priceF = (typeof formatVND === 'function' && ticket.totalCost) ? formatVND(ticket.totalCost) : 'Chưa báo giá';

                let extra = '';
                if (this.mode === 'staff') {
                    extra = `<div class="rc-row"><span class="rc-label">Khách hàng:</span><span class="rc-value">${ticket.customerName || 'N/A'} - ${ticket.customerPhone || ''}</span></div>`;
                }

                this._addMessage('bot',
                    `✅ Tìm thấy phiếu!
                    <div class="tcbot-result-card">
                        <div class="rc-title">📋 ${ticket.ticketId}</div>
                        ${extra}
                        <div class="rc-row"><span class="rc-label">Thiết bị:</span><span class="rc-value">${ticket.deviceType === 'laptop' ? 'Laptop' : 'PC'} ${ticket.deviceBrand || ''} ${ticket.deviceModel || ''}</span></div>
                        <div class="rc-row"><span class="rc-label">Lỗi:</span><span class="rc-value">${ticket.issueDescription || 'Đang kiểm tra'}</span></div>
                        <div class="rc-row"><span class="rc-label">KTV:</span><span class="rc-value">${ticket.assignedKtvName || 'Đang phân công'}</span></div>
                        <div class="rc-row"><span class="rc-label">Ngày nhận:</span><span class="rc-value">${date}</span></div>
                        <div class="rc-row"><span class="rc-label">Chi phí:</span><span class="rc-value">${priceF}</span></div>
                        <div class="rc-status" style="background:${st.bg};color:${st.color};">${st.text}</div>
                    </div>
                    <br>🔗 <a href="tracking.html?ticketId=${ticket.ticketId}" target="_blank">Xem chi tiết đầy đủ →</a>`
                );
            } catch (e) {
                this._hideTyping();
                this._addMessage('bot', `⚠️ Lỗi tra cứu: ${e.message}`);
            }
        }

        async _handleServiceInquiry() {
            this._hideTyping();
            let services = [];
            try {
                const snap = await db.collection('services').where('status', '==', 'active').limit(6).get();
                snap.forEach(doc => services.push(doc.data()));
            } catch (e) {}
            if (!services.length) {
                services = [
                    { name: 'Vệ sinh & Thay keo tản nhiệt', price: 150000, estimatedTime: '45-60 phút', warranty: '1 tháng' },
                    { name: 'Cài đặt Windows & Phần mềm', price: 120000, estimatedTime: '60 phút', warranty: 'Trọn đời' },
                    { name: 'Thay Màn hình Laptop Full HD', price: 1450000, estimatedTime: '1-2 giờ', warranty: '12 tháng' },
                    { name: 'Nâng cấp SSD NVMe 512GB', price: 890000, estimatedTime: '30-45 phút', warranty: '36 tháng' },
                    { name: 'Nâng cấp RAM DDR4 8/16GB', price: 550000, estimatedTime: '20 phút', warranty: '36 tháng' },
                    { name: 'Sửa nguồn Mainboard', price: 650000, estimatedTime: '1-2 ngày', warranty: '3 tháng' }
                ];
            }
            const pf = (p) => typeof formatVND === 'function' ? formatVND(p) : p.toLocaleString('vi-VN') + ' đ';
            let html = `💰 <strong>Dịch vụ phổ biến:</strong><div class="tcbot-svc-list">`;
            services.forEach(s => {
                html += `<div class="tcbot-svc-item"><div class="svc-name">${s.name}</div><div class="svc-price">${pf(s.price)}</div><div class="svc-meta">⏱ ${s.estimatedTime || '30-60 phút'} · 🛡 BH: ${s.warranty || 'Có'}</div></div>`;
            });
            html += `</div><br>🔗 <a href="services.html" target="_blank">Xem bảng giá đầy đủ</a>`;
            this._addMessage('bot', html);
            this._addQuickReplies([
                { label: 'Chẩn đoán lỗi', icon: 'fas fa-stethoscope', value: 'chẩn đoán lỗi' },
                { label: 'Đặt lịch hẹn', icon: 'fas fa-calendar-plus', value: 'đặt lịch' }
            ]);
        }

        _handleServiceSearch(query) {
            this._hideTyping();
            
            // Chi tiết dịch vụ & linh kiện cụ thể để báo giá chuẩn xác
            const serviceDetails = {
                'màn': {
                    name: 'Màn hình Laptop (Full HD IPS / Slim)',
                    price: '1.450.000 đ',
                    range: '800.000 - 2.200.000 đ (tùy kích thước 14/15.6 inch & tần số quét)',
                    warranty: '12 tháng đổi mới 1 đổi 1',
                    time: '1 - 2 giờ (lấy liền trong ngày)',
                    tip: '💡 <em>Mẹo tiết kiệm:</em> Nếu màn hình chỉ bị chớp giật hoặc mất tín hiệu do lỏng cáp/đứt cáp tín hiệu, chi phí khắc phục chỉ từ <strong>150.000 - 250.000 đ</strong> mà không cần thay cả cụm màn hình!'
                },
                'pin': {
                    name: 'Pin Laptop chính hãng (Zin theo máy)',
                    price: '650.000 đ',
                    range: '450.000 - 950.000 đ (tùy dòng máy phổ thông hay Gaming)',
                    warranty: '12 tháng',
                    time: '20 - 30 phút',
                    tip: '💡 <em>Lời khuyên:</em> Nên thay ngay khi pin có dấu hiệu phồng để tránh chèn ép làm vỡ Touchpad hoặc nứt vỏ máy.'
                },
                'bàn phím': {
                    name: 'Bàn phím Laptop chính hãng',
                    price: '350.000 đ',
                    range: '250.000 - 650.000 đ (phím LED Gaming từ 450.000 đ)',
                    warranty: '12 tháng',
                    time: '30 - 45 phút',
                    tip: '💡 <em>Cam kết:</em> Phím gõ êm, độ nảy nẩy chuẩn zin, bảo hành liệt phím 1 đổi 1.'
                },
                'ssd': {
                    name: 'Ổ cứng SSD NVMe PCIe 512GB (Kingston / Samsung)',
                    price: '890.000 đ',
                    range: '450.000 đ (256GB) - 1.550.000 đ (1TB)',
                    warranty: '36 tháng (3 năm)',
                    time: '30 - 45 phút',
                    tip: '💡 <em>Miễn phí:</em> Hỗ trợ sao lưu dữ liệu cũ và cài đặt lại Windows/Office hoàn toàn miễn phí khi nâng cấp SSD!'
                },
                'ram': {
                    name: 'Bộ nhớ RAM DDR4 / DDR5 8GB - 16GB (Bus 3200MHz)',
                    price: '550.000 đ (8GB) / 950.000 đ (16GB)',
                    range: '450.000 - 1.600.000 đ',
                    warranty: '36 tháng (3 năm)',
                    time: '15 - 20 phút',
                    tip: '💡 <em>Lời khuyên:</em> Nâng cấp lên tối thiểu 16GB giúp máy đa nhiệm cực mượt, mở hàng chục tab Chrome và đồ họa không giật lag.'
                },
                'vệ sinh': {
                    name: 'Vệ sinh & Tra keo tản nhiệt gốm MX-4 / Kryonaut',
                    price: '150.000 đ',
                    range: '150.000 đ (máy văn phòng) - 200.000 đ (máy Gaming 2 quạt)',
                    warranty: '1 tháng',
                    time: '45 - 60 phút',
                    tip: '💡 Giúp hạ nhiệt độ CPU/GPU từ 15-20°C, máy chạy êm và tăng tuổi thọ linh kiện.'
                },
                'cài win': {
                    name: 'Cài đặt Windows 10/11 & Bộ phần mềm văn phòng Full',
                    price: '120.000 đ',
                    range: '120.000 đ trọn gói',
                    warranty: 'Hỗ trợ trọn đời',
                    time: '45 - 60 phút',
                    tip: '💡 Bản cài chuẩn UEFI, sạch virus, tối ưu khởi động kèm đầy đủ Office, PDF, Unikey, Driver chuẩn.'
                },
                'bản lề': {
                    name: 'Hàn & Gia cố Bản lề Laptop bị gãy/bung vỏ',
                    price: '250.000 đ / 1 bên',
                    range: '200.000 - 450.000 đ cả 2 bên',
                    warranty: '6 tháng',
                    time: '2 - 4 giờ',
                    tip: '💡 Đúc chân ốc đồng chịu lực cao cấp, nắn khớp mở êm ái mà không cần tốn tiền thay toàn bộ vỏ máy.'
                }
            };

            let matched = null;
            for (const [k, item] of Object.entries(serviceDetails)) {
                if (query.includes(k)) {
                    matched = item;
                    break;
                }
            }

            if (matched) {
                this._addMessage('bot',
                    `🖥️ <strong>Báo giá tham khảo linh kiện: ${matched.name}</strong>
                    <div class="tcbot-result-card" style="margin-top:8px;">
                        <div class="rc-row"><span class="rc-label">Giá niêm yết:</span><span class="rc-value" style="color:#0284c7;font-size:1rem;font-weight:800;">${matched.price}</span></div>
                        <div class="rc-row"><span class="rc-label">Khoảng giá các dòng:</span><span class="rc-value">${matched.range}</span></div>
                        <div class="rc-row"><span class="rc-label">Chế độ bảo hành:</span><span class="rc-value" style="color:#16a34a;font-weight:700;">🛡️ ${matched.warranty}</span></div>
                        <div class="rc-row"><span class="rc-label">Thời gian thực hiện:</span><span class="rc-value">⏱️ ${matched.time}</span></div>
                    </div>
                    <div style="margin-top:8px;font-size:0.84rem;color:var(--text);">${matched.tip}</div>
                    <br>✨ <strong>Cam kết TechCare Pro:</strong> Miễn phí công tháo lắp kiểm tra, báo giá chuẩn xác trước khi làm, khách được xem trực tiếp quá trình thay thế!`
                );
            } else {
                this._addMessage('bot',
                    `🔍 Bạn đang quan tâm đến dịch vụ sửa chữa / thay thế linh kiện.<br><br>
                    📋 Bạn có thể xem chi tiết tại <a href="services.html" target="_blank">Bảng Giá Dịch Vụ Niêm Yết</a><br>
                    📞 Hoặc gọi hotline <strong>0912.345.678</strong> để được báo giá chính xác theo đúng model máy của bạn nhé!`
                );
            }

            this._addQuickReplies([
                { label: 'Đặt lịch kiểm tra ngay', icon: 'fas fa-calendar-plus', value: 'đặt lịch' },
                { label: 'Xem bảng giá đầy đủ', icon: 'fas fa-list-alt', value: 'bảng giá dịch vụ' },
                { label: 'Chẩn đoán bệnh máy', icon: 'fas fa-stethoscope', value: 'chẩn đoán lỗi' },
                { label: 'Gọi hotline tư vấn', icon: 'fas fa-phone-alt', value: 'liên hệ' }
            ]);
        }

        _handleDiagnosis(query) {
            this._hideTyping();
            let matched = null;
            for (const rule of DIAGNOSIS_RULES) { for (const kw of rule.keywords) { if (query.includes(kw)) { matched = rule; break; } } if (matched) break; }
            if (matched) {
                const causes = matched.causes.map(c => `<li>${c}</li>`).join('');
                this._addMessage('bot',
                    `<div class="tcbot-diag-card"><h5>${matched.title}</h5><ul>${causes}</ul></div><br>💊 <strong>Giải pháp:</strong> ${matched.suggestion}<br>💰 <strong>Chi phí:</strong> ${matched.cost}<br><br>⚠️ <em>Chẩn đoán sơ bộ. KTV sẽ kiểm tra chính xác (miễn phí).</em>`
                );
                this._addQuickReplies([
                    { label: 'Đặt lịch sửa', icon: 'fas fa-calendar-plus', value: 'đặt lịch' },
                    { label: 'Hỏi lỗi khác', icon: 'fas fa-stethoscope', value: 'chẩn đoán lỗi' }
                ]);
            } else {
                this._addMessage('bot', `🩺 Mô tả <strong>triệu chứng</strong> máy đang gặp nhé. Ví dụ: "Máy không lên nguồn", "Laptop chạy chậm"...`);
                this._addQuickReplies([
                    { label: 'Không lên nguồn', icon: 'fas fa-power-off', value: 'máy bị không lên nguồn' },
                    { label: 'Chạy chậm / Lag', icon: 'fas fa-tachometer-alt', value: 'máy bị chậm lag' },
                    { label: 'Máy quá nóng', icon: 'fas fa-thermometer-full', value: 'máy bị nóng quạt kêu' },
                    { label: 'Lỗi màn hình', icon: 'fas fa-desktop', value: 'màn hình bị sọc' },
                    { label: 'Lỗi bàn phím', icon: 'fas fa-keyboard', value: 'bàn phím bị liệt phím' },
                    { label: 'Pin chai', icon: 'fas fa-battery-quarter', value: 'pin bị chai pin' },
                    { label: 'Mất WiFi', icon: 'fas fa-wifi', value: 'máy bị mất wifi' }
                ]);
            }
        }

        _handleBooking() {
            this._hideTyping();
            this._addMessage('bot',
                `📅 Đặt lịch hẹn sửa chữa:<br><br>1️⃣ <a href="services.html" target="_blank">Bảng Giá</a> → Bấm <strong>"Đặt lịch hẹn"</strong><br>2️⃣ <a href="register.html" target="_blank">Đăng ký</a> → Gửi yêu cầu sửa chữa<br>3️⃣ Gọi <strong>0912.345.678</strong> (8h-21h)<br><br>✨ <em>Đặt online được ưu tiên!</em>`
            );
        }

        _handleFAQ(key) {
            this._hideTyping();
            const faq = CUSTOMER_FAQ[key];
            if (faq) this._addMessage('bot', faq.answer);
            this._addQuickReplies([
                { label: 'Tra cứu phiếu', icon: 'fas fa-search', value: 'tra cứu phiếu' },
                { label: 'Bảng giá', icon: 'fas fa-tags', value: 'bảng giá dịch vụ' }
            ]);
        }

        _handleGoodbye() {
            this._hideTyping();
            const r = ['Cảm ơn bạn! 😊 Chúc một ngày tuyệt vời!', 'Rất vui được giúp! 💙 Hẹn gặp lại!', 'Không có chi! 🙌 Cứ liên hệ lại bất cứ lúc nào!'];
            this._addMessage('bot', r[Math.floor(Math.random() * r.length)]);
        }

        _handleFallback() {
            this._hideTyping();
            this._addMessage('bot',
                `🤔 Mình chưa hiểu rõ. Bạn có thể:<br>• Nhập <strong>mã phiếu</strong> (TK-xxxxx)<br>• Mô tả <strong>lỗi máy</strong><br>• Hỏi về <strong>dịch vụ, bảo hành</strong>`
            );
            this._addQuickReplies([
                { label: 'Tra cứu phiếu', icon: 'fas fa-search', value: 'tra cứu phiếu' },
                { label: 'Bảng giá', icon: 'fas fa-tags', value: 'bảng giá dịch vụ' },
                { label: 'Chẩn đoán lỗi', icon: 'fas fa-stethoscope', value: 'chẩn đoán lỗi' },
                { label: 'Liên hệ', icon: 'fas fa-phone-alt', value: 'liên hệ' }
            ]);
        }

        // ==========================================
        // MULTI-STEP STATE
        // ==========================================
        async _handleState(text) {
            const state = this.conversationState;
            this.conversationState = null;

            if (state === 'awaiting_ticket_id') {
                const m = text.match(/TK[-_]?\d{6,8}[-_]?\d{1,3}/i);
                if (m) { await this._wait(600); await this._handleTrackTicket(m[0].toUpperCase().replace(/_/g, '-')); }
                else if (text.trim().length >= 5) { await this._wait(600); await this._handleTrackTicket(text.trim().toUpperCase()); }
                else { this._hideTyping(); this._addMessage('bot', `Mã phiếu không hợp lệ. Vui lòng nhập dạng <strong>TK-XXXXXXXX-XXX</strong>`); }
                return;
            }
            if (state === 'awaiting_phone') {
                const pm = text.match(/0\d{9,10}/);
                if (pm) { await this._staffFindByPhone(pm[0]); }
                else { this._hideTyping(); this._addMessage('bot', `SĐT không hợp lệ. Vui lòng nhập 10-11 số bắt đầu bằng 0.`); }
                return;
            }
            this._hideTyping(); await this._wait(500);
            if (this.mode === 'staff') this._staffFallback(); else this._handleFallback();
        }

        // ==========================================
        // UTILITIES
        // ==========================================
        _matchKW(text, kws) { return kws.some(kw => text.includes(kw)); }
        _escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
        _wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    }

    // ==========================================
    // GLOBAL INIT
    // ==========================================
    const bot = new TechCareChatbot();
    window.TCBot = bot;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => bot.init());
    } else {
        setTimeout(() => bot.init(), 300);
    }
})();
