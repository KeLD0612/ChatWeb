// emoji-picker.js - Xử lý chọn và gửi emoji

// Emoji data
const emojiData = {
    recent: [],
    emotions: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
        '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
        '😘', '😗', '☺️', '😚', '😙', '😋', '😛', '😜',
        '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '😐'
    ],
    people: [
        '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓',
        '👴', '👵', '👱', '👮', '👷', '💂', '🕵️', '👩‍⚕️',
        '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🎓', '👩‍🎓', '👨‍🎤'
    ],
    animals: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
        '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
        '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤'
    ]
};

// Khởi tạo emoji picker
function initializeEmojiPicker() {
    console.log('🎭 Initializing emoji picker...');

    // Load recent emojis from localStorage
    emojiData.recent = JSON.parse(localStorage.getItem('recentEmojis') || '[]');

    // Tạo emoji picker popup nếu chưa có
    if (!document.getElementById('emojiPickerPopup')) {
        createEmojiPickerHTML();
    }

    // Setup event listeners
    setupEmojiPickerEvents();
}

// Tạo HTML cho emoji picker
function createEmojiPickerHTML() {
    const emojiPickerHTML = `
        <div id="emojiPickerPopup" class="emoji-picker-popup">
            <div class="emoji-picker-header">
                <button class="emoji-tab active" data-category="recent">Gần đây</button>
                <button class="emoji-tab" data-category="emotions">Cảm xúc</button>
                <button class="emoji-tab" data-category="people">Người</button>
                <button class="emoji-tab" data-category="animals">Động vật</button>
            </div>
            <div class="emoji-picker-content" id="emojiPickerContent">
                ${generateEmojiContent('recent')}
            </div>
        </div>
    `;

    // Thêm vào input group
    const inputGroup = document.querySelector('.input-group');
    if (inputGroup) {
        inputGroup.style.position = 'relative';
        inputGroup.insertAdjacentHTML('beforeend', emojiPickerHTML);
    }
}

// Tạo nội dung emoji
function generateEmojiContent(category) {
    let content = '';

    if (category === 'recent') {
        if (emojiData.recent.length > 0) {
            content += `
                <div class="emoji-category-title">Gần đây</div>
                <div class="emoji-grid">
                    ${emojiData.recent.slice(0, 24).map(emoji =>
                `<button class="emoji-item" data-emoji="${emoji}">${emoji}</button>`
            ).join('')}
                </div>
            `;
        } else {
            content += `
                <div class="emoji-category-title">Chưa có emoji gần đây</div>
                <p style="text-align: center; color: #6c757d; margin: 20px;">
                    Emoji bạn sử dụng sẽ hiển thị ở đây
                </p>
            `;
        }

        // Thêm emoji phổ biến
        content += `
            <div class="emoji-category-title">Phổ biến</div>
            <div class="emoji-grid">
                ${['😀', '😂', '😍', '🥰', '😘', '😊', '😉', '😎', '🤔', '😅', '😭', '😡', '👍', '👎', '❤️', '💔'].map(emoji =>
            `<button class="emoji-item" data-emoji="${emoji}">${emoji}</button>`
        ).join('')}
            </div>
        `;
    } else {
        const emojis = emojiData[category] || [];
        const categoryTitle = getCategoryTitle(category);

        content = `
            <div class="emoji-category-title">${categoryTitle}</div>
            <div class="emoji-grid">
                ${emojis.map(emoji =>
            `<button class="emoji-item" data-emoji="${emoji}">${emoji}</button>`
        ).join('')}
            </div>
        `;
    }

    return content;
}

// Lấy tên danh mục
function getCategoryTitle(category) {
    const titles = {
        emotions: 'Cảm xúc',
        people: 'Người',
        animals: 'Động vật'
    };
    return titles[category] || category;
}

// Setup event listeners
function setupEmojiPickerEvents() {
    // Toggle emoji picker
    const emojiBtn = document.getElementById('emojiPickerBtn');
    const emojiPopup = document.getElementById('emojiPickerPopup');

    if (emojiBtn && emojiPopup) {
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleEmojiPicker();
        });
    }

    // Tab switching
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji-tab')) {
            const category = e.target.getAttribute('data-category');
            switchEmojiCategory(category);
        }
    });

    // Emoji selection
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji-item')) {
            const emoji = e.target.getAttribute('data-emoji');
            selectEmoji(emoji);
        }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
        const emojiPopup = document.getElementById('emojiPickerPopup');
        const emojiBtn = document.getElementById('emojiPickerBtn');

        if (emojiPopup && emojiBtn &&
            !emojiPopup.contains(e.target) &&
            !emojiBtn.contains(e.target)) {
            emojiPopup.style.display = 'none';
        }
    });
}

// Toggle emoji picker
function toggleEmojiPicker() {
    const emojiPopup = document.getElementById('emojiPickerPopup');
    if (emojiPopup) {
        const isVisible = emojiPopup.style.display === 'block';
        emojiPopup.style.display = isVisible ? 'none' : 'block';
    }
}

// Switch category
function switchEmojiCategory(category) {
    // Update active tab
    document.querySelectorAll('.emoji-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const activeTab = document.querySelector(`[data-category="${category}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Update content
    const content = document.getElementById('emojiPickerContent');
    if (content) {
        content.innerHTML = generateEmojiContent(category);
    }
}

// Select emoji
function selectEmoji(emoji) {
    console.log('🎭 Selected emoji:', emoji);

    // Add to recent
    addToRecentEmojis(emoji);

    // Send emoji
    sendEmojiMessage(emoji);

    // Close picker
    const emojiPopup = document.getElementById('emojiPickerPopup');
    if (emojiPopup) {
        emojiPopup.style.display = 'none';
    }
}

// Add to recent emojis
function addToRecentEmojis(emoji) {
    emojiData.recent = emojiData.recent.filter(e => e !== emoji);
    emojiData.recent.unshift(emoji);
    emojiData.recent = emojiData.recent.slice(0, 24);
    localStorage.setItem('recentEmojis', JSON.stringify(emojiData.recent));
}

// Send emoji message
async function sendEmojiMessage(emoji) {
    if (!selectedUserId) {
        alert('Vui lòng chọn người để gửi emoji!');
        return;
    }

    if (!isSignalRInitialized || !connection || connection.state !== 'Connected') {
        alert('Kết nối SignalR không sẵn sàng. Vui lòng thử lại.');
        return;
    }

    try {
        await connection.invoke("SendMessage", selectedUserId, emoji, "emoji");
        console.log('✅ Emoji sent successfully');
    } catch (err) {
        console.error('❌ Send emoji error:', err);
        alert('Không thể gửi emoji. Vui lòng thử lại.');
    }
}

// Add emoji button
function addEmojiButton() {
    const sendButton = document.getElementById('sendButton');
    if (sendButton && !document.getElementById('emojiPickerBtn')) {
        const emojiButton = document.createElement('button');
        emojiButton.id = 'emojiPickerBtn';
        emojiButton.type = 'button';
        emojiButton.className = 'btn emoji-picker-btn';
        emojiButton.innerHTML = '😀';
        emojiButton.title = 'Chọn emoji';

        sendButton.parentNode.insertBefore(emojiButton, sendButton);
        console.log('✅ Emoji button added');
    }
}

// Auto initialize
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        addEmojiButton();
        initializeEmojiPicker();
    }, 500);
});