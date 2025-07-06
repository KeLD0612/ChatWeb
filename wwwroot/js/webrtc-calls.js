// Khai báo các biến toàn cục
let pendingIceCandidates = [];
let currentCallId = null;
let currentCallType = null;
let callerName = null; // Thêm biến để lưu tên người gọi
let currentCallerId = null; // Thêm biến để lưu ID người gọi
let peerConnection = null;
let localStream = null;
let remoteStream = null;
let callStartTime = 0;
let callDurationInterval = null;
let isMuted = false;
let isCameraOff = false;

// Cấu hình STUN/TURN servers
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

async function checkMediaPermissions() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (err) {
        console.error('Media permission error:', err);
        alert('Vui lòng cấp quyền truy cập microphone và camera');
        return false;
    }
}

async function initiateCall(callType) {
    console.log('Initiating call with selectedUserId:', selectedUserId, 'callType:', callType);

    if (!selectedUserId) {
        console.error('❌ selectedUserId is null or undefined');
        alert('Vui lòng chọn người để gọi!');
        return;
    }

    if (!isSignalRInitialized || !connection || connection.state !== 'Connected') {
        console.error('❌ SignalR not connected. State:', connection ? connection.state : 'null');
        alert('Kết nối SignalR không sẵn sàng. Vui lòng thử lại.');
        return;
    }

    if (!(await checkMediaPermissions())) {
        return;
    }

    try {
        currentCallType = callType;
        console.log('Invoking InitiateCall with userId:', selectedUserId, 'callType:', callType);

        // Gọi server để khởi tạo cuộc gọi và nhận callId
        const callId = await connection.invoke("InitiateCall", selectedUserId, callType);
        currentCallId = callId;
        console.log('Call initiated with ID:', currentCallId);

        const outgoingCallUserName = document.getElementById('outgoingCallUserName');
        const outgoingCallType = document.getElementById('outgoingCallType');
        const outgoingCallUI = document.getElementById('outgoingCallUI');

        if (outgoingCallUserName) {
            outgoingCallUserName.textContent = selectedUserName;
        }
        if (outgoingCallType) {
            outgoingCallType.textContent = callType === 'video' ? 'Đang gọi video...' : 'Đang gọi...';
        }
        if (outgoingCallUI) {
            outgoingCallUI.style.display = 'block';
        }

        const callModal = document.getElementById('callModal');
        if (callModal && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(callModal);
            modal.show();
        }
    } catch (err) {
        console.error('Error initiating call:', err);
        alert('Không thể thực hiện cuộc gọi');
    }
}

function handleIncomingCall(callId, callerId, callerNameParam, callType) {
    console.log('Received incoming call:', { callId, callerId, callerName: callerNameParam, callType });
    if (!callId) {
        console.error('❌ callId is null in handleIncomingCall');
        return;
    }

    currentCallId = callId;
    currentCallType = callType;
    callerName = callerNameParam; // Lưu trữ tên người gọi
    currentCallerId = callerId;    // Lưu trữ ID người gọi

    const incomingCallerName = document.getElementById('incomingCallerName');
    const incomingCallType = document.getElementById('incomingCallType');
    const incomingCallUI = document.getElementById('incomingCallUI');

    if (incomingCallerName) {
        incomingCallerName.textContent = callerNameParam;
    }
    if (incomingCallType) {
        incomingCallType.textContent = callType === 'video' ? 'Video Call' : 'Audio Call';
    }
    if (incomingCallUI) {
        incomingCallUI.style.display = 'block';
    }

    const callModal = document.getElementById('callModal');
    if (callModal && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(callModal);
        modal.show();
    }
}

async function acceptCall() {
    console.log('Accepting call with callId:', currentCallId);
    if (!currentCallId) {
        console.error('❌ currentCallId is null in acceptCall');
        alert('Không thể chấp nhận cuộc gọi do thiếu ID cuộc gọi.');
        return;
    }

    if (!isSignalRInitialized || !connection || connection.state !== 'Connected') {
        console.error('❌ SignalR not connected. State:', connection ? connection.state : 'null');
        alert('Kết nối SignalR không sẵn sàng. Vui lòng thử lại.');
        return;
    }

    try {
        await connection.invoke("AcceptCall", currentCallId);
        await setupWebRTC(false);
    } catch (err) {
        console.error('Error accepting call:', err);
        alert('Không thể chấp nhận cuộc gọi. Vui lòng thử lại.');
    }
}

