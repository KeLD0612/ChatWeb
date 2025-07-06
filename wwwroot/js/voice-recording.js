// Khai báo các biến toàn cục
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = 0;
let recordingInterval = null;

async function toggleVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

async function startVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = function (event) {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = function () {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            uploadVoiceMessage(audioBlob);

            stream.getTracks().forEach(track => track.stop());
            mediaRecorder = null; // Đặt lại mediaRecorder sau khi dừng
        };

        mediaRecorder.start();
        recordingStartTime = Date.now();

        const voiceRecordingUI = document.getElementById('voiceRecordingUI');
        if (voiceRecordingUI) {
            voiceRecordingUI.style.display = 'block';
        }

        const voiceButton = document.getElementById('voiceButton');
        if (voiceButton) {
            voiceButton.innerHTML = '<i class="fas fa-stop text-danger"></i>';
        }

        recordingInterval = setInterval(updateRecordingTime, 1000);
    } catch (err) {
        console.error('Error starting voice recording:', err);
        alert('Không thể truy cập microphone');
    }
}

function updateRecordingTime() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const recordingTime = document.getElementById('recordingTime');
    if (recordingTime) {
        recordingTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        clearInterval(recordingInterval);
        hideRecordingUI();
    }
}

function cancelVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        clearInterval(recordingInterval);
        hideRecordingUI();
        audioChunks = [];
    }
}

function hideRecordingUI() {
    const voiceRecordingUI = document.getElementById('voiceRecordingUI');
    if (voiceRecordingUI) {
        voiceRecordingUI.style.display = 'none';
    }
    const voiceButton = document.getElementById('voiceButton');
    if (voiceButton) {
        voiceButton.innerHTML = '🎤';
    }
}

async function uploadVoiceMessage(audioBlob) {
    if (!selectedUserId || audioChunks.length === 0) return;

    const formData = new FormData();
    formData.append('file', audioBlob, 'voice-message.webm');
    formData.append('receiverId', selectedUserId);

    const uploadProgress = document.getElementById('uploadProgress');
    if (uploadProgress) {
        uploadProgress.style.display = 'block';
    }

    try {
        const response = await fetch('/FileUpload/UploadVoiceMessage', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
        }

        if (data.success) {
            const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
            if (isSignalRInitialized && connection && connection.state === 'Connected') {
                await connection.invoke("SendVoiceMessage", selectedUserId, data.voiceUrl, duration);
                console.log('✅ Voice message sent successfully');
            } else {
                console.error('❌ SignalR not connected for sending voice message. State:', connection ? connection.state : 'null');
                alert('Kết nối SignalR không sẵn sàng. Vui lòng thử lại.');
            }
        } else {
            alert('Lỗi upload voice: ' + data.error);
        }
    } catch (err) {
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
        }
        console.error('❌ Upload voice error:', err);
        alert('Lỗi upload voice message');
    }
}
