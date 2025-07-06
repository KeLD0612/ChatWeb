// Khai báo biến connection toàn cục
let connection;
// Khai báo biến theo dõi trạng thái khởi tạo
let isSignalRInitialized = false;

async function initializeSignalR() {
    try {
        updateConnectionStatus('connecting');

        connection = new signalR.HubConnectionBuilder()
            .withUrl("/chatHub")
            .withAutomaticReconnect()
            .build();

        // Message handlers
        connection.on("ReceiveMessage", function (senderId, senderName, message, messageType, timestamp, messageId) {
            console.log("=== ReceiveMessage DEBUG START ===");
            console.log("Received message:", { senderId, senderName, message, messageType, timestamp, messageId });

            const messageObj = {
                id: messageId,
                senderId: senderId,
                senderName: senderName,
                content: message,
                messageType: messageType,
                timestamp: timestamp,
                isSender: senderId === currentUserId
            };

            displayMessage(messageObj);
            console.log("=== ReceiveMessage DEBUG END ===");
        });

        connection.on("ReceiveVoiceMessage", function (senderId, senderName, voiceUrl, duration, timestamp, messageId) {
            console.log("=== ReceiveVoiceMessage DEBUG START ===");
            console.log("Received voice message:", { senderId, senderName, voiceUrl, duration, timestamp, messageId });

            const messageObj = {
                id: messageId,
                senderId: senderId,
                senderName: senderName,
                content: voiceUrl,
                messageType: "voice",
                timestamp: timestamp,
                isSender: senderId === currentUserId
            };

            displayMessage(messageObj); // Sử dụng displayMessage thay vì displayVoiceMessage
            console.log("=== ReceiveVoiceMessage DEBUG END ===");
        });

        connection.on("ReceiveMediaMessage", function (senderId, senderName, fileUrl, mediaType, fileName, fileSize, timestamp, messageId) {
            console.log("=== ReceiveMediaMessage DEBUG START ===");
            console.log("Received media message:", { senderId, senderName, fileUrl, mediaType, fileName, fileSize, timestamp, messageId });

            const messageObj = {
                id: messageId,
                senderId: senderId,
                senderName: senderName,
                content: fileUrl,
                messageType: mediaType,
                timestamp: timestamp,
                isSender: senderId === currentUserId
            };

            displayMessage(messageObj); // Sử dụng displayMessage thay vì displayMediaMessage
            console.log("=== ReceiveMediaMessage DEBUG END ===");
        });

        // Thêm sau connection.on("ReceiveMediaMessage"...)

        connection.on("ReceiveReplyMessage", function (senderId, senderName, message, messageType, timestamp, messageId, replyToMessageId, replyInfo) {
            console.log("=== ReceiveReplyMessage EVENT FIRED ===");
            console.log("Received reply message:", {
                senderId,
                senderName,
                message,
                messageType,
                timestamp,
                messageId,
                replyToMessageId,
                replyInfo
            });

            const messageObj = {
                id: messageId,
                senderId: senderId,
                senderName: senderName,
                content: message,
                messageType: messageType,
                timestamp: timestamp,
                isSender: senderId === currentUserId,
                repliedMessageId: replyToMessageId,
                repliedMessage: replyInfo
            };

            displayMessage(messageObj);
            console.log("=== ReceiveReplyMessage COMPLETE ===");
        });

        // Call handlers
        connection.on("IncomingCall", function (callId, callerId, callerName, callType) {
            console.log("=== IncomingCall DEBUG ===", { callId, callerId, callerName, callType });
            handleIncomingCall(callId, callerId, callerName, callType);
        });

        connection.on("CallAccepted", function (callId) {
            console.log("=== CallAccepted DEBUG ===", { callId });
            handleCallAccepted(callId);
        });

        connection.on("CallRejected", function (callId) {
            console.log("=== CallRejected DEBUG ===", { callId });
            handleCallRejected(callId);
        });

        connection.on("CallEnded", function (callId) {
            console.log("=== CallEnded DEBUG ===", { callId });
            handleCallEnded(callId);
        });

        // WebRTC signaling
        connection.on("ReceiveOffer", function (callId, offer) {
            console.log("=== ReceiveOffer DEBUG ===", { callId, offerLength: offer?.length });
            handleReceiveOffer(callId, offer);
        });

        connection.on("ReceiveAnswer", function (callId, answer) {
            console.log("=== ReceiveAnswer DEBUG ===", { callId, answerLength: answer?.length });
            handleReceiveAnswer(callId, answer);
        });

        // Thêm handler này vào signalr-init.js (sau các handler khác)

        // Thêm handler cho reactions
        connection.on("UpdateReactions", function (messageId, reactions) {
            console.log("=== UpdateReactions DEBUG ===", { messageId, reactions });

            const reactionsContainer = document.getElementById(`reactions-${messageId}`);
            if (reactionsContainer) {
                // Clear old reactions trước khi update
                reactionsContainer.innerHTML = '';

                // Sử dụng displayReactionsWithMessageId để đảm bảo messageId được truyền đúng
                if (reactions && reactions.length > 0) {
                    reactionsContainer.innerHTML = displayReactionsWithMessageId(reactions, messageId);

                    // Add animation class
                    const newBadges = reactionsContainer.querySelectorAll('.reaction-badge');
                    newBadges.forEach(badge => {
                        badge.style.animation = 'bounceIn 0.3s ease-out';
                    });
                }
            }
        });

        connection.on("ReceiveIceCandidate", function (callId, candidate) {
            console.log("=== ReceiveIceCandidate DEBUG ===", { callId, candidateLength: candidate?.length });
            handleReceiveIceCandidate(callId, candidate);
        });

        connection.on("Error", function (errorMessage) {
            console.error('❌ SignalR Error:', errorMessage);
            updateConnectionStatus('disconnected');
        });

        connection.onreconnecting(() => {
            console.log("=== SignalR Reconnecting ===");
            updateConnectionStatus('connecting');
        });

        connection.onreconnected(() => {
            console.log("=== SignalR Reconnected ===");
            updateConnectionStatus('connected');
            if (currentUserId) {
                connection.invoke("JoinUserGroup", currentUserId);
            }
        });

        connection.onclose(() => {
            console.log("=== SignalR Connection Closed ===");
            updateConnectionStatus('disconnected');
        });

        await connection.start();
        console.log('✅ SignalR connected successfully');
        updateConnectionStatus('connected');
        isSignalRInitialized = true;

        if (currentUserId) {
            await connection.invoke("JoinUserGroup", currentUserId);
            console.log(`Joined group User_${currentUserId}`);
        }
    } catch (err) {
        console.error('❌ SignalR connection failed:', err);
        updateConnectionStatus('disconnected');
        isSignalRInitialized = false;
        setTimeout(initializeSignalR, 5000);
    }
}

// Trong message-handling.js, thêm debug chi tiết hơn
async function sendMessage() {
    console.log('🚀 Sending message...');

    // Thêm debug connection state
    console.log('Connection state:', connection ? connection.state : 'null');
    console.log('isSignalRInitialized:', isSignalRInitialized);

    // ... rest of code ...

    try {
        // ... existing code ...

        if (replyToMessageId) {
            console.log('Invoking SendReplyMessage with:', {
                receiverId: selectedUserId,
                message: message,
                messageType: "text",
                replyToMessageId: replyToMessageId
            });
            await connection.invoke("SendReplyMessage", selectedUserId, message, "text", replyToMessageId);
        } else {
            await connection.invoke("SendMessage", selectedUserId, message, "text");
        }

        // ... rest of code ...
    } catch (err) {
        console.error('❌ Send message error details:', err);
        console.error('Error type:', err.name);
        console.error('Error message:', err.message);
        alert('Không thể gửi tin nhắn: ' + err.message);
    }
}

// Thêm handler cho MessageRecalled
connection.on("MessageRecalled", function (messageId, recallType) {
    console.log("Message recalled:", messageId, recallType);

    if (recallType === "Both") {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            const contentElement = messageElement.querySelector('.message-content');
            if (contentElement) {
                contentElement.innerHTML = '<i class="fas fa-undo text-muted"></i> <em>Tin nhắn đã được thu hồi</em>';
                messageElement.classList.add('recalled');
            }
        }
    }
})

// Thêm sau connection.on("ReceiveIceCandidate"...)

connection.on("MessageRecalled", function (messageId, recallType) {
    console.log("=== MessageRecalled EVENT FIRED ===");
    console.log("Message recalled:", messageId, recallType);

    if (recallType === "Both") {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            const contentElement = messageElement.querySelector('.message-content');
            if (contentElement) {
                // Cập nhật nội dung tin nhắn
                contentElement.innerHTML = '<i class="fas fa-undo text-muted"></i> <em>Tin nhắn đã được thu hồi</em>';
                messageElement.classList.add('recalled');
                messageElement.dataset.isRecalled = 'true';

                // Ẩn nút options nếu có
                const optionsBtn = messageElement.querySelector('.message-options-btn');
                if (optionsBtn) {
                    optionsBtn.style.display = 'none';
                }
            }
        }
    }
});