async function rejectCall() {
    console.log('Rejecting call with callId:', currentCallId);
    if (!currentCallId) {
        console.error('❌ currentCallId is null in rejectCall');
        return;
    }

    if (!isSignalRInitialized || !connection || connection.state !== 'Connected') {
        console.error('❌ SignalR not connected. State:', connection ? connection.state : 'null');
        alert('Kết nối SignalR không sẵn sàng. Vui lòng thử lại.');
        return;
    }

    try {
        await connection.invoke("RejectCall", currentCallId);
        hideCallModal();
        currentCallId = null;
    } catch (err) {
        console.error('Error rejecting call:', err);
    }
}

async function endCall() {
    console.log('Ending call with callId:', currentCallId);

    if (!isSignalRInitialized || !connection || connection.state !== 'Connected') {
        console.error('❌ SignalR not connected. State:', connection ? connection.state : 'null');
        alert('Kết nối SignalR không sẵn sàng. Vui lòng thử lại.');
        return;
    }

    try {
        if (currentCallId) {
            await connection.invoke("EndCall", currentCallId);
        }
        cleanupCall();
        hideCallModal();
    } catch (err) {
        console.error('Error ending call:', err);
        // Vẫn cleanup ngay cả khi có lỗi
        cleanupCall();
        hideCallModal();
    }
}

function handleCallAccepted(callId) {
    console.log('Call accepted with callId:', callId);
    if (!callId) {
        console.error('❌ callId is null in handleCallAccepted');
        return;
    }
    currentCallId = callId;
    setupWebRTC(true);
}

function handleCallRejected(callId) {
    console.log('Call rejected with callId:', callId);
    alert('Cuộc gọi bị từ chối');
    hideCallModal();
    currentCallId = null;
}

function handleCallEnded(callId) {
    console.log('Call ended with callId:', callId);
    cleanupCall();
    hideCallModal();
}

async function setupWebRTC(isCaller) {
    console.log('Setting up WebRTC, isCaller:', isCaller, 'callId:', currentCallId);
    try {
        if (peerConnection) {
            console.warn('PeerConnection already exists, cleaning up...');
            cleanupCall();
        }

        // Constraints cải thiện cho cuộc gọi âm thanh
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100
            },
            video: currentCallType === 'video'
        };

        console.log('Media constraints:', constraints);
        localStream = await navigator.mediaDevices.getUserMedia(constraints);

        peerConnection = new RTCPeerConnection(rtcConfiguration);

        localStream.getTracks().forEach(track => {
            // Đảm bảo audio tracks được kích hoạt đúng cách
            if (track.kind === 'audio') {
                track.enabled = true;
                console.log('Audio track enabled:', track.label, 'enabled:', track.enabled);
            }
            peerConnection.addTrack(track, localStream);
        });

        peerConnection.ontrack = function (event) {
            remoteStream = event.streams[0];
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) {
                remoteVideo.srcObject = remoteStream;
            }

            // Log thông tin về remote audio tracks
            remoteStream.getAudioTracks().forEach(track => {
                console.log('Remote audio track:', track.label, 'enabled:', track.enabled);
            });
        };

        peerConnection.onicecandidate = function (event) {
            if (event.candidate) {
                console.log('Sending ICE candidate for callId:', currentCallId);
                if (!currentCallId) {
                    console.error('❌ currentCallId is null when sending ICE candidate');
                    return;
                }
                connection.invoke("SendIceCandidate", currentCallId, JSON.stringify(event.candidate))
                    .catch(err => console.error('Error sending ICE candidate:', err));
            }
        };

        peerConnection.onsignalingstatechange = function () {
            console.log('Signaling state:', peerConnection.signalingState);
        };

        peerConnection.onconnectionstatechange = function () {
            console.log('Connection state:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'failed') {
                console.error('Connection failed, restarting ICE...');
                peerConnection.restartIce();
            }
        };

        // Process any queued ICE candidates
        if (pendingIceCandidates.length > 0 && peerConnection.remoteDescription) {
            console.log('Processing', pendingIceCandidates.length, 'queued ICE candidates');
            for (const candidate of pendingIceCandidates) {
                await peerConnection.addIceCandidate(candidate);
            }
            pendingIceCandidates = [];
        }

        showActiveCallUI();

        if (isCaller) {
            if (!currentCallId) {
                console.error('❌ currentCallId is null for caller setup');
                throw new Error('Missing callId for WebRTC setup');
            }
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            console.log('Sending offer for callId:', currentCallId);
            await connection.invoke("SendOffer", currentCallId, JSON.stringify(offer));
        }
    } catch (err) {
        console.error('Error setting up WebRTC:', err);
        alert('Không thể thiết lập kết nối âm thanh/video');
        cleanupCall();
    }
}

