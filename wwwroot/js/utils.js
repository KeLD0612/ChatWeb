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

function displayMessage(senderId, senderName, message, timestamp) {
    const isCurrentUser = senderId === currentUserId;
    const messageTime = new Date(timestamp).toLocaleTimeString('vi-VN');

    const messageHtml = `
        <div class="mb-3 d-flex ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}">
            <div class="message-bubble p-2 rounded shadow-sm ${isCurrentUser ? 'bg-primary text-white' : 'bg-white'}"
                style="max-width: 70%; border: 1px solid #dee2e6;">
                ${!isCurrentUser ? `<div class="fw-bold small mb-1">${senderName}</div>` : ''}
                <div>${message}</div>
                <div class="small mt-1" style="opacity: 0.7;">
                    ${messageTime}
                </div>
            </div>
        </div>
    `;

    document.getElementById('messages').insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

function displayMediaMessage(senderId, senderName, fileUrl, mediaType, fileName, fileSize, timestamp) {
    const isCurrentUser = senderId === currentUserId;
    const messageTime = new Date(timestamp).toLocaleTimeString('vi-VN');

    let mediaHtml = '';
    if (mediaType === 'image') {
        mediaHtml = `
            <img src="${fileUrl}" alt="${fileName}"
                class="img-fluid rounded mb-2" style="max-width: 300px; cursor: pointer;"
                onclick="window.open('${fileUrl}', '_blank')" />
        `;
    } else if (mediaType === 'video') {
        mediaHtml = `
            <video controls class="rounded mb-2" style="max-width: 300px;">
                <source src="${fileUrl}" type="video/mp4">
                Video không được hỗ trợ
            </video>
        `;
    } else {
        mediaHtml = `
            <div class="d-flex align-items-center mb-2 p-2 bg-light rounded">
                <i class="fas fa-file-alt fa-2x me-2 text-primary"></i>
                <div>
                    <div class="fw-bold">${fileName}</div>
                    <small class="text-muted">${formatFileSize(fileSize)}</small>
                </div>
            </div>
            <a href="${fileUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-download"></i> Tải xuống
            </a>
        `;
    }

    const messageHtml = `
        <div class="mb-3 d-flex ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}">
            <div class="message-bubble p-2 rounded shadow-sm ${isCurrentUser ? 'bg-primary text-white' : 'bg-white'}"
                style="max-width: 70%; border: 1px solid #dee2e6;">
                ${!isCurrentUser ? `<div class="fw-bold small mb-1">${senderName}</div>` : ''}
                ${mediaHtml}
                <div class="small mt-1" style="opacity: 0.7;">
                    📎 ${fileName} • ${messageTime}
                </div>
            </div>
        </div>
    `;

    document.getElementById('messages').insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

function displayVoiceMessage(senderId, senderName, voiceUrl, duration, timestamp) {
    const isCurrentUser = senderId === currentUserId;
    const messageTime = new Date(timestamp).toLocaleTimeString('vi-VN');
    const durationText = formatDuration(duration);

    const messageHtml = `
        <div class="mb-3 d-flex ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}">
            <div class="voice-message ${isCurrentUser ? '' : 'bg-white text-dark'}" style="border: 1px solid #dee2e6;">
                ${!isCurrentUser ? `<div class="fw-bold small mb-1 text-dark">${senderName}</div>` : ''}
                <div class="d-flex align-items-center">
                    <button class="play-button" onclick="playVoiceMessage('${voiceUrl}', this)">
                        <i class="fas fa-play"></i>
                    </button>
                    <div class="voice-waveform mx-2">
                        <div class="voice-progress" style="width: 0%"></div>
                    </div>
                    <span class="small">${durationText}</span>
                </div>
                <div class="small mt-1" style="opacity: 0.7;">
                    🎤 Voice • ${messageTime}
                </div>
            </div>
        </div>
    `;

    document.getElementById('messages').insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

function playVoiceMessage(voiceUrl, button) {
    const audio = new Audio(voiceUrl);
    const icon = button.querySelector('i');
    const progressBar = button.parentNode.querySelector('.voice-progress');

    if (button.dataset.playing === 'true') {
        audio.pause();
        icon.className = 'fas fa-play';
        button.dataset.playing = 'false';
        return;
    }

    icon.className = 'fas fa-pause';
    button.dataset.playing = 'true';

    audio.ontimeupdate = function () {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = progress + '%';
    };

    audio.onended = function () {
        icon.className = 'fas fa-play';
        button.dataset.playing = 'false';
        progressBar.style.width = '0%';
    };

    audio.play();
}

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
    // console.log('📚 Loading chat history for userId:', userId);

    if (!userId) {
        // console.error('❌ Invalid userId for chat history');
        return;
    }

    const encodedUserId = encodeURIComponent(userId);
    const url = `/Chat/GetMessages?userId=${encodedUserId}`;
    // console.log('Fetching chat history from:', url);

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(messages => {
            if (messages && messages.length > 0) {
                // console.log(`📚 Loading ${messages.length} messages`);
                messages.forEach(msg => {
                    if (msg.messageType === 'text') {
                        displayMessage(msg.senderId, msg.senderName, msg.content, msg.timestamp);
                    } else if (msg.messageType === 'image' || msg.messageType === 'video' || msg.messageType === 'document') {
                        const fileName = msg.content.split('/').pop();
                        displayMediaMessage(msg.senderId, msg.senderName, msg.content, msg.messageType, fileName, 0, msg.timestamp);
                    } else if (msg.messageType === 'voice') {
                        displayVoiceMessage(msg.senderId, msg.senderName, msg.content, 0, msg.timestamp);
                    }
                });
            } else {
                // console.log('📭 No messages found');
            }
        })
        .catch(err => {
            // console.error('❌ Error loading chat history:', err);
            alert('Không thể tải lịch sử chat. Vui lòng thử lại sau.');
        });
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
