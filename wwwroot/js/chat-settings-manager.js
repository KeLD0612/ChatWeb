// chat-settings-manager.js - File hoàn chỉnh đã fix bug background

// Danh sách hình nền mẫu
let backgroundTemplates = ["default.jpg", "blue.jpg", "green.jpg", "purple.jpg"];

// Khởi tạo
function initChatSettingsManager() {
    console.log('🚀 Initializing chat settings manager...');

    // Thêm event listener cho modal
    setupModalEvents();

    // Lấy danh sách hình nền mẫu
    loadBackgroundTemplates();

    console.log('✅ Chat settings manager initialized');
}

// Setup events cho modal
function setupModalEvents() {
    const chatSettingsModal = document.getElementById('chatSettingsModal');
    if (chatSettingsModal) {
        chatSettingsModal.addEventListener('show.bs.modal', function () {
            if (selectedUserId) {
                console.log('🔍 Modal opened for user:', selectedUserId);

                // Render danh sách hình nền
                renderBackgroundTemplates();
            } else {
                console.error('❌ No user selected');
                showSettingsStatus('Vui lòng chọn người để chat trước', 'warning');
            }
        });
    } else {
        console.error('❌ Chat settings modal not found');
    }

    // Click vào avatar mở modal
    const chatAvatar = document.querySelector('.chat-avatar');
    if (chatAvatar) {
        chatAvatar.style.cursor = 'pointer';
        chatAvatar.title = 'Cài đặt đoạn chat';
    }
}

