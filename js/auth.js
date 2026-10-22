// ==========================================
// TechCare Pro - Authentication & Helpers
// ==========================================

/**
 * Handle Login with Email and Password
 * Automatically routes admin/staff to admin/dashboard.html and customer to user/dashboard.html
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
            // If user doc doesn't exist, check if admin or fallback
            if (email.toLowerCase().includes('admin')) {
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    fullName: 'Quản trị viên Hệ thống',
                    role: 'admin',
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.location.href = 'admin/dashboard.html';
                return;
            } else {
                // Default to customer
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    fullName: user.displayName || user.email.split('@')[0],
                    role: 'khachhang',
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.location.href = 'user/dashboard.html';
                return;
            }
        }

        const userData = userDoc.data();

        // Check if account is locked
        if (userData.status === 'locked' || userData.status === 'inactive') {
            await auth.signOut();
            throw new Error('Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động. Vui lòng liên hệ Admin!');
        }

        const role = userData.role || 'khachhang';

        // Role-based routing
        const adminRoles = ['admin', 'nhanvien_tiepnhan', 'ktv', 'thungan', 'quanlykho'];
        if (adminRoles.includes(role)) {
            window.location.href = 'admin/dashboard.html';
        } else {
            window.location.href = 'user/dashboard.html';
        }
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
 * Customers CANNOT register as admin or staff
 */
async function registerCustomer(fullName, email, phone, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update profile displayName
        await user.updateProfile({
            displayName: fullName
        });

        // Send Email Verification (US.07)
        try {
            await user.sendEmailVerification();
        } catch (evErr) {
            console.warn('Email verification send notice:', evErr);
        }

        // Save into Firestore 'users' collection with role 'khachhang'
        await db.collection('users').doc(user.uid).set({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : '',
            role: 'khachhang', // KHÁCH HÀNG LUÔN LÀ KHACHHANG, KHÔNG THỂ LÀM ADMIN
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

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
 * Send password reset email (US.06)
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
                window.location.href = redirectUrl;
                return;
            }
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    window.location.href = redirectUrl;
                    return;
                }
                const userData = userDoc.data();
                if (userData.status === 'locked' || userData.status === 'inactive') {
                    alert('Tài khoản của bạn đã bị khóa!');
                    await auth.signOut();
                    window.location.href = redirectUrl;
                    return;
                }
                // If user is admin/staff trying to access user page, redirect to admin
                const adminRoles = ['admin', 'nhanvien_tiepnhan', 'ktv', 'thungan', 'quanlykho'];
                if (adminRoles.includes(userData.role)) {
                    window.location.href = '../admin/dashboard.html';
                    return;
                }
                resolve({ user, userData });
            } catch (err) {
                console.error('Customer auth check error:', err);
                window.location.href = redirectUrl;
            }
        });
    });
}

/**
 * Check Authentication for Admin/Staff Pages
 */
function checkAdminAuth(redirectUrl = '../index.html') {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = redirectUrl;
                return;
            }
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    window.location.href = redirectUrl;
                    return;
                }
                const userData = userDoc.data();
                if (userData.status === 'locked' || userData.status === 'inactive') {
                    alert('Tài khoản của bạn đã bị khóa!');
                    await auth.signOut();
                    window.location.href = redirectUrl;
                    return;
                }

                const adminRoles = ['admin', 'nhanvien_tiepnhan', 'ktv', 'thungan', 'quanlykho'];
                if (!adminRoles.includes(userData.role)) {
                    // It's a regular customer trying to access admin
                    alert('Bạn không có quyền truy cập trang quản trị!');
                    window.location.href = '../user/dashboard.html';
                    return;
                }

                resolve({ user, userData });
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
    // Create a temporary secondary Firebase app
    const secondaryApp = firebase.initializeApp(firebaseConfig, 'SecondaryApp_' + Date.now());
    const secondaryAuth = secondaryApp.auth();

    try {
        // Create user in Firebase Auth via secondary app
        const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // Sign out the secondary app immediately
        await secondaryAuth.signOut();

        // Save user profile to Firestore using the real UID from Auth
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
        // Always clean up the secondary app
        try { await secondaryApp.delete(); } catch(e) {}
    }
}

/**
 * Generate role-based sidebar navigation
 * Each role only sees menu items relevant to their job
 */
function generateSidebar(role, activePage) {
    // Define all possible menu items
    const allMenuItems = [
        { id: 'dashboard', href: 'dashboard.html', icon: 'fas fa-tachometer-alt', label: 'Dashboard', roles: ['admin', 'nhanvien_tiepnhan', 'ktv', 'thungan', 'quanlykho'] },
        { id: 'tickets', href: 'tickets.html', icon: 'fas fa-ticket-alt', label: 'Quản lý Phiếu SC', roles: ['admin', 'nhanvien_tiepnhan', 'thungan'] },
        { id: 'ktv-workspace', href: 'ktv-workspace.html', icon: 'fas fa-tools', label: 'Phiếu SC của tôi', roles: ['ktv'] },
        { id: 'sale-workspace', href: 'sale-workspace.html', icon: 'fas fa-store', label: 'Tra cứu Kho & Bán hàng', roles: ['nhanvien_tiepnhan'] },
        { id: 'services', href: 'services.html', icon: 'fas fa-cogs', label: 'Danh mục Dịch vụ', roles: ['admin', 'nhanvien_tiepnhan'] },
        { id: 'employees', href: 'employees.html', icon: 'fas fa-users-cog', label: 'Quản lý Nhân sự', roles: ['admin'] },
        { id: 'schedules', href: 'schedules.html', icon: 'fas fa-calendar-alt', label: 'Lịch trực KTV', roles: ['admin', 'ktv'] },
        { id: 'inventory', href: 'inventory.html', icon: 'fas fa-boxes', label: 'Quản lý Kho vật tư', roles: ['admin', 'quanlykho'] },
        { id: 'warehouse', href: 'warehouse.html', icon: 'fas fa-warehouse', label: 'Kho & Yêu cầu LK', roles: ['ktv'] },
        { id: 'reports', href: 'reports.html', icon: 'fas fa-chart-line', label: 'Thống kê & Báo cáo', roles: ['admin', 'quanlykho', 'thungan'] }
    ];

    // Filter items by role
    const visibleItems = allMenuItems.filter(item => item.roles.includes(role));

    // Build sidebar HTML
    let navHTML = '';
    visibleItems.forEach(item => {
        const isActive = item.id === activePage ? ' class="active"' : '';
        navHTML += `<a href="${item.href}"${isActive}><span class="icon"><i class="${item.icon}"></i></span> ${item.label}</a>\n`;
    });

    // Apply to sidebar
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav) {
        sidebarNav.innerHTML = navHTML;
    }
}
