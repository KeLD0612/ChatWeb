// user-selection.js - FULL CODE ĐÃ FIX BUG BACKGROUND

function toggleDebug() {
    debugMode = !debugMode;
    const debugPanel = document.getElementById('debugPanel');
    if (debugMode) {
        debugPanel.style.display = 'block';
        updateDebugInfo();
        console.log('🐛 Debug mode enabled');
    } else {
        debugPanel.style.display = 'none';
        console.log('🐛 Debug mode disabled');
    }
}

function updateDebugInfo() {
    if (!debugMode) return;

    document.getElementById('debugUrl').textContent = window.location.href;
    document.getElementById('debugUserId').textContent = selectedUserId || 'None';
    document.getElementById('debugUserName').textContent = selectedUserName || 'None';

    const userElement = document.querySelector(`[data-user-id="${selectedUserId}"]`);
    document.getElementById('debugUserFound').textContent = userElement ? 'Yes' : 'No';

    const totalUsers = document.querySelectorAll('.user-item').length;
    document.getElementById('debugTotalUsers').textContent = totalUsers;

    document.getElementById('debugStrategy').textContent = lastSearchStrategy;

    const signalRStatus = connection && connection.state === 'Connected' ? 'Connected' : 'Disconnected';
    document.getElementById('debugSignalR').textContent = signalRStatus;
}

function forceSelectUser() {
    if (selectedUserId && selectedUserName) {
        console.log('🔧 Force selecting user...');
        selectUser(selectedUserId, selectedUserName);
    } else {
        alert('No user data to force select');
    }
}

function listAllUsers() {
    console.log('📋 === ALL USERS IN SIDEBAR ===');
    const userItems = document.querySelectorAll('.user-item');
    userItems.forEach((item, index) => {
        const userId = item.getAttribute('data-user-id');
        const userName = item.getAttribute('data-user-name');
        console.log(`${index + 1}. ID: "${userId}", Name: "${userName}"`);

        if (userId === selectedUserId) {
            console.log('   ✅ THIS IS THE SELECTED USER');
        }
    });

    if (userItems.length === 0) {
        console.log('❌ No users found in sidebar');
    }
}

function testAutoSelect() {
    console.log('🧪 Testing auto-select with current parameters...');
    const urlParams = new URLSearchParams(window.location.search);
    const testUserId = urlParams.get('userId');
    const testUserName = urlParams.get('userName');

    if (testUserId && testUserName) {
        selectUser(testUserId, decodeURIComponent(testUserName));
    } else {
        alert('No URL parameters found for testing');
    }
}

// HÀMSTORAGES HỖ TRỢ CHO BACKGROUND
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