async function handleReceiveOffer(callId, offer) {
    console.log('Received offer for callId:', callId);
    try {
        if (!callId || !offer) {
            console.error('❌ Invalid offer received:', { callId, offer });
            return;
        }

        if (!peerConnection) {
            console.log('No peer connection, setting up...');
            currentCallId = callId;
            await setupWebRTC(false);
        }

        if (peerConnection.signalingState !== 'stable') {
            console.warn('Invalid signaling state for offer:', peerConnection.signalingState);
            return;
        }

        const offerDesc = new RTCSessionDescription(JSON.parse(offer));
        await peerConnection.setRemoteDescription(offerDesc);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log('Sending answer for callId:', callId);
        await connection.invoke("SendAnswer", callId, JSON.stringify(answer));

        // Process any queued ICE candidates
        if (pendingIceCandidates.length > 0) {
            console.log('Processing', pendingIceCandidates.length, 'queued ICE candidates after offer');
            for (const candidate of pendingIceCandidates) {
                await peerConnection.addIceCandidate(candidate);
            }
            pendingIceCandidates = [];
        }
    } catch (err) {
        console.error('Error handling offer:', err);
    }
}

async function handleReceiveAnswer(callId, answer) {
    console.log('Received answer for callId:', callId);
    try {
        if (!callId || !answer) {
            console.error('❌ Invalid answer received:', { callId, answer });
            return;
        }

        if (!peerConnection) {
            console.error('No peer connection for answer');
            return;
        }

        if (peerConnection.signalingState !== 'have-local-offer') {
            console.warn('Invalid signaling state for answer:', peerConnection.signalingState);
            return;
        }

        const answerDesc = new RTCSessionDescription(JSON.parse(answer));
        await peerConnection.setRemoteDescription(answerDesc);

        // Process any queued ICE candidates
        if (pendingIceCandidates.length > 0) {
            console.log('Processing', pendingIceCandidates.length, 'queued ICE candidates after answer');
            for (const candidate of pendingIceCandidates) {
                await peerConnection.addIceCandidate(candidate);
            }
            pendingIceCandidates = [];
        }
    } catch (err) {
        console.error('Error handling answer:', err);
    }
}

async function handleReceiveIceCandidate(callId, candidate) {
    console.log('Received ICE candidate for callId:', callId);
    try {
        if (!callId || !candidate) {
            console.error('❌ Invalid ICE candidate received:', { callId, candidate });
            return;
        }

        if (!peerConnection || !peerConnection.remoteDescription) {
            console.warn('Queuing ICE candidate: no peer connection or remote description');
            pendingIceCandidates.push(JSON.parse(candidate));
            return;
        }

        await peerConnection.addIceCandidate(JSON.parse(candidate));
    } catch (err) {
        console.error('Error handling ICE candidate:', err);
    }
}

function showActiveCallUI() {
    hideAllCallUIs();
    const activeCallUI = document.getElementById('activeCallUI');
    if (activeCallUI) {
        activeCallUI.style.display = 'block';
    }

    if (currentCallType === 'video') {
        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        const audioCallAvatar = document.getElementById('audioCallAvatar');
        const cameraButton = document.getElementById('cameraButton');

        if (localVideo && localStream) {
            localVideo.srcObject = localStream;
            localVideo.style.display = 'block';

            // Force flip video như gương - JavaScript approach
            localVideo.style.webkitTransform = 'scaleX(-1)';
            localVideo.style.mozTransform = 'scaleX(-1)';
            localVideo.style.msTransform = 'scaleX(-1)';
            localVideo.style.oTransform = 'scaleX(-1)';
            localVideo.style.transform = 'scaleX(-1)';
        }
        if (remoteVideo) {
            remoteVideo.style.display = 'block';

            // Flip remote video cũng để đồng nhất
            remoteVideo.style.webkitTransform = 'scaleX(-1)';
            remoteVideo.style.mozTransform = 'scaleX(-1)';
            remoteVideo.style.msTransform = 'scaleX(-1)';
            remoteVideo.style.oTransform = 'scaleX(-1)';
            remoteVideo.style.transform = 'scaleX(-1)';
        }
        if (audioCallAvatar) {
            audioCallAvatar.style.display = 'none';
        }
        if (cameraButton) {
            cameraButton.style.display = 'block';
        }
    } else {
        // Thiết lập UI cuộc gọi âm thanh
        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        const audioCallAvatar = document.getElementById('audioCallAvatar');
        const cameraButton = document.getElementById('cameraButton');
        const activeCallUserName = document.getElementById('activeCallUserName');

        if (localVideo) {
            localVideo.style.display = 'none';
        }
        if (remoteVideo) {
            remoteVideo.style.display = 'none';
        }
        if (audioCallAvatar) {
            audioCallAvatar.style.display = 'flex';
        }
        if (cameraButton) {
            cameraButton.style.display = 'none';
        }
        if (activeCallUserName) {
            // Sử dụng callerName từ dữ liệu cuộc gọi đến nếu selectedUserName không khả dụng
            const displayName = (typeof selectedUserName !== 'undefined' && selectedUserName) ||
                (currentCallerId ? callerName : "Người dùng không xác định");
            activeCallUserName.textContent = displayName;
        }
    }

    startCallTimer();
}

