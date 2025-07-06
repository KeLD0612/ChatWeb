// location-sharing.js - Xử lý chức năng chia sẻ vị trí

let map = null;
let marker = null;
let currentPosition = null;
let locationPickerOpen = false;

// Khởi tạo modal chia sẻ vị trí
function initLocationSharing() {
    console.log('🗺️ Initializing location sharing...');

    // Tạo modal nếu chưa có
    if (!document.getElementById('locationSharingModal')) {
        createLocationSharingModal();
    }

    // Setup event listeners
    setupLocationSharingEvents();
}

// Tạo HTML cho modal chia sẻ vị trí
function createLocationSharingModal() {
    const modalHTML = `
        <div class="modal fade" id="locationSharingModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chia sẻ vị trí</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="locationStatusContainer" class="mb-3">
                            <div class="alert alert-info">
                                <i class="fas fa-location-arrow"></i> Đang tìm vị trí của bạn...
                            </div>
                        </div>
                        
                        <div id="locationMap" style="height: 400px; border-radius: 10px; margin-bottom: 15px;"></div>
                        
                        <div class="input-group mb-3">
                            <span class="input-group-text"><i class="fas fa-map-marker-alt"></i></span>
                            <input type="text" class="form-control" id="locationName" 
                                   placeholder="Tên địa điểm (tùy chọn)">
                        </div>
                        
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-outline-secondary" id="refreshLocationBtn">
                                <i class="fas fa-sync-alt"></i> Làm mới vị trí
                            </button>
                            <div>
                                <button class="btn btn-outline-secondary me-2" data-bs-dismiss="modal">
                                    Hủy
                                </button>
                                <button class="btn btn-primary" id="sendLocationBtn" disabled>
                                    <i class="fas fa-paper-plane"></i> Gửi vị trí
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Setup event listeners cho location sharing
function setupLocationSharingEvents() {
    // Nút mở modal chia sẻ vị trí
    const attachButton = document.getElementById('attachButton');
    if (attachButton) {
        attachButton.parentElement.insertAdjacentHTML('beforeend', `
            <button class="btn btn-outline-info" id="locationButton" disabled title="Chia sẻ vị trí">
                <i class="fas fa-map-marker-alt"></i>
            </button>
        `);

        const locationButton = document.getElementById('locationButton');
        if (locationButton) {
            locationButton.addEventListener('click', openLocationSharing);

            // Enable button if user is selected
            if (selectedUserId) {
                locationButton.disabled = false;
            }
        }
    }

    // Event khi mở modal
    const locationModal = document.getElementById('locationSharingModal');
    if (locationModal) {
        locationModal.addEventListener('shown.bs.modal', initializeMap);

        // Các event khác
        const refreshBtn = document.getElementById('refreshLocationBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', getCurrentLocation);
        }

        const sendBtn = document.getElementById('sendLocationBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', sendLocation);
        }
    }
}

// Mở modal chia sẻ vị trí
function openLocationSharing() {
    if (!selectedUserId) {
        alert('Vui lòng chọn người để chia sẻ vị trí!');
        return;
    }

    locationPickerOpen = true;

    // Hiển thị modal
    const locationModal = document.getElementById('locationSharingModal');
    if (locationModal) {
        const bsModal = new bootstrap.Modal(locationModal);
        bsModal.show();
    }
}

// Initialize map với Google Maps
function initializeMap() {
    // Kiểm tra thư viện Google Maps đã được load chưa
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        loadGoogleMapsScript().then(() => {
            initMap();
        }).catch(error => {
            console.error('Failed to load Google Maps:', error);
            showLocationError('Không thể tải bản đồ. Vui lòng thử lại sau.');
        });
    } else {
        initMap();
    }
}

// Load Google Maps script
function loadGoogleMapsScript() {
    return new Promise((resolve, reject) => {
        // Kiểm tra nếu script đã được load
        if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
            resolve();
            return;
        }

        // API key - Trong thực tế, bạn nên thay thế bằng API key của bạn
        const apiKey = 'AIzaSyCQKMXgZ4vpzAW_TityXgmemWfy9vLvW44';
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = resolve;
        script.onerror = reject;

        document.head.appendChild(script);
    });
}

// Khởi tạo bản đồ
function initMap() {
    // Default là trung tâm Hà Nội
    const defaultPosition = { lat: 21.0278, lng: 105.8342 };

    // Tạo map instance
    map = new google.maps.Map(document.getElementById('locationMap'), {
        center: defaultPosition,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });

    // Tạo marker
    marker = new google.maps.Marker({
        position: defaultPosition,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP
    });

    // Sự kiện khi kéo marker
    marker.addListener('dragend', function () {
        const position = marker.getPosition();
        currentPosition = {
            lat: position.lat(),
            lng: position.lng()
        };

        // Reverse geocoding để lấy tên địa điểm
        reverseGeocode(currentPosition);

        // Enable send button
        document.getElementById('sendLocationBtn').disabled = false;
    });

    // Sự kiện khi click vào map
    map.addListener('click', function (event) {
        marker.setPosition(event.latLng);
        currentPosition = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };

        // Reverse geocoding để lấy tên địa điểm
        reverseGeocode(currentPosition);

        // Enable send button
        document.getElementById('sendLocationBtn').disabled = false;
    });

    // Lấy vị trí hiện tại
    getCurrentLocation();
}

// Lấy vị trí hiện tại
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showLocationError('Trình duyệt của bạn không hỗ trợ định vị.');
        return;
    }

    const statusContainer = document.getElementById('locationStatusContainer');
    if (statusContainer) {
        statusContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-spinner fa-spin"></i> Đang xác định vị trí của bạn...
            </div>
        `;
    }

    navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
            currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            if (map && marker) {
                map.setCenter(currentPosition);
                marker.setPosition(currentPosition);

                // Reverse geocoding để lấy tên địa điểm
                reverseGeocode(currentPosition);

                if (statusContainer) {
                    statusContainer.innerHTML = `
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i> Đã xác định được vị trí của bạn
                        </div>
                    `;
                }

                // Enable send button
                document.getElementById('sendLocationBtn').disabled = false;
            }
        },
        // Error callback
        (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Không thể xác định vị trí của bạn.';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Bạn đã từ chối quyền truy cập vị trí.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Thông tin vị trí không có sẵn.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Yêu cầu vị trí đã hết thời gian chờ.';
                    break;
            }

            showLocationError(errorMessage);
        },
        // Options
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Hiển thị lỗi định vị
function showLocationError(message) {
    const statusContainer = document.getElementById('locationStatusContainer');
    if (statusContainer) {
        statusContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </div>
        `;
    }
}

// Reverse geocoding để lấy tên địa điểm
function reverseGeocode(position) {
    if (!position || !google) return;

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ location: position }, (results, status) => {
        if (status === 'OK' && results[0]) {
            const locationName = results[0].formatted_address;
            const locationInput = document.getElementById('locationName');
            if (locationInput) {
                locationInput.value = locationName;
            }
        }
    });
}

// Gửi vị trí qua SignalR
async function sendLocation() {
    if (!selectedUserId || !currentPosition) {
        showNotification('Không thể gửi vị trí. Vui lòng thử lại.', 'error');
        return;
    }

    if (!isSignalRInitialized || !connection || connection.state !== 'Connected') {
        showNotification('Kết nối SignalR không sẵn sàng. Vui lòng thử lại.', 'error');
        return;
    }

    try {
        const locationName = document.getElementById('locationName').value || 'Vị trí của tôi';

        // Gửi vị trí qua SignalR
        await connection.invoke(
            "SendLocationMessage",
            selectedUserId,
            currentPosition.lat,
            currentPosition.lng,
            locationName
        );

        console.log('✅ Location sent successfully');

        // Đóng modal
        const locationModal = document.getElementById('locationSharingModal');
        if (locationModal) {
            const bsModal = bootstrap.Modal.getInstance(locationModal);
            if (bsModal) {
                bsModal.hide();
            }
        }

        // Hiển thị thông báo thành công
        showNotification('Đã gửi vị trí thành công!', 'success');
    } catch (err) {
        console.error('❌ Send location error:', err);
        showNotification('Không thể gửi vị trí. Vui lòng thử lại.', 'error');
    }
}

// Hiển thị location message
function displayLocationMessage(message) {
    console.log('=== displayLocationMessage ===', message);

    if (!message || !message.id) {
        console.error('Invalid location message data');
        return;
    }

    // Tạo message object cho displayMessage
    const messageObj = {
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        content: {
            latitude: message.latitude,
            longitude: message.longitude,
            locationName: message.locationName,
            mapImageUrl: message.mapImageUrl
        },
        messageType: 'location',
        timestamp: message.timestamp,
        isSender: message.isSender
    };

    // Sử dụng hàm displayMessage có sẵn
    displayMessage(messageObj);
}

// Mở vị trí trên Google Maps
function openLocationInMaps(latitude, longitude) {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
}

// Khởi tạo khi trang được load
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        initLocationSharing();

        // Thêm handler cho location messages từ SignalR
        if (connection) {
            connection.on("ReceiveLocationMessage", function (
                senderId, senderName, latitude, longitude, locationName, mapImageUrl, timestamp, messageId
            ) {
                console.log("=== ReceiveLocationMessage DEBUG ===");

                const message = {
                    id: messageId,
                    senderId: senderId,
                    senderName: senderName,
                    latitude: latitude,
                    longitude: longitude,
                    locationName: locationName,
                    mapImageUrl: mapImageUrl,
                    timestamp: timestamp,
                    isSender: senderId === currentUserId
                };

                displayLocationMessage(message);
            });
        }
    }, 1000);
});

// Export functions for global access
window.openLocationInMaps = openLocationInMaps;
window.displayLocationMessage = displayLocationMessage;