// HÀM SELECT USER ĐÃ FIX
function selectUser(userId, userName) {
    console.log('🎯 === SELECT USER CALLED ===');
    console.log('Input userId:', userId);
    console.log('Input userName:', userName);
    console.log('Type of userId:', typeof userId);
    console.log('Type of userName:', typeof userName);

    lastSearchStrategy = 'none';

    if (!userId) {
        console.error('❌ userId is null, undefined, or empty');
        lastSearchStrategy = 'failed-no-userid';
        updateDebugInfo();
        return;
    }

    if (!userName) {
        console.error('❌ userName is null, undefined, or empty');
        lastSearchStrategy = 'failed-no-username';
        updateDebugInfo();
        return;
    }

    if (userId.trim() === '') {
        console.error('❌ userId is empty string after trim');
        lastSearchStrategy = 'failed-empty-userid';
        updateDebugInfo();
        return;
    }

    if (userName.trim() === '') {
        console.error('❌ userName is empty string after trim');
        lastSearchStrategy = 'failed-empty-username';
        updateDebugInfo();
        return;
    }

    selectedUserId = userId.trim();
    selectedUserName = userName.trim();

    console.log('✅ Validation passed');
    console.log('Cleaned userId:', selectedUserId);
    console.log('Cleaned userName:', selectedUserName);

    document.getElementById('selectedUserName').textContent = selectedUserName;
    document.getElementById('chatHeader').classList.remove('d-none');
    document.getElementById('noChatSelected').style.display = 'none';

    const controls = ['messageInput', 'sendButton', 'attachButton', 'voiceButton', 'audioCallButton', 'videoCallButton'];
    controls.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = false;
            if (id === 'messageInput') {
                element.placeholder = `Nhắn tin với ${selectedUserName}...`;
                setTimeout(() => element.focus(), 100);
            }
        }
    });

    console.log('✅ UI updated and controls enabled');

    let selectedUserElement = null;

    console.log('🔍 Strategy 1: Searching by exact ID match...');
    selectedUserElement = document.querySelector(`[data-user-id="${selectedUserId}"]`);
    if (selectedUserElement) {
        lastSearchStrategy = 'exact-id-match';
        console.log('✅ Found by exact ID match');
    } else {
        console.log('❌ Not found by exact ID match');
    }

    if (!selectedUserElement) {
        console.log('🔍 Strategy 2: Searching by exact name match...');
        selectedUserElement = document.querySelector(`[data-user-name="${selectedUserName}"]`);
        if (selectedUserElement) {
            lastSearchStrategy = 'exact-name-match';
            console.log('✅ Found by exact name match');
        } else {
            console.log('❌ Not found by exact name match');
        }
    }

    if (!selectedUserElement) {
        console.log('🔍 Strategy 3: Searching by case-insensitive name...');
        const userItems = document.querySelectorAll('.user-item');
        userItems.forEach((item, index) => {
            const itemUserName = item.getAttribute('data-user-name');
            console.log(`  Checking item ${index}: "${itemUserName}"`);
            if (itemUserName && itemUserName.toLowerCase() === selectedUserName.toLowerCase()) {
                selectedUserElement = item;
                lastSearchStrategy = 'case-insensitive-name';
                console.log('✅ Found by case-insensitive name match');
            }
        });
        if (!selectedUserElement) {
            console.log('❌ Not found by case-insensitive name');
        }
    }

    if (!selectedUserElement) {
        console.log('🔍 Strategy 4: Searching by partial name match...');
        const userItems = document.querySelectorAll('.user-item');
        userItems.forEach((item, index) => {
            const itemUserName = item.getAttribute('data-user-name');
            if (itemUserName && itemUserName.toLowerCase().includes(selectedUserName.toLowerCase())) {
                selectedUserElement = item;
                lastSearchStrategy = 'partial-name-match';
                console.log(`✅ Found by partial name match at item ${index}`);
            }
        });
        if (!selectedUserElement) {
            console.log('❌ Not found by partial name match');
        }
    }

    if (!selectedUserElement) {
        console.log('🔍 Strategy 5: Searching by partial ID match...');
        const userItems = document.querySelectorAll('.user-item');
        userItems.forEach((item, index) => {
            const itemUserId = item.getAttribute('data-user-id');
            if (itemUserId && itemUserId.includes(selectedUserId)) {
                selectedUserElement = item;
                lastSearchStrategy = 'partial-id-match';
                console.log(`✅ Found by partial ID match at item ${index}`);
            }
        });
        if (!selectedUserElement) {
            console.log('❌ Not found by partial ID match');
        }
    }

    if (!selectedUserElement) {
        console.log('🔍 Strategy 6: Brute force search with detailed logging...');
        const userItems = document.querySelectorAll('.user-item');
        console.log(`Total items to search: ${userItems.length}`);

        userItems.forEach((item, index) => {
            const itemUserId = item.getAttribute('data-user-id');
            const itemUserName = item.getAttribute('data-user-name');

            console.log(`Item ${index}:`);
            console.log(`  data-user-id: "${itemUserId}"`);
            console.log(`  data-user-name: "${itemUserName}"`);
            console.log(`  ID match: ${itemUserId === selectedUserId}`);
            console.log(`  Name match: ${itemUserName === selectedUserName}`);

            if (itemUserId === selectedUserId || itemUserName === selectedUserName) {
                selectedUserElement = item;
                lastSearchStrategy = 'brute-force-match';
                console.log(`✅ Found by brute force at item ${index}`);
            }
        });
    }

    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });

    if (selectedUserElement) {
        selectedUserElement.classList.add('active');
        selectedUserElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        console.log(`✅ User highlighted using strategy: ${lastSearchStrategy}`);
    } else {
        lastSearchStrategy = 'not-found';
        console.warn('⚠️ User not found in sidebar with any strategy');
        console.log('=== AVAILABLE USERS DEBUG ===');
        const userItems = document.querySelectorAll('.user-item');
        if (userItems.length === 0) {
            console.log('❌ NO USERS FOUND IN SIDEBAR AT ALL');
        } else {
            userItems.forEach((item, index) => {
                const itemUserId = item.getAttribute('data-user-id');
                const itemUserName = item.getAttribute('data-user-name');
                console.log(`${index + 1}. ID: "${itemUserId}", Name: "${itemUserName}"`);
            });
        }
    }

    // ============ PHẦN FIX BACKGROUND - THAY THẾ TOÀN BỘ ĐOẠN CŨ ============
    console.log('🎨 [FIXED] Loading chat background for user:', userId);

    // Bước 1: Lấy background từ localStorage trước (nhanh hơn)
    const savedBackground = getUserBackgroundFromStorage(userId);
    if (savedBackground) {
        console.log(`🎨 Applying saved background for user ${userId}: ${savedBackground}`);
        if (typeof applyBackgroundToChat === 'function') {
            applyBackgroundToChat(savedBackground);
        } else {
            // Fallback nếu hàm không tồn tại
            const messagesContainer = document.getElementById('messagesContainer');
            if (messagesContainer) {
                messagesContainer.style.backgroundImage = `url('/images/backgrounds/${savedBackground}')`;
                messagesContainer.style.backgroundSize = 'cover';
                messagesContainer.style.backgroundPosition = 'center';
                messagesContainer.style.backgroundRepeat = 'no-repeat';
                messagesContainer.style.backgroundAttachment = 'fixed';
            }
        }
    }

    // Bước 2: Fetch từ server để sync (nếu cần)
    fetch(`/ChatSettings/GetUserChatBackground?userId=${userId}`, {
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.backgroundImage) {
                console.log(`🔄 Background từ server: ${data.backgroundImage} cho user ${userId}`);

                // Chỉ apply nếu khác với localStorage
                if (data.backgroundImage !== savedBackground) {
                    console.log(`🔄 Server background different from localStorage, updating...`);

                    if (typeof applyBackgroundToChat === 'function') {
                        applyBackgroundToChat(data.backgroundImage);
                    } else {
                        // Fallback nếu hàm không tồn tại
                        const messagesContainer = document.getElementById('messagesContainer');
                        if (messagesContainer) {
                            messagesContainer.style.backgroundImage = `url('/images/backgrounds/${data.backgroundImage}')`;
                            messagesContainer.style.backgroundSize = 'cover';
                            messagesContainer.style.backgroundPosition = 'center';
                            messagesContainer.style.backgroundRepeat = 'no-repeat';
                            messagesContainer.style.backgroundAttachment = 'fixed';
                        }
                    }

                    // Cập nhật localStorage
                    saveUserBackgroundToStorage(userId, data.backgroundImage);
                } else {
                    console.log(`✅ Background already synced for user ${userId}`);
                }
            } else {
                console.log(`⚠️ No background found on server for user ${userId}`);
                // Nếu server không có background nhưng localStorage có, giữ nguyên localStorage
                if (!savedBackground) {
                    console.log(`🎨 Using default background for user ${userId}`);
                    if (typeof applyBackgroundToChat === 'function') {
                        applyBackgroundToChat('default.jpg');
                    }
                }
            }
        })
        .catch(error => {
            console.error('❌ Error loading chat background:', error);
            // Nếu lỗi, dùng background từ localStorage hoặc default
            if (!savedBackground) {
                console.log(`🎨 Error occurred, using default background`);
                if (typeof applyBackgroundToChat === 'function') {
                    applyBackgroundToChat('default.jpg');
                }
            } else {
                console.log(`🎨 Error occurred, keeping localStorage background: ${savedBackground}`);
            }
        });
    // ============ KẾT THÚC PHẦN FIX BACKGROUND ============

    console.log('📚 Loading chat history...');
    document.getElementById('messages').innerHTML = '';
    loadChatHistory(selectedUserId);

    // Update pinned messages sau khi load chat history
    setTimeout(() => {
        updatePinnedMessages();
    }, 200);

    updateDebugInfo();

    // Nếu có chức năng loadChatSettings, gọi nó để cập nhật background cho đoạn chat
    if (typeof loadChatSettings === 'function' && selectedUserId) {
        console.log('🔄 Loading chat settings for user:', selectedUserId);
        loadChatSettings(selectedUserId);
    }

    // Kích hoạt nút location nếu có
    const locationButton = document.getElementById('locationButton');
    if (locationButton) {
        locationButton.disabled = false;
    }

    console.log('✅ User selection completed');
    console.log(`Final strategy used: ${lastSearchStrategy}`);
    console.log('🎯 === END SELECT USER ===');
}