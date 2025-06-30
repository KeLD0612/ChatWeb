// Hàm hiển thị tin nhắn với nút tùy chọn
function displayMessage(senderId, senderName, message, timestamp, messageId, isMine) {
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) return;

    // Xác định xem tin nhắn có phải của mình không
    // So sánh senderId với currentUserId để đảm bảo logic đúng
    const isMyMessage = senderId === currentUserId || isMine === true;

    messageId = messageId || Date.now().toString();
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item' + (isMyMessage ? ' message-mine' : ' message-other');
    messageElement.dataset.messageId = messageId;

    messageElement.innerHTML = `
        <div class="d-flex align-items-start mb-3 ${isMyMessage ? 'justify-content-end' : 'justify-content-start'}">
            ${!isMyMessage ? `
            <!-- Avatar cho tin nhắn người khác (bên trái) -->
            <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2"
                 style="width: 30px; height: 30px; flex-shrink: 0;">
                <i class="fas fa-user text-white"></i>
            </div>
            ` : ''}
            
            <div class="message-wrapper" style="max-width: 70%;">
                <div class="d-flex align-items-center mb-1 ${isMyMessage ? 'justify-content-end' : 'justify-content-start'}">
                    <strong class="message-sender ${isMyMessage ? 'text-end' : 'text-start'}">${isMyMessage ? 'Bạn' : senderName}</strong>
                    <small class="text-muted ms-2">${timestamp}</small>
                </div>
                <div class="d-flex align-items-center ${isMyMessage ? 'justify-content-end' : 'justify-content-start'}">
                    <div class="message-content ${isMyMessage ? 'bg-messenger-blue text-white' : 'bg-messenger-gray text-dark'} p-2 rounded position-relative" 
                         style="word-break: break-word; max-width: 100%;">
                        ${message}
                    </div>
                    <button class="message-options-btn ms-2" onclick="showMessageOptions(event, '${messageId}')" 
                            style="opacity: 0.7; transition: opacity 0.2s;">
                        ⋮
                    </button>
                </div>
            </div>
            
            ${isMyMessage ? `
            <!-- Avatar cho tin nhắn của mình (bên phải) -->
            <div class="rounded-circle bg-success d-flex align-items-center justify-content-center ms-2"
                 style="width: 30px; height: 30px; flex-shrink: 0;">
                <i class="fas fa-user text-white"></i>
            </div>
            ` : ''}
        </div>
    `;

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Debug: Kiểm tra xem sự kiện có được gắn không
    const optionsBtn = messageElement.querySelector('.message-options-btn');
    if (optionsBtn) {
        console.log(`Button attached for messageId: ${messageId}, isMyMessage: ${isMyMessage}, senderId: ${senderId}, currentUserId: ${currentUserId}`);

        // Thêm hover effect cho nút options
        const messageWrapper = messageElement.querySelector('.message-wrapper');
        messageWrapper.addEventListener('mouseenter', () => {
            optionsBtn.style.opacity = '1';
        });
        messageWrapper.addEventListener('mouseleave', () => {
            optionsBtn.style.opacity = '0.7';
        });
    } else {
        console.error(`No options button found for messageId: ${messageId}`);
    }
}

