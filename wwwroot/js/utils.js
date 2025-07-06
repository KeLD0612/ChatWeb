function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.className = `connection-status ${status}`;
        switch (status) {
            case 'connected':
                statusElement.innerHTML = '<i class="fas fa-wifi"></i> Connected';
                break;
            case 'connecting':
                statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
                break;
            case 'disconnected':
                statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Disconnected';
                break;
        }
    } else {
        // console.log('Connection status element not found, skipping UI update.');
    }
}



// ========== DEBUG PINNED MESSAGES ==========

function debugPinnedMessages() {
    console.log('🔍 DEBUG: Checking pinned messages...');

    // Check all message elements
    const allMessages = document.querySelectorAll('.message-item');
    console.log('📝 Total messages found:', allMessages.length);

    // Check pinned messages by data attribute
    const pinnedByAttribute = document.querySelectorAll('.message-item[data-is-pinned="true"]');
    console.log('📌 Pinned by data-is-pinned="true":', pinnedByAttribute.length);

    // Check pinned messages by class
    const pinnedByClass = document.querySelectorAll('.message-item.pinned-message');
    console.log('📌 Pinned by class "pinned-message":', pinnedByClass.length);

    // Log each pinned message details
    pinnedByAttribute.forEach((element, index) => {
        console.log(`📌 Pinned message ${index + 1}:`, {
            id: element.id,
            messageId: element.dataset.messageId,
            isPinned: element.dataset.isPinned,
            classes: element.className,
            content: element.querySelector('.message-content')?.textContent?.substring(0, 50)
        });
    });

    // Check if pinned header exists
    const existingHeader = document.querySelector('.pinned-messages-header');
    console.log('📋 Existing pinned header:', existingHeader ? 'Found' : 'Not found');

    return {
        totalMessages: allMessages.length,
        pinnedCount: pinnedByAttribute.length,
        hasHeader: !!existingHeader
    };
}

// ========== IMPROVED UPDATE FUNCTION ==========

function updatePinnedMessagesHeader() {
    console.log('🔄 Starting updatePinnedMessagesHeader...');

    // Debug first
    const debugInfo = debugPinnedMessages();

    // Find all pinned messages
    const pinnedElements = document.querySelectorAll('.message-item[data-is-pinned="true"]');
    const pinnedCount = pinnedElements.length;

    console.log(`📌 Found ${pinnedCount} pinned messages to process`);

    // Find chat header container
    const chatHeaderDiv = document.getElementById('chatHeader');
    if (!chatHeaderDiv) {
        console.error('❌ Chat header div not found');
        return;
    }

    // Remove existing pinned header
    const existingHeader = document.querySelector('.pinned-messages-header');
    if (existingHeader) {
        console.log('🗑️ Removing existing pinned header');
        existingHeader.remove();
    }

    if (pinnedCount > 0) {
        // Create new pinned header
        const pinnedHeader = document.createElement('div');
        pinnedHeader.className = 'pinned-messages-header';

        // Generate dropdown items
        const dropdownItems = generatePinnedDropdownItems(pinnedElements);

        pinnedHeader.innerHTML = `
            <div class="pinned-indicator" onclick="showPinnedMessagesDropdown(event)">
                <i class="fas fa-thumbtack"></i>
                <span>+${pinnedCount} ghim</span>
                <i class="fas fa-chevron-down ms-1"></i>
            </div>
            <div class="pinned-dropdown" id="pinnedDropdown" style="display: none;">
                ${dropdownItems}
            </div>
        `;

        // Insert after chat header
        const chatHeaderParent = chatHeaderDiv.parentNode;
        if (chatHeaderParent) {
            // Insert right after chatHeader div
            chatHeaderParent.insertBefore(pinnedHeader, chatHeaderDiv.nextSibling);
            console.log('✅ Pinned header created and inserted');
        } else {
            console.error('❌ Chat header parent not found');
        }

        // Apply styles if not already applied
        addPinnedHeaderStyles();

        console.log(`✅ Pinned header updated with ${pinnedCount} messages`);
    } else {
        console.log('📭 No pinned messages found, header removed');
    }

    // Final debug
    setTimeout(() => {
        const finalHeader = document.querySelector('.pinned-messages-header');
        console.log('🏁 Final check - Header exists:', !!finalHeader);
    }, 100);
}