// Lấy danh sách hình nền mẫu
async function loadBackgroundTemplates() {
    try {
        console.log('🔍 Fetching background templates...');

        const response = await fetch('/ChatSettings/GetBackgroundTemplates', {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success && Array.isArray(data.backgrounds) && data.backgrounds.length > 0) {
            backgroundTemplates = data.backgrounds;
            console.log('✅ Loaded background templates:', backgroundTemplates.length);
        } else {
            console.warn('⚠️ No backgrounds from API, using defaults');
        }
    } catch (error) {
        console.error('❌ Error fetching backgrounds:', error);
    }
}

// HELPER FUNCTIONS CHO LOCALSTORAGE
function getUserBackgroundFromStorage(userId) {
    try {
        const saved = localStorage.getItem('chat_backgrounds_per_user');
        if (saved) {
            const backgrounds = JSON.parse(saved);
            return backgrounds[userId] || null;
        }
    } catch (e) {
        console.error('Error reading background from localStorage:', e);
    }
    return null;
}

function saveUserBackgroundToStorage(userId, backgroundImage) {
    try {
        const saved = localStorage.getItem('chat_backgrounds_per_user') || '{}';
        const backgrounds = JSON.parse(saved);
        backgrounds[userId] = backgroundImage;
        localStorage.setItem('chat_backgrounds_per_user', JSON.stringify(backgrounds));
        console.log(`💾 Saved ${backgroundImage} for user ${userId}`);
    } catch (e) {
        console.error('Error saving background to localStorage:', e);
    }
}

// Render danh sách hình nền trong modal
function renderBackgroundTemplates() {
    const bgGrid = document.getElementById('bgTemplatesGrid');
    if (!bgGrid) {
        console.error('❌ Background grid element not found');
        return;
    }

    // Xóa nội dung cũ
    bgGrid.innerHTML = '';

    // Lấy hình nền hiện tại của người dùng từ localStorage
    const currentBg = getUserBackgroundFromStorage(selectedUserId) || 'default.jpg';
    console.log(`🔍 Current background for ${selectedUserId}: ${currentBg}`);

    // Hiển thị từng hình nền mẫu
    backgroundTemplates.forEach(bg => {
        const isActive = bg === currentBg;

        const bgItem = document.createElement('div');
        bgItem.className = 'col-md-3 col-sm-4 col-6 mb-3';
        bgItem.innerHTML = `
            <div class="card h-100 bg-template-item ${isActive ? 'border-primary' : ''}" data-background="${bg}">
                <img src="/images/backgrounds/${bg}" class="card-img-top" alt="${bg}"
                     style="height: 120px; object-fit: cover; cursor: pointer;">
                <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
                    <small class="text-muted">${formatBackgroundName(bg)}</small>
                    ${isActive ? '<span class="badge bg-primary">Đang dùng</span>' : ''}
                </div>
            </div>
        `;

        bgGrid.appendChild(bgItem);

        // Thêm sự kiện click
        const card = bgItem.querySelector('.bg-template-item');
        if (card) {
            card.addEventListener('click', () => {
                selectChatBackground(bg);
            });
        }
    });

    // Cập nhật preview
    updateCurrentBackgroundPreview(currentBg);
}

// Cập nhật preview hình nền
function updateCurrentBackgroundPreview(backgroundImage) {
    const previewElement = document.querySelector('.current-bg-container');
    if (previewElement) {
        previewElement.style.backgroundImage = `url('/images/backgrounds/${backgroundImage}')`;
        previewElement.style.backgroundSize = 'cover';
        previewElement.style.backgroundPosition = 'center';
        previewElement.style.height = '150px';
        previewElement.style.borderRadius = '8px';
    }
}

// Format tên hiển thị của background
function formatBackgroundName(filename) {
    if (!filename) return 'Unknown';

    try {
        // Remove extension and replace dashes/underscores with spaces
        const name = filename.split('.')[0].replace(/[_-]/g, ' ');
        // Capitalize first letter of each word
        return name.replace(/\b\w/g, l => l.toUpperCase());
    } catch (error) {
        console.error('❌ Error formatting name:', error);
        return filename;
    }
}

// CHỌN HÌNH NỀN - ĐÃ FIX CHO TỪNG USER
async function selectChatBackground(backgroundImage) {
    console.log(`🎨 [FIXED] Selecting background: ${backgroundImage}`);

    if (!selectedUserId) {
        console.error('❌ No user selected!');
        showSettingsStatus('Vui lòng chọn người để chat trước', 'warning');
        return;
    }

    try {
        // Hiển thị loading
        showSettingsStatus('Đang thay đổi hình nền...', 'info');

        // Gọi API để lưu vào database
        const response = await fetch('/Chat/SaveUserBackground', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                userId: selectedUserId,
                backgroundImage: backgroundImage
            })
        });

        const result = await response.json();

        if (result.success) {
            // Áp dụng background cho user hiện tại
            applyBackgroundToChat(backgroundImage);

            // Lưu vào localStorage cho user này
            saveUserBackgroundToStorage(selectedUserId, backgroundImage);

            // Cập nhật UI
            updateBackgroundSelection(backgroundImage);

            showSettingsStatus('✅ Đã thay đổi hình nền thành công!', 'success');
            console.log(`✅ Background ${backgroundImage} saved for user ${selectedUserId}`);

        } else {
            throw new Error(result.error || 'Unknown error');
        }

    } catch (error) {
        console.error('❌ Error saving background:', error);
        showSettingsStatus('❌ Lỗi khi lưu hình nền: ' + error.message, 'danger');
    }
}

// Cập nhật giao diện khi chọn hình nền
function updateBackgroundSelection(backgroundImage) {
    // Xóa active cho tất cả
    document.querySelectorAll('.bg-template-item').forEach(item => {
        item.classList.remove('border-primary');
        const badge = item.querySelector('.badge');
        if (badge) badge.remove();
    });

    // Thêm active cho hình nền được chọn
    const selectedItem = document.querySelector(`.bg-template-item[data-background="${backgroundImage}"]`);
    if (selectedItem) {
        selectedItem.classList.add('border-primary');

        const footer = selectedItem.querySelector('.card-footer');
        if (footer && !footer.querySelector('.badge')) {
            footer.innerHTML += '<span class="badge bg-primary">Đang dùng</span>';
        }
    }

    // Cập nhật preview
    updateCurrentBackgroundPreview(backgroundImage);
}