// Cập nhật CSS styles cho tin nhắn
function addMessageStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Tin nhắn của mình (bên phải) */
        .message-mine {
            align-self: flex-end;
        }
        
        .message-mine .message-content {
            background-color: #0084ff !important;
            color: white !important;
            border-radius: 18px 18px 4px 18px;
        }
        
        /* Tin nhắn người khác (bên trái) */
        .message-other {
            align-self: flex-start;
        }
        
        .message-other .message-content {
            background-color: #e9ecef !important;
            color: #333 !important;
            border-radius: 18px 18px 18px 4px;
        }
        
        /* Cải thiện hiển thị */
        .message-wrapper {
            display: flex;
            flex-direction: column;
        }
        
        .message-sender {
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .message-options-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            padding: 2px 4px;
            color: #888;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .message-options-btn:hover {
            background-color: rgba(0,0,0,0.1);
            color: #333;
        }
        
        /* Container tin nhắn */
        #messages {
            display: flex;
            flex-direction: column;
        }
        
        .message-item {
            margin-bottom: 8px;
            width: 100%;
        }
    `;
    document.head.appendChild(style);
}

// Giữ nguyên các hàm cũ
function setupEventListeners() {
    // Thêm styles khi setup
    addMessageStyles();

    document.querySelectorAll('.user-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            selectUser(userId, userName);
        });
    });

    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    const attachButton = document.getElementById('attachButton');
    const fileInput = document.getElementById('fileInput');

    if (attachButton && fileInput) {
        attachButton.addEventListener('click', function () {
            fileInput.click();
        });

        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                uploadAndSendFile(file);
            }
        });
    }

    const voiceButton = document.getElementById('voiceButton');
    if (voiceButton) {
        voiceButton.addEventListener('click', toggleVoiceRecording);
    }

    const cancelRecordingButton = document.getElementById('cancelRecordingButton');
    if (cancelRecordingButton) {
        cancelRecordingButton.addEventListener('click', cancelVoiceRecording);
    }

    const stopRecordingButton = document.getElementById('stopRecordingButton');
    if (stopRecordingButton) {
        stopRecordingButton.addEventListener('click', stopVoiceRecording);
    }

    const audioCallButton = document.getElementById('audioCallButton');
    if (audioCallButton) {
        audioCallButton.addEventListener('click', () => initiateCall('audio'));
    }

    const videoCallButton = document.getElementById('videoCallButton');
    if (videoCallButton) {
        videoCallButton.addEventListener('click', () => initiateCall('video'));
    }

    const acceptCallButton = document.getElementById('acceptCallButton');
    if (acceptCallButton) {
        acceptCallButton.addEventListener('click', acceptCall);
    }

    const rejectCallButton = document.getElementById('rejectCallButton');
    if (rejectCallButton) {
        rejectCallButton.addEventListener('click', rejectCall);
    }

    const endCallButton = document.getElementById('endCallButton');
    if (endCallButton) {
        endCallButton.addEventListener('click', endCall);
    }

    const cancelCallButton = document.getElementById('cancelCallButton');
    if (cancelCallButton) {
        cancelCallButton.addEventListener('click', endCall);
    }

    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
        muteButton.addEventListener('click', toggleMute);
    }

    const cameraButton = document.getElementById('cameraButton');
    if (cameraButton) {
        cameraButton.addEventListener('click', toggleCamera);
    }
}

async function sendMessage() {
    console.log('🚀 Updated message-handling.js v3 loaded');
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message) {
        console.warn('⚠️ Message is empty');
        return;
    }

    if (!selectedUserId) {
        console.error('❌ No user selected');
        alert('Vui lòng chọn người để gửi tin nhắn!');
        return;
    }

    if (!isSignalRInitialized || !connection || connection.state !== 'Connected') {
        console.error('❌ SignalR not connected. State:', connection ? connection.state : 'null');
        alert('Kết nối SignalR không sẵn sàng. Vui lòng thử lại.');
        return;
    }

    try {
        console.log('📤 Sending message to:', selectedUserId, 'content:', message);
        await connection.invoke("SendMessage", selectedUserId, message, "text");
        messageInput.value = '';
        console.log('✅ Message sent successfully');
    } catch (err) {
        console.error('❌ Send message error:', err);
        alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
}

function uploadAndSendFile(file) {
    if (!selectedUserId) {
        alert('Vui lòng chọn người để gửi file!');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', selectedUserId);

    const uploadProgress = document.getElementById('uploadProgress');
    if (uploadProgress) {
        uploadProgress.style.display = 'block';
    }

    fetch('/FileUpload/UploadChatMedia', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (uploadProgress) {
                uploadProgress.style.display = 'none';
            }

            if (data.success) {
                if (isSignalRInitialized && connection && connection.state === 'Connected') {
                    connection.invoke("SendMediaMessage", selectedUserId, data.fileUrl, data.mediaType, data.fileName, data.fileSize)
                        .then(() => {
                            console.log('✅ Media message sent successfully');
                            const fileInput = document.getElementById('fileInput');
                            if (fileInput) {
                                fileInput.value = '';
                            }
                        })
                        .catch(err => {
                            console.error('❌ Send media error:', err);
                        });
                } else {
                    console.error('❌ SignalR not connected for sending media message. State:', connection ? connection.state : 'null');
                    alert('Kết nối SignalR không sẵn sàng. Vui lòng thử lại.');
                }
            } else {
                alert('Lỗi upload: ' + data.error);
            }
        })
        .catch(err => {
            if (uploadProgress) {
                uploadProgress.style.display = 'none';
            }
            console.error('❌ Upload error:', err);
            alert('Lỗi upload file');
        });
}