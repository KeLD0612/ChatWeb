// ===================================
// FILE: wwwroot/js/notification.js
// Notification page functionality
// ===================================

// Initialize notification functionality
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔔 Notification page loaded');
    setupNotificationFeatures();
    setupAutoRefresh();
});

// Setup notification features
function setupNotificationFeatures() {
    // Setup click handlers for notification items
    setupNotificationClickHandlers();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
}

// Setup click handlers
function setupNotificationClickHandlers() {
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function (e) {
            // Don't trigger if clicking on buttons
            if (e.target.closest('.notification-actions')) {
                return;
            }

            // Mark as read when clicked
            const notificationId = this.dataset.notificationId;
            if (this.classList.contains('unread')) {
                markAsRead(parseInt(notificationId));
            }
        });
    });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            markAllAsRead();
        }
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            refreshNotifications();
        }
    });
}

// Mark single notification as read
async function markAsRead(notificationId) {
    try {
        showLoading();

        const response = await fetch('/Notification/MarkAsRead', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getAntiForgeryToken()
            },
            body: JSON.stringify({ notificationId: notificationId })
        });

        const data = await response.json();

        if (data.success) {
            const item = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (item) {
                // Update UI
                item.classList.remove('unread');
                item.classList.add('read');

                // Remove mark as read button
                const markBtn = item.querySelector('.btn-outline-primary');
                if (markBtn && markBtn.onclick && markBtn.onclick.toString().includes('markAsRead')) {
                    markBtn.style.display = 'none';
                }

                // Add animation
                item.style.animation = 'notification-read 0.5s ease-out';
            }

            updateGlobalNotificationCount(data.unreadCount);
            showToast('Đã đánh dấu là đã đọc', 'success');

            // Update header if needed
            updateNotificationHeader(data.unreadCount);
        } else {
            showToast(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error marking as read:', error);
        showToast('Có lỗi xảy ra', 'error');
    } finally {
        hideLoading();
    }
}

// Mark all notifications as read
async function markAllAsRead() {
    if (!confirm('Bạn có chắc muốn đánh dấu tất cả thông báo là đã đọc?')) {
        return;
    }

    try {
        showLoading();

        const response = await fetch('/Notification/MarkAsRead', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getAntiForgeryToken()
            },
            body: JSON.stringify({ notificationId: null })
        });

        const data = await response.json();

        if (data.success) {
            // Update all unread items
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
                item.classList.add('read');

                const markBtn = item.querySelector('.btn-outline-primary');
                if (markBtn && markBtn.onclick && markBtn.onclick.toString().includes('markAsRead')) {
                    markBtn.style.display = 'none';
                }
            });

            updateGlobalNotificationCount(0);
            showToast('Đã đánh dấu tất cả là đã đọc', 'success');

            // Update header
            updateNotificationHeader(0);
        } else {
            showToast(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error marking all as read:', error);
        showToast('Có lỗi xảy ra', 'error');
    } finally {
        hideLoading();
    }
}

// Delete notification
async function deleteNotification(notificationId) {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) {
        return;
    }

    try {
        showLoading();

        const response = await fetch('/Notification/DeleteNotification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getAntiForgeryToken()
            },
            body: JSON.stringify({ notificationId: notificationId })
        });

        const data = await response.json();

        if (data.success) {
            const item = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (item) {
                // Add delete animation
                item.classList.add('deleting');

                setTimeout(() => {
                    item.remove();

                    // Check if no notifications left
                    const remainingNotifications = document.querySelectorAll('.notification-item');
                    if (remainingNotifications.length === 0) {
                        showEmptyState();
                    }
                }, 300);
            }

            updateGlobalNotificationCount(data.unreadCount);
            showToast('Đã xóa thông báo', 'success');

            // Update header
            updateNotificationHeader(data.unreadCount);
        } else {
            showToast(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        showToast('Có lỗi xảy ra', 'error');
    } finally {
        hideLoading();
    }
}

// Refresh notifications
async function refreshNotifications() {
    try {
        showLoading();
        location.reload();
    } catch (error) {
        console.error('Error refreshing notifications:', error);
        showToast('Có lỗi xảy ra', 'error');
        hideLoading();
    }
}

// Action button handlers
function viewProfile(userId) {
    window.location.href = `/Profile/View/${userId}`;
}

function openChat(userId) {
    window.location.href = `/Chat?userId=${userId}`;
}

// Update notification header
function updateNotificationHeader(unreadCount) {
    const badge = document.querySelector('.notification-header .badge');
    const markAllBtn = document.querySelector('button[onclick="markAllAsRead()"]');

    if (unreadCount > 0) {
        if (badge) {
            badge.textContent = `${unreadCount} chưa đọc`;
        } else {
            // Create badge if doesn't exist
            const header = document.querySelector('.notification-header h2');
            if (header) {
                const newBadge = document.createElement('span');
                newBadge.className = 'badge bg-danger ms-2';
                newBadge.textContent = `${unreadCount} chưa đọc`;
                header.appendChild(newBadge);
            }
        }

        if (markAllBtn) {
            markAllBtn.style.display = 'inline-block';
        }
    } else {
        if (badge) {
            badge.remove();
        }
        if (markAllBtn) {
            markAllBtn.style.display = 'none';
        }
    }
}

// Show empty state
function showEmptyState() {
    const container = document.getElementById('notificationsList');
    if (container) {
        container.innerHTML = `
            <div class="empty-notifications text-center">
                <i class="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                <h4>Không có thông báo nào</h4>
                <p class="text-muted">Khi có thông báo mới, chúng sẽ hiển thị ở đây.</p>
            </div>
        `;
    }
}

// Setup auto refresh every 30 seconds
function setupAutoRefresh() {
    setInterval(() => {
        loadNotificationCount();
    }, 30000);
}

// Load notification count for header
async function loadNotificationCount() {
    try {
        const response = await fetch('/Notification/GetNotificationCount');
        const data = await response.json();

        if (data.success) {
            updateGlobalNotificationCount(data.count);
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

// Update global notification count (for header)
function updateGlobalNotificationCount(count) {
    const badge = document.getElementById('notificationCount');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count.toString();
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Show loading indicator
function showLoading() {
    const loading = document.getElementById('loadingNotifications');
    if (loading) {
        loading.style.display = 'block';
    }
}

// Hide loading indicator
function hideLoading() {
    const loading = document.getElementById('loadingNotifications');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const toastBody = toast.querySelector('.toast-body');

    if (toast && toastBody) {
        toastBody.textContent = message;
        toast.className = `toast ${type}`;

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
}

// Get anti-forgery token
function getAntiForgeryToken() {
    const token = document.querySelector('input[name="__RequestVerificationToken"]');
    return token ? token.value : '';
}