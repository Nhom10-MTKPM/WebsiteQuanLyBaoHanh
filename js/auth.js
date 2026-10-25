// ==========================================
// TechCare Pro - Authentication & Helpers
// ==========================================

/**
 * Lấy URL trang chủ tương ứng cho từng vai trò
 */
function getHomeUrlForRole(role, isFromAdminFolder = false) {
    const prefix = isFromAdminFolder ? '' : 'admin/';
    const userPrefix = isFromAdminFolder ? '../user/' : 'user/';
    switch (role) {
        case 'admin':
            return `${prefix}dashboard.html`;
        case 'ktv':
            return `${prefix}ktv-workspace.html`;
        case 'nhanvien_tiepnhan':
            return `${prefix}sale-workspace.html`;
        case 'quanlykho':
            return `${prefix}inventory.html`;
        case 'thungan':
            return `${prefix}tickets.html`;
        case 'khachhang':
        default:
            return `${userPrefix}dashboard.html`;
    }
}

/**
 * Handle Login with Email and Password
 * Tự động phân luồng chính xác tới trang riêng của từng vai trò
 */
async function loginUser(email, password) {
    try {
        let userCredential;
        try {
            userCredential = await auth.signInWithEmailAndPassword(email, password);
        } catch (signInErr) {
            // Tự động khởi tạo Master Admin ngầm nếu lần đầu đăng nhập bằng tài khoản quản trị mặc định
            if (email.toLowerCase() === 'admin@techcare.vn' && password === 'admin123') {
                try {
                    userCredential = await auth.createUserWithEmailAndPassword(email, password);
                } catch (createErr) {
                    throw signInErr;
                }
            } else {
                throw signInErr;
            }
        }

        const user = userCredential.user;

        // Fetch user document from Firestore
        let userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists) {
            // Chỉ duy nhất email master admin mới được cấp role admin nếu doc chưa tồn tại
            if (email.toLowerCase() === 'admin@techcare.vn') {
                const adminData = {
                    email: user.email,
                    fullName: 'Quản trị viên Hệ thống',
                    role: 'admin',
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await db.collection('users').doc(user.uid).set(adminData);
                sessionStorage.setItem('techcare_user', JSON.stringify({ ...adminData, uid: user.uid }));
                window.location.href = 'admin/dashboard.html';
                return;
            } else {
                // Tất cả các tài khoản khác tự đăng ký mặc định là khách hàng
                const customerData = {
                    email: user.email,
                    fullName: user.displayName || user.email.split('@')[0],
                    role: 'khachhang',
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await db.collection('users').doc(user.uid).set(customerData);
                sessionStorage.setItem('techcare_user', JSON.stringify({ ...customerData, uid: user.uid }));
                window.location.href = 'user/dashboard.html';
                return;
            }
        }

        const userData = userDoc.data();

        // Check if account is locked
        if (userData.status === 'locked' || userData.status === 'inactive') {
            await auth.signOut();
            sessionStorage.removeItem('techcare_user');
            throw new Error('Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động. Vui lòng liên hệ Admin!');
        }

        const role = userData.role || 'khachhang';

        // Lưu thông tin người dùng vào session để nạp tức thì tránh chớp giao diện
        sessionStorage.setItem('techcare_user', JSON.stringify({ ...userData, uid: user.uid }));

        // Role-based routing: Mỗi role vào thẳng trang riêng của mình
        window.location.href = getHomeUrlForRole(role, false);
    } catch (error) {
        console.error('Login error:', error);
        let msg = error.message;
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            msg = 'Email hoặc mật khẩu không chính xác!';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'Định dạng email không hợp lệ!';
        } else if (error.code === 'auth/too-many-requests') {
            msg = 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút!';
        }
        throw new Error(msg);
    }
}

/**
 * Handle Registration (Customers ONLY - role is always 'khachhang')
 * Khách hàng CHỈ CÓ THỂ đăng ký tài khoản Khách hàng, không thể tự ý đăng ký làm Admin/Nhân viên
 */
