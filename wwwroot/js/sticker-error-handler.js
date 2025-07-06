// sticker-error-handler.js - Xử lý lỗi cho sticker

// Error handling cho sticker
function handleStickerError(error, context) {
    console.error('🎪 Sticker Error:', error, 'Context:', context);

    switch (context) {
        case 'load':
            showNotification('Không thể tải sticker', 'warning');
            break;
        case 'send':
            showNotification('Không thể gửi sticker', 'error');
            break;
        case 'display':
            showNotification('Lỗi hiển thị sticker', 'warning');
            break;
        default:
            showNotification('Lỗi sticker', 'error');
    }
}

// Validate sticker URL
function validateStickerUrl(url) {
    const validDomains = ['tenor.com', 'giphy.com', 'media.tenor.com'];
    const validExtensions = ['.gif', '.png', '.jpg', '.jpeg', '.webp'];

    try {
        const urlObj = new URL(url);
        const hasValidDomain = validDomains.some(domain => urlObj.hostname.includes(domain));
        const hasValidExtension = validExtensions.some(ext => url.toLowerCase().includes(ext));

        return hasValidDomain || hasValidExtension;
    } catch {
        return false;
    }
}

// Preload sticker với error handling
function preloadStickerSafe(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Failed to load sticker'));
        img.src = url;

        // Timeout sau 5 giây
        setTimeout(() => reject(new Error('Sticker load timeout')), 5000);
    });
}

// Export functions
window.handleStickerError = handleStickerError;
window.validateStickerUrl = validateStickerUrl;
window.preloadStickerSafe = preloadStickerSafe;