// ÁP DỤNG HÌNH NỀN - ĐÃ FIX
function applyBackgroundToChat(backgroundImage) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) {
        console.error('❌ Messages container not found');
        return false;
    }

    try {
        if (!backgroundImage) {
            console.warn('⚠️ No background image provided, using default');
            backgroundImage = 'default.jpg';
        }

        // QUAN TRỌNG: Lưu background cho user hiện tại
        if (typeof selectedUserId !== 'undefined' && selectedUserId) {
            saveUserBackgroundToStorage(selectedUserId, backgroundImage);
            console.log(`💾 Saved background ${backgroundImage} for current user ${selectedUserId}`);
        }

        // Clear previous background
        messagesContainer.style.backgroundImage = '';

        // Add transition class
        messagesContainer.classList.add('bg-transition');

        // Set new background
        messagesContainer.style.backgroundImage = `url('/images/backgrounds/${backgroundImage}')`;
        messagesContainer.style.backgroundSize = 'cover';
        messagesContainer.style.backgroundPosition = 'center';
        messagesContainer.style.backgroundRepeat = 'no-repeat';
        messagesContainer.style.backgroundAttachment = 'fixed';

        console.log(`🎨 Applied background ${backgroundImage} to chat`);

        // Update UI selection if exists
        updateBackgroundSelection(backgroundImage);

        // Remove transition class sau animation
        setTimeout(() => {
            messagesContainer.classList.remove('bg-transition');
        }, 500);

        return true;
    } catch (error) {
        console.error('❌ Error applying background:', error);
        return false;
    }
}

// Hiển thị trạng thái trong modal cài đặt
function showSettingsStatus(message, type) {
    const statusElement = document.getElementById('chatSettingsStatus');
    if (statusElement) {
        statusElement.innerHTML = `<div class="alert alert-${type} mb-0 py-2 px-3">${message}</div>`;
        statusElement.style.display = 'block';

        // Tự động ẩn thông báo sau vài giây
        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }
}

// CSS để tránh khoảng trắng và làm cho thẻ img có thể click được
function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #messagesContainer {
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-attachment: fixed !important;
            margin: 0 !important;
            padding: 1rem !important;
            overflow: auto !important;
        }

        .bg-template-item {
            transition: transform 0.2s, border-color 0.2s !important;
            cursor: pointer !important;
        }

        .bg-template-item:hover {
            transform: translateY(-5px) !important;
            border-color: #0d6efd !important;
        }

        .bg-template-item img {
            cursor: pointer !important;
            transition: transform 0.2s !important;
            width: 100% !important;
        }

        .bg-template-item img:hover {
            transform: scale(1.05) !important;
        }

        .card {
            overflow: hidden !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
        }

        .modal-body {
            padding-top: 0 !important;
        }

        .tab-content {
            padding-top: 20px !important;
        }

        .current-bg-container {
            border: 2px solid #dee2e6;
            transition: background-image 0.3s;
        }

        .bg-transition {
            transition: background-image 0.5s ease-in-out !important;
        }
    `;
    document.head.appendChild(style);
}

// Thêm hàm debug để kiểm tra trạng thái
function debugBackgrounds() {
    console.log('=== DEBUG BACKGROUNDS ===');
    console.log('Current user ID:', selectedUserId);

    // Debug localStorage
    const saved = localStorage.getItem('chat_backgrounds_per_user');
    console.log('LocalStorage backgrounds:', saved ? JSON.parse(saved) : 'None');

    console.log('Background templates:', backgroundTemplates);

    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        console.log('Current background CSS:', messagesContainer.style.backgroundImage);
    }

    console.log('=== END DEBUG ===');
}

// Khởi tạo khi DOM đã load
document.addEventListener('DOMContentLoaded', function () {
    // Thêm CSS tùy chỉnh
    addCustomStyles();

    // Khởi tạo manager
    setTimeout(initChatSettingsManager, 800);

    // Thêm hàm debug vào window để gọi từ console
    window.debugBackgrounds = debugBackgrounds;
});

// Export functions
window.selectChatBackground = selectChatBackground;
window.applyBackgroundToChat = applyBackgroundToChat;