async function registerCustomer(fullName, email, phone, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update profile displayName
        await user.updateProfile({
            displayName: fullName
        });

        // Send Email Verification
        try {
            await user.sendEmailVerification();
        } catch (evErr) {
            console.warn('Email verification send notice:', evErr);
        }

        const customerData = {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : '',
            role: 'khachhang', // KHÁCH HÀNG LUÔN LÀ KHACHHANG
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save into Firestore 'users' collection with role 'khachhang'
        await db.collection('users').doc(user.uid).set(customerData);

        // Save into sessionStorage
        sessionStorage.setItem('techcare_user', JSON.stringify({ ...customerData, uid: user.uid }));

        // Create welcome notification
        await db.collection('notifications').add({
            userId: user.uid,
            title: 'Chào mừng bạn đến với TechCare Pro! 🎉',
            message: 'Tài khoản khách hàng của bạn đã được đăng ký thành công. Hãy khám phá và sử dụng dịch vụ bảo hành PC & Laptop của chúng tôi.',
            type: 'system',
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return user;
    } catch (error) {
        console.error('Registration error:', error);
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') {
            msg = 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác!';
        } else if (error.code === 'auth/weak-password') {
            msg = 'Mật khẩu quá yếu (cần tối thiểu 6 ký tự)!';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'Định dạng email không hợp lệ!';
        }
        throw new Error(msg);
    }
}

/**
 * Initialize default Master Admin account for first-time setup
 */
async function initDefaultAdminAccount(adminEmail = 'admin@techcare.vn', adminPassword = 'admin123') {
    try {
        let userCredential;
        try {
            userCredential = await auth.createUserWithEmailAndPassword(adminEmail, adminPassword);
        } catch (authErr) {
            if (authErr.code === 'auth/email-already-in-use') {
                userCredential = await auth.signInWithEmailAndPassword(adminEmail, adminPassword);
            } else {
                throw authErr;
            }
        }

        const user = userCredential.user;

        // Set master admin role in Firestore
        await db.collection('users').doc(user.uid).set({
            fullName: 'Quản trị viên Hệ thống (Master Admin)',
            email: adminEmail,
            phone: '0901234567',
            role: 'admin',
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return user;
    } catch (err) {
        console.error('Init Admin error:', err);
        throw err;
    }
}

/**
 * Send password reset email
 */
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email.trim());
    } catch (error) {
        console.error('Reset password error:', error);
        let msg = error.message;
        if (error.code === 'auth/user-not-found') {
            msg = 'Không tìm thấy tài khoản với email này!';
        } else if (error.code === 'auth/invalid-email') {
            msg = 'Định dạng email không hợp lệ!';
        }
        throw new Error(msg);
    }
}

/**
 * Check Authentication for Customer Pages
 */
function checkCustomerAuth(redirectUrl = '../index.html') {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                sessionStorage.removeItem('techcare_user');
                window.location.href = redirectUrl;
                return;
            }
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    sessionStorage.removeItem('techcare_user');
                    window.location.href = redirectUrl;
                    return;
                }
                const userData = userDoc.data();
                if (userData.status === 'locked' || userData.status === 'inactive') {
                    alert('Tài khoản của bạn đã bị khóa!');
                    await auth.signOut();
                    sessionStorage.removeItem('techcare_user');
                    window.location.href = redirectUrl;
                    return;
                }
                // If user is admin/staff trying to access user page, redirect to their workspace
                const adminRoles = ['admin', 'nhanvien_tiepnhan', 'ktv', 'thungan', 'quanlykho'];
                if (adminRoles.includes(userData.role)) {
                    window.location.href = getHomeUrlForRole(userData.role, false);
                    return;
                }
                const fullUser = { ...userData, uid: user.uid };
                sessionStorage.setItem('techcare_user', JSON.stringify(fullUser));
                resolve({ user, userData: fullUser });
            } catch (err) {
                console.error('Customer auth check error:', err);
                window.location.href = redirectUrl;
            }
        });
    });
}

/**
 * Cập nhật hiển thị thông tin nhân viên và sidebar
 */
function updateUserDisplay(userData, activePage) {
    if (!userData) return;

    // Cập nhật tên
    const nameEl = document.getElementById('adminName');
    if (nameEl) nameEl.textContent = userData.fullName || userData.email || 'Người dùng';

    // Cập nhật avatar
    const avatarEl = document.getElementById('adminAvatar');
    if (avatarEl) {
        const initial = (userData.fullName || userData.email || 'U').charAt(0).toUpperCase();
        avatarEl.textContent = initial;
    }

    // Cập nhật vai trò badge
    const roleEl = document.getElementById('adminRole');
    if (roleEl) roleEl.innerHTML = getRoleBadge(userData.role);

    // Cập nhật tiêu đề Portal theo vai trò
    const brandSmall = document.querySelector('.sidebar-brand small');
    if (brandSmall) {
        const portalTitles = {
            'admin': 'Cổng Quản Trị Hệ Thống',
            'ktv': 'Cổng Kỹ Thuật Viên (KTV)',
            'nhanvien_tiepnhan': 'Cổng Bán Hàng & Tiếp Nhận',
            'quanlykho': 'Cổng Quản Lý Kho Vật Tư',
            'thungan': 'Cổng Thu Ngân & Kế Toán'
        };
        brandSmall.textContent = portalTitles[userData.role] || 'Cổng Nghiệp Vụ';
    }

    // Sinh lại sidebar theo đúng vai trò
    if (activePage) {
        generateSidebar(userData.role, activePage);
    }
}

