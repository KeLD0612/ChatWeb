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
        connection.on("ReceiveMessage", function (senderId, senderName, message, timestamp) {
            displayMessage(senderId, senderName, message, timestamp);
        });

        connection.on("ReceiveMediaMessage", function (senderId, senderName, fileUrl, mediaType, fileName, fileSize, timestamp) {
            displayMediaMessage(senderId, senderName, fileUrl, mediaType, fileName, fileSize, timestamp);
        });

        connection.on("ReceiveVoiceMessage", function (senderId, senderName, voiceUrl, duration, timestamp) {
            displayVoiceMessage(senderId, senderName, voiceUrl, duration, timestamp);
        });

        // Call handlers
        connection.on("IncomingCall", function (callId, callerId, callerName, callType) {
            handleIncomingCall(callId, callerId, callerName, callType);
        });

        connection.on("CallAccepted", function (callId) {
            handleCallAccepted(callId);
        });

        connection.on("CallRejected", function (callId) {
            handleCallRejected(callId);
        });

        connection.on("CallEnded", function (callId) {
            handleCallEnded(callId);
        });

        // WebRTC signaling
        connection.on("ReceiveOffer", function (callId, offer) {
            handleReceiveOffer(callId, offer);
        });

        connection.on("ReceiveAnswer", function (callId, answer) {
            handleReceiveAnswer(callId, answer);
        });

        connection.on("ReceiveIceCandidate", function (callId, candidate) {
            handleReceiveIceCandidate(callId, candidate);
        });

        connection.on("Error", function (errorMessage) {
            console.error('❌ SignalR Error:', errorMessage);
            updateConnectionStatus('disconnected');
        });

        connection.onreconnecting(() => {
            updateConnectionStatus('connecting');
        });

        connection.onreconnected(() => {
            updateConnectionStatus('connected');
            if (currentUserId) {
                connection.invoke("JoinUserGroup", currentUserId);
            }
        });

        connection.onclose(() => {
            updateConnectionStatus('disconnected');
        });

        await connection.start();
        console.log('✅ SignalR connected successfully');
        updateConnectionStatus('connected');
        isSignalRInitialized = true; // Cập nhật trạng thái sau khi kết nối thành công

        if (currentUserId) {
            await connection.invoke("JoinUserGroup", currentUserId);
        }
    } catch (err) {
        console.error('❌ SignalR connection failed:', err);
        updateConnectionStatus('disconnected');
        isSignalRInitialized = false; // Cập nhật trạng thái nếu kết nối thất bại
        setTimeout(initializeSignalR, 5000);
    }
}