function toggleMute() {
    if (!localStream) {
        console.error('❌ No local stream to mute');
        alert('Không có luồng âm thanh để tắt tiếng');
        return;
    }

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isMuted = !audioTrack.enabled;

        console.log('Audio track muted:', isMuted, 'enabled:', audioTrack.enabled);

        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.innerHTML = isMuted ?
                '<i class="fas fa-microphone-slash text-danger"></i>' :
                '<i class="fas fa-microphone"></i>';
            muteButton.classList.toggle('muted', isMuted);
            muteButton.title = isMuted ? 'Bật tiếng' : 'Tắt tiếng';
        }
    } else {
        console.error('❌ No audio track found in local stream');
        alert('Không tìm thấy track âm thanh');
    }
}

function toggleCamera() {
    if (!localStream || currentCallType !== 'video') {
        console.error('❌ No local stream or not a video call');
        return;
    }

    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        isCameraOff = !videoTrack.enabled;

        const cameraButton = document.getElementById('cameraButton');
        if (cameraButton) {
            cameraButton.innerHTML = isCameraOff ? '<i class="fas fa-video-slash"></i>' : '<i class="fas fa-video"></i>';
            cameraButton.classList.toggle('btn-danger', isCameraOff);
            cameraButton.classList.toggle('btn-secondary', !isCameraOff);
        }
    }
}

function startCallTimer() {
    callStartTime = Date.now();
    callDurationInterval = setInterval(updateCallDuration, 1000);
}

function updateCallDuration() {
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const callDuration = document.getElementById('callDuration');
    if (callDuration) {
        callDuration.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function cleanupCall() {
    console.log('Cleaning up call, callId:', currentCallId);
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    if (peerConnection) {
        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.onsignalingstatechange = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.close();
        peerConnection = null;
    }

    if (callDurationInterval) {
        clearInterval(callDurationInterval);
        callDurationInterval = null;
    }

    currentCallId = null;
    currentCallType = null;
    callerName = null; // Reset caller name
    currentCallerId = null; // Reset caller ID
    isMuted = false;
    isCameraOff = false;
    pendingIceCandidates = [];

    hideAllCallUIs();
}

function hideCallModal() {
    const callModal = document.getElementById('callModal');
    if (callModal && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getInstance(callModal);
        if (modal) {
            modal.hide();
        }
    }
    hideAllCallUIs();
}

function hideAllCallUIs() {
    const incomingCallUI = document.getElementById('incomingCallUI');
    const activeCallUI = document.getElementById('activeCallUI');
    const outgoingCallUI = document.getElementById('outgoingCallUI');

    if (incomingCallUI) {
        incomingCallUI.style.display = 'none';
    }
    if (activeCallUI) {
        activeCallUI.style.display = 'none';
    }
    if (outgoingCallUI) {
        outgoingCallUI.style.display = 'none';
    }
}

function setupCallEventListeners() {
    const acceptCallButton = document.getElementById('acceptCallButton');
    const rejectCallButton = document.getElementById('rejectCallButton');
    const endCallButton = document.getElementById('endCallButton');
    const cancelCallButton = document.getElementById('cancelCallButton');
    const muteButton = document.getElementById('muteButton');
    const cameraButton = document.getElementById('cameraButton');

    if (acceptCallButton) {
        acceptCallButton.addEventListener('click', acceptCall);
        console.log('✅ Registered acceptCallButton listener');
    }
    if (rejectCallButton) {
        rejectCallButton.addEventListener('click', rejectCall);
        console.log('✅ Registered rejectCallButton listener');
    }
    if (endCallButton) {
        endCallButton.addEventListener('click', endCall);
        console.log('✅ Registered endCallButton listener');
    }
    if (cancelCallButton) {
        cancelCallButton.addEventListener('click', endCall);
        console.log('✅ Registered cancelCallButton listener');
    }
    if (muteButton) {
        muteButton.addEventListener('click', toggleMute);
        console.log('✅ Registered muteButton listener');
    }
    if (cameraButton) {
        cameraButton.addEventListener('click', toggleCamera);
        console.log('✅ Registered cameraButton listener');
    }
}

// Gọi hàm này khi DOM được tải
document.addEventListener('DOMContentLoaded', setupCallEventListeners);