/**
 * Nạp thông tin người dùng từ sessionStorage ngay lập tức (Zero-Flash)
 * Giúp giao diện không bị giật hoặc nhấp nháy chữ Admin khi chuyển trang
 */
function applyCachedUserInfo(activePage) {
    try {
        const cached = sessionStorage.getItem('techcare_user');
        if (cached) {
            const userData = JSON.parse(cached);
            updateUserDisplay(userData, activePage);
        }
    } catch (e) {
        console.warn('Lỗi đọc cached user:', e);
    }
}

/**
 * Check Authentication & Page Access for Admin/Staff Pages
 * @param {Array} allowedRoles Danh sách vai trò được phép truy cập trang này (nếu rỗng thì tất cả staff)
 * @param {string} activePage Tên trang để highlight menu
 * @param {string} redirectUrl URL chuyển hướng nếu chưa đăng nhập
 */
function checkAdminAuth(allowedRoles = [], activePage = '', redirectUrl = '../index.html') {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                sessionStorage.removeItem('techcare_user');
                window.location.href = redirectUrl;
                return;
            }
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    sessionStorage.removeItem('techcare_user');
                    window.location.href = redirectUrl;
                    return;
                }
                const userData = userDoc.data();
                if (userData.status === 'locked' || userData.status === 'inactive') {
                    alert('Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động!');
                    await auth.signOut();
                    sessionStorage.removeItem('techcare_user');
                    window.location.href = redirectUrl;
                    return;
                }

                // Nếu là khách hàng cố vào trang nghiệp vụ
                if (userData.role === 'khachhang') {
                    alert('Bạn không có quyền truy cập trang quản trị/nghiệp vụ!');
                    window.location.href = '../user/dashboard.html';
                    return;
                }

                const fullUser = { ...userData, uid: user.uid };
                sessionStorage.setItem('techcare_user', JSON.stringify(fullUser));

                // Kiểm tra phân quyền truy cập theo từng trang:
                // Nếu vai trò không phải Admin và trang đó không cho phép vai trò này -> Chuyển về trang riêng của họ
                if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
                    if (userData.role !== 'admin' && !allowedRoles.includes(userData.role)) {
                        console.warn(`Vai trò ${userData.role} không có quyền vào trang ${activePage}. Đang chuyển hướng về trang nghiệp vụ tương ứng...`);
                        window.location.href = getHomeUrlForRole(userData.role, true);
                        return;
                    }
                }

                // Cập nhật giao diện và menu
                updateUserDisplay(fullUser, activePage);

                resolve({ user, userData: fullUser });
            } catch (err) {
                console.error('Admin auth check error:', err);
                window.location.href = redirectUrl;
            }
        });
    });
}

/**
 * Sign out helper
 */
async function handleSignOut(redirectUrl = '../index.html') {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        try {
            sessionStorage.removeItem('techcare_user');
            await auth.signOut();
            window.location.href = redirectUrl;
        } catch (err) {
            console.error('Sign out error:', err);
        }
    }
}

/**
 * Toast notification
 */