function generatePinnedDropdownItems(pinnedElements) {
    if (pinnedElements.length === 0) {
        return '<div class="dropdown-item-text text-muted p-3">Chưa có tin nhắn nào được ghim</div>';
    }

    let items = '';
    pinnedElements.forEach(element => {
        const messageId = element.dataset.messageId;
        const messageContent = element.querySelector('.message-content');
        const senderElement = element.querySelector('.message-sender');

        if (messageContent && senderElement && messageId) {
            // Get text content, removing HTML tags
            let content = messageContent.textContent || messageContent.innerText || '';

            // Remove extra whitespace and newlines
            content = content.replace(/\s+/g, ' ').trim();

            const sender = senderElement.textContent || 'Unknown';

            // Truncate content if too long
            const truncatedContent = content.length > 50 ? content.substring(0, 50) + '...' : content;

            items += `
                <div class="pinned-dropdown-item">
                    <div class="pinned-item-content" onclick="scrollToPinnedMessage('message-${messageId}')">
                        <div class="pinned-sender">${sender}</div>
                        <div class="pinned-text">${truncatedContent}</div>
                    </div>
                    <button class="btn-unpin-small" onclick="event.stopPropagation(); unpinMessage('message-${messageId}')" title="Bỏ ghim">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }
    });

    return items;
}

// ========== FORCE UPDATE AFTER CHAT LOAD ==========

function forceUpdatePinnedHeader() {
    console.log('🚀 Force updating pinned header...');

    // Wait a bit longer for DOM to be fully ready
    setTimeout(() => {
        console.log('⏰ Executing delayed pinned header update...');
        updatePinnedMessagesHeader();

        // Double check after another delay
        setTimeout(() => {
            const header = document.querySelector('.pinned-messages-header');
            if (!header) {
                console.warn('⚠️ Header still not found, trying one more time...');
                updatePinnedMessagesHeader();
            }
        }, 500);
    }, 300);
}

// ========== MANUAL TRIGGER FUNCTIONS ==========

function manualUpdatePinnedMessages() {
    console.log('🔧 Manual update triggered...');
    debugPinnedMessages();
    updatePinnedMessagesHeader();
}

// Add to window for debugging
window.debugPinnedMessages = debugPinnedMessages;
window.updatePinnedMessagesHeader = updatePinnedMessagesHeader;
window.forceUpdatePinnedHeader = forceUpdatePinnedHeader;
window.manualUpdatePinnedMessages = manualUpdatePinnedMessages;

// ========== IMPROVED STYLES ==========

function addPinnedHeaderStyles() {
    if (document.getElementById('pinnedHeaderStyles')) return;

    const style = document.createElement('style');
    style.id = 'pinnedHeaderStyles';
    style.textContent = `
        .pinned-messages-header {
            background: linear-gradient(135deg, #fff7e6, #fff1d9);
            border-bottom: 1px solid #ffd700;
            padding: 10px 16px;
            position: relative;
            box-shadow: 0 2px 4px rgba(255, 215, 0, 0.1);
            z-index: 10;
        }
        
        .pinned-indicator {
            display: flex;
            align-items: center;
            cursor: pointer;
            color: #b8860b;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
            user-select: none;
            padding: 4px 0;
        }
        
        .pinned-indicator:hover {
            color: #daa520;
            transform: translateY(-1px);
        }
        
        .pinned-indicator i.fa-thumbtack {
            margin-right: 8px;
            font-size: 13px;
        }
        
        .pinned-indicator span {
            margin-right: 6px;
        }
        
        .pinned-indicator i.fa-chevron-down {
            font-size: 10px;
            transition: transform 0.2s ease;
        }
        
        .pinned-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 4px;
        }
        
        .pinned-dropdown-item {
            padding: 12px 16px;
            cursor: pointer;
            transition: background 0.2s;
            border-bottom: 1px solid #f0f2f5;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .pinned-dropdown-item:last-child {
            border-bottom: none;
        }
        
        .pinned-dropdown-item:hover {
            background: #f8f9fa;
        }
        
        .pinned-item-content {
            flex: 1;
            min-width: 0;
            padding-right: 12px;
            cursor: pointer;
        }
        
        .pinned-sender {
            font-weight: 600;
            color: #1877f2;
            font-size: 13px;
            margin-bottom: 2px;
        }
        
        .pinned-text {
            color: #65676b;
            font-size: 13px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.2;
        }
        
        .btn-unpin-small {
            background: none;
            border: none;
            color: #8a8d91;
            padding: 6px;
            cursor: pointer;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        
        .btn-unpin-small:hover {
            background: #f0f2f5;
            color: #e41e3f;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
}

console.log('📌 Pinned messages debug system loaded');




function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function loadChatHistory(userId) {
    console.log('📚 Loading chat history for userId:', userId);

    if (!userId) {
        console.error('❌ Invalid userId for chat history');
        return;
    }

    const encodedUserId = encodeURIComponent(userId);
    const url = `/Chat/GetMessages?userId=${encodedUserId}`;
    console.log('Fetching from URL:', url);

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin' // Quan trọng cho authentication
    })
        .then(async response => {
            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            // Check for error response
            if (data.error || data.success === false) {
                throw new Error(data.error || 'Unknown error');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return data;
        })
        .then(messages => {
            console.log('📚 Messages to display:', messages);

            // Debug xem có reply info không
            messages.forEach(msg => {
                if (msg.repliedMessageId) {
                    console.log('Found reply message:', msg);
                }
                // Debug xem có pinned info không
                if (msg.isPinned) {
                    console.log('📌 Found pinned message:', msg);
                }
                // Debug xem có reactions không
                if (msg.reactions && msg.reactions.length > 0) {
                    console.log('😊 Found message with reactions:', msg);
                }
            });

            if (!Array.isArray(messages)) {
                console.error('Messages is not an array:', messages);
                throw new Error('Invalid response format');
            }

            if (messages.length > 0) {
                const messagesDiv = document.getElementById('messages');
                if (messagesDiv) {
                    messagesDiv.innerHTML = ''; // Clear old messages
                }

                messages.forEach((msg, index) => {
                    try {
                        displayMessage({
                            id: msg.id,
                            senderId: msg.senderId,
                            senderName: msg.senderName,
                            content: msg.content,
                            messageType: msg.messageType || 'text',
                            timestamp: msg.timestamp,
                            isSender: msg.isSender,
                            isRecalled: msg.isRecalled,
                            isDeletedByReceiver: msg.isDeletedByReceiver,
                            repliedMessageId: msg.repliedMessageId,
                            repliedMessage: msg.repliedMessage,
                            isPinned: msg.isPinned,  // ✅ FIX: Thêm isPinned
                            reactions: msg.reactions  // THÊM DÒNG NÀY ĐỂ LOAD REACTIONS
                        });
                    } catch (err) {
                        console.error(`Error displaying message ${index}:`, err, msg);
                    }
                });

                // ✅ FIX: Update pinned messages header sau khi load xong
                setTimeout(() => {
                    updatePinnedMessagesHeader();
                }, 200);

                scrollToBottom();
            } else {
                console.log('📭 No messages found');
            }
        })
        .catch(err => {
            console.error('❌ Error loading chat history:', err);
            showNotification('Không thể tải lịch sử chat. Vui lòng thử lại sau.', 'error');
        });
}

// ✅ FIX: Thêm hàm load pinned messages
function loadPinnedMessages() {
    if (!selectedUserId) return;

    console.log('🔍 Loading pinned messages...');

    // Tìm tất cả tin nhắn được pin trong DOM
    const pinnedElements = document.querySelectorAll('.message-item[data-is-pinned="true"]');
    const pinnedDropdown = document.querySelector('#pinnedMessagesDropdown .dropdown-menu');

    if (!pinnedDropdown) {
        console.warn('Pinned dropdown not found');
        return;
    }

    // Clear existing pinned items
    pinnedDropdown.innerHTML = '';

    if (pinnedElements.length === 0) {
        pinnedDropdown.innerHTML = '<div class="dropdown-item-text text-muted">Chưa có tin nhắn nào được ghim</div>';
        return;
    }

    pinnedElements.forEach(element => {
        const messageId = element.dataset.messageId;
        const messageContent = element.querySelector('.message-content');
        const senderElement = element.querySelector('.message-sender');

        if (messageContent && senderElement) {
            const content = messageContent.textContent || messageContent.innerText || '';
            const sender = senderElement.textContent || 'Unknown';

            const pinnedItem = document.createElement('div');
            pinnedItem.className = 'pinned-dropdown-item';
            pinnedItem.innerHTML = `
                <div class="pinned-item-content" onclick="scrollToMessage('message-${messageId}')">
                    <div class="pinned-sender">${sender}</div>
                    <div class="pinned-text">${content.substring(0, 50)}${content.length > 50 ? '...' : ''}</div>
                </div>
                <button class="btn-unpin-small" onclick="togglePinMessage(${messageId}, false, 'message-${messageId}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            pinnedDropdown.appendChild(pinnedItem);
        }
    });

    console.log(`✅ Loaded ${pinnedElements.length} pinned messages`);
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Sticker utilities
function isValidStickerUrl(url) {
    const validExtensions = ['.gif', '.png', '.jpg', '.jpeg', '.webp'];
    const validDomains = ['tenor.com', 'giphy.com', 'media.tenor.com'];

    try {
        const urlObj = new URL(url);
        const hasValidExtension = validExtensions.some(ext => url.toLowerCase().includes(ext));
        const hasValidDomain = validDomains.some(domain => urlObj.hostname.includes(domain));

        return hasValidExtension || hasValidDomain;
    } catch {
        return false;
    }
}

function getStickerPreview(url) {
    // Generate thumbnail for sticker preview
    return url.replace(/\.gif$/, '.jpg').replace(/\/c\//g, '/ac/');
}

window.isValidStickerUrl = isValidStickerUrl;
window.getStickerPreview = getStickerPreview;

// ✅ FIX: Thêm hàm load pinned messages
function loadPinnedMessages() {
    if (!selectedUserId) return;

    console.log('🔍 Loading pinned messages...');

    // Tìm tất cả tin nhắn được pin trong DOM
    const pinnedElements = document.querySelectorAll('.message-item[data-is-pinned="true"]');
    const pinnedDropdown = document.querySelector('#pinnedMessagesDropdown .dropdown-menu');

    if (!pinnedDropdown) {
        console.warn('Pinned dropdown not found');
        return;
    }

    // Clear existing pinned items
    pinnedDropdown.innerHTML = '';

    if (pinnedElements.length === 0) {
        pinnedDropdown.innerHTML = '<div class="dropdown-item-text text-muted">Chưa có tin nhắn nào được ghim</div>';
        return;
    }

    pinnedElements.forEach(element => {
        const messageId = element.dataset.messageId;
        const messageContent = element.querySelector('.message-content');
        const senderElement = element.querySelector('.message-sender');

        if (messageContent && senderElement) {
            const content = messageContent.textContent || messageContent.innerText || '';
            const sender = senderElement.textContent || 'Unknown';

            const pinnedItem = document.createElement('div');
            pinnedItem.className = 'pinned-dropdown-item';
            pinnedItem.innerHTML = `
                <div class="pinned-item-content" onclick="scrollToMessage('message-${messageId}')">
                    <div class="pinned-sender">${sender}</div>
                    <div class="pinned-text">${content.substring(0, 50)}${content.length > 50 ? '...' : ''}</div>
                </div>
                <button class="btn-unpin-small" onclick="togglePinMessage(${messageId}, false, 'message-${messageId}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            pinnedDropdown.appendChild(pinnedItem);
        }
    });

    console.log(`✅ Loaded ${pinnedElements.length} pinned messages`);
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Sticker utilities
function isValidStickerUrl(url) {
    const validExtensions = ['.gif', '.png', '.jpg', '.jpeg', '.webp'];
    const validDomains = ['tenor.com', 'giphy.com', 'media.tenor.com'];

    try {
        const urlObj = new URL(url);
        const hasValidExtension = validExtensions.some(ext => url.toLowerCase().includes(ext));
        const hasValidDomain = validDomains.some(domain => urlObj.hostname.includes(domain));

        return hasValidExtension || hasValidDomain;
    } catch {
        return false;
    }
}

function getStickerPreview(url) {
    // Generate thumbnail for sticker preview
    return url.replace(/\.gif$/, '.jpg').replace(/\/c\//g, '/ac/');
}

window.isValidStickerUrl = isValidStickerUrl;
window.getStickerPreview = getStickerPreview;
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Sticker utilities
function isValidStickerUrl(url) {
    const validExtensions = ['.gif', '.png', '.jpg', '.jpeg', '.webp'];
    const validDomains = ['tenor.com', 'giphy.com', 'media.tenor.com'];

    try {
        const urlObj = new URL(url);
        const hasValidExtension = validExtensions.some(ext => url.toLowerCase().includes(ext));
        const hasValidDomain = validDomains.some(domain => urlObj.hostname.includes(domain));

        return hasValidExtension || hasValidDomain;
    } catch {
        return false;
    }
}

function getStickerPreview(url) {
    // Generate thumbnail for sticker preview
    return url.replace(/\.gif$/, '.jpg').replace(/\/c\//g, '/ac/');
}

window.isValidStickerUrl = isValidStickerUrl;
window.getStickerPreview = getStickerPreview;
