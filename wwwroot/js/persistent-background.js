// Khắc phục lỗi mất ảnh nền sau khi F5 và áp dụng cho tất cả user

document.addEventListener('DOMContentLoaded', function () {
    // Khởi tạo persistent background manager
    initPersistentBackgroundManager();
});

// Quản lý ảnh nền bền vững giữa các phiên làm việc
function initPersistentBackgroundManager() {
    console.log('🛠️ Initializing persistent background manager...');

    // Lưu trữ ảnh nền cho từng user đang chat
    const chatBackgroundsStorage = 'chat_backgrounds_settings';

    // Thêm hàm để lưu ảnh nền vào localStorage
    window.saveChatBackground = function (userId, backgroundImage) {
        if (!userId || !backgroundImage) {
            console.error('❌ Invalid parameters for saveChatBackground:', { userId, backgroundImage });
            return;
        }

        console.log(`💾 Saving background ${backgroundImage} for user ${userId}`);

        // Lấy dữ liệu hiện tại từ localStorage
        let backgrounds = JSON.parse(localStorage.getItem(chatBackgroundsStorage) || '{}');

        // Lưu ảnh nền cho user hiện tại
        backgrounds[userId] = backgroundImage;

        // Lưu lại vào localStorage
        localStorage.setItem(chatBackgroundsStorage, JSON.stringify(backgrounds));

        console.log('✅ Background saved successfully');
    };

    // Thêm hàm để load ảnh nền từ localStorage
    window.loadChatBackgroundFromStorage = function (userId) {
        if (!userId) {
            console.error('❌ Invalid userId for loadChatBackgroundFromStorage');
            return null;
        }

        console.log(`🔍 Loading background for user ${userId}`);

        // Lấy dữ liệu từ localStorage
        let backgrounds = JSON.parse(localStorage.getItem(chatBackgroundsStorage) || '{}');

        // Trả về ảnh nền cho user được chỉ định
        return backgrounds[userId] || null;
    };

    // Áp dụng ảnh nền cho từng user khi chọn user
    const originalSelectUser = window.selectUser;
    if (typeof originalSelectUser === 'function') {
        window.selectUser = function (userId, userName) {
            // Gọi hàm selectUser gốc
            originalSelectUser(userId, userName);

            // Sau khi chọn user, áp dụng ảnh nền từ localStorage nếu có
            setTimeout(function () {
                const savedBackground = window.loadChatBackgroundFromStorage(userId);
                if (savedBackground) {
                    console.log(`🎨 Applying saved background for ${userName}: ${savedBackground}`);
                    // Áp dụng ảnh nền đã lưu
                    applyBackgroundToChat(savedBackground);

                    // Cập nhật cài đặt hiện tại nếu có
                    if (typeof currentChatSettings !== 'undefined') {
                        currentChatSettings.backgroundImage = savedBackground;
                    }
                }
            }, 500);
        };

        console.log('✅ selectUser function enhanced for persistent backgrounds');
    }

    // Ghi đè hàm selectChatBackground
    const originalSelectChatBackground = window.selectChatBackground;
    if (typeof originalSelectChatBackground === 'function') {
        window.selectChatBackground = async function (backgroundImage) {
            // Gọi hàm gốc
            await originalSelectChatBackground(backgroundImage);

            // Lưu ảnh nền vào localStorage
            if (typeof currentChatPartnerId !== 'undefined' && currentChatPartnerId) {
                window.saveChatBackground(currentChatPartnerId, backgroundImage);
            }
        };

        console.log('✅ selectChatBackground function enhanced for persistence');
    }

    // Áp dụng ảnh nền cho user hiện tại ngay sau khi trang load
    setTimeout(function () {
        if (typeof selectedUserId !== 'undefined' && selectedUserId) {
            const savedBackground = window.loadChatBackgroundFromStorage(selectedUserId);
            if (savedBackground) {
                console.log(`🎨 Auto applying saved background for current user: ${savedBackground}`);
                applyBackgroundToChat(savedBackground);

                // Cập nhật cài đặt hiện tại nếu có
                if (typeof currentChatSettings !== 'undefined') {
                    currentChatSettings.backgroundImage = savedBackground;
                }
            }
        }
    }, 1000);

    console.log('✅ Persistent background manager initialized');
}