function showToast(message, type = 'success', duration = 3500) {
    const existing = document.querySelectorAll('.toast-notification');
    existing.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Format currency VND
 */
function formatVND(amount) {
    if (amount === undefined || amount === null) return '0 đ';
    return Number(amount).toLocaleString('vi-VN') + ' đ';
}

/**
 * Format date
 */
function formatDate(timestamp) {
    if (!timestamp) return '---';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Format datetime
 */
function formatDateTime(timestamp) {
    if (!timestamp) return '---';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Status mapping helper
 */
function getStatusBadge(status) {
    const statusMap = {
        'cho_xu_ly': { label: 'Chờ tiếp nhận', class: 'badge-warning' },
        'dang_kiem_tra': { label: 'Đang kiểm tra', class: 'badge-info' },
        'cho_bao_gia': { label: 'Chờ duyệt giá', class: 'badge-warning' },
        'dang_sua': { label: 'Đang sửa chữa', class: 'badge-primary' },
        'cho_linh_kien': { label: 'Chờ linh kiện', class: 'badge-danger' },
        'hoan_thanh': { label: 'Đã sửa xong', class: 'badge-success' },
        'da_ban_giao': { label: 'Đã bàn giao máy', class: 'badge-success' },
        'da_huy': { label: 'Đã hủy', class: 'badge-secondary' }
    };
    const info = statusMap[status] || { label: status || 'Không xác định', class: 'badge-secondary' };
    return `<span class="badge ${info.class}">${info.label}</span>`;
}

/**
 * Role mapping helper
 */
function getRoleBadge(role) {
    const roleMap = {
        'admin': { label: 'Quản trị viên (Admin)', class: 'badge-danger' },
        'nhanvien_tiepnhan': { label: 'NV Tiếp nhận / CSKH', class: 'badge-primary' },
        'ktv': { label: 'Kỹ thuật viên (KTV)', class: 'badge-info' },
        'thungan': { label: 'Thu ngân', class: 'badge-warning' },
        'quanlykho': { label: 'Quản lý kho', class: 'badge-purple' },
        'khachhang': { label: 'Khách hàng', class: 'badge-success' }
    };
    const info = roleMap[role] || { label: role, class: 'badge-secondary' };
    return `<span class="badge ${info.class}">${info.label}</span>`;
}

/**
 * Create Employee Account using Secondary Firebase App
 * This avoids logging out the current admin session.
 * Creates both Firebase Auth account AND Firestore user document.
 */
async function createEmployeeAccount(email, password, userData) {
    const secondaryApp = firebase.initializeApp(firebaseConfig, 'SecondaryApp_' + Date.now());
    const secondaryAuth = secondaryApp.auth();

    try {
        const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        await secondaryAuth.signOut();

        await db.collection('users').doc(uid).set({
            fullName: userData.fullName,
            email: email.trim().toLowerCase(),
            phone: userData.phone || '',
            role: userData.role || 'ktv',
            status: userData.status || 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return uid;
    } catch (err) {
        console.error('createEmployeeAccount error:', err);
        throw err;
    } finally {
        try { await secondaryApp.delete(); } catch(e) {}
    }
}

/**
 * Generate role-based sidebar navigation
 * Mỗi vai trò có danh mục và trang làm việc chuyên biệt, tránh nhầm lẫn hoặc nhảy sang trang khác
 */
function generateSidebar(role, activePage) {
    const allMenuItems = [
        // Quản trị viên
        { id: 'dashboard', href: 'dashboard.html', icon: 'fas fa-tachometer-alt', label: 'Dashboard Quản trị', roles: ['admin'] },
        
        // Tiếp nhận máy & Phiếu SC (Admin, Sale, Thu ngân)
        { id: 'tickets', href: 'tickets.html', icon: 'fas fa-ticket-alt', label: 'Quản lý Phiếu SC', roles: ['admin', 'nhanvien_tiepnhan', 'thungan'] },

        // Kỹ thuật viên (KTV)
        { id: 'ktv-workspace', href: 'ktv-workspace.html', icon: 'fas fa-tools', label: 'Phiếu SC của tôi', roles: ['ktv'] },
        { id: 'warehouse', href: 'warehouse.html', icon: 'fas fa-warehouse', label: 'Kho & Đặt linh kiện', roles: ['ktv'] },

        // Sale / CSKH / Tiếp nhận
        { id: 'sale-workspace', href: 'sale-workspace.html', icon: 'fas fa-store', label: 'Tra cứu Kho & Bán hàng', roles: ['nhanvien_tiepnhan'] },

        // Dịch vụ sửa chữa (Admin & Sale)
        { id: 'services', href: 'services.html', icon: 'fas fa-cogs', label: 'Danh mục Dịch vụ', roles: ['admin', 'nhanvien_tiepnhan'] },

        // Nhân sự & Lịch trực
        { id: 'employees', href: 'employees.html', icon: 'fas fa-users-cog', label: 'Quản lý Nhân sự', roles: ['admin'] },
        { id: 'schedules', href: 'schedules.html', icon: 'fas fa-calendar-alt', label: role === 'ktv' ? 'Lịch trực của tôi' : 'Lịch trực KTV', roles: ['admin', 'ktv'] },

        // Quản lý Kho vật tư (Admin & Quản lý kho)
        { id: 'inventory', href: 'inventory.html', icon: 'fas fa-boxes', label: 'Quản lý Kho vật tư', roles: ['admin', 'quanlykho'] },

        // Báo cáo & Thống kê
        { id: 'reports', href: 'reports.html', icon: 'fas fa-chart-line', label: role === 'quanlykho' ? 'Thống kê Kho vật tư' : 'Thống kê & Báo cáo', roles: ['admin', 'quanlykho', 'thungan'] }
    ];

    // Lọc menu theo vai trò
    const visibleItems = allMenuItems.filter(item => item.roles.includes(role));

    let navHTML = '';
    visibleItems.forEach(item => {
        const isActive = item.id === activePage ? ' class="active"' : '';
        navHTML += `<a href="${item.href}"${isActive}><span class="icon"><i class="${item.icon}"></i></span> ${item.label}</a>\n`;
    });

    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav) {
        sidebarNav.innerHTML = navHTML;
    }
}
