// File location: wwwroot/js/explore.js

// Global variables
let currentSkip = 0;
let isLoading = false;
let currentTargetUserId = null;

// DOM Elements
const cardsContainer = document.getElementById('cardsContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const quickMessageModal = document.getElementById('quickMessageModal');
const quickMessageForm = document.getElementById('quickMessageForm');
const quickMessageText = document.getElementById('quickMessageText');
const targetUserName = document.getElementById('targetUserName');
const charCount = document.getElementById('charCount');
const loadingOverlay = document.getElementById('loadingOverlay');
const notification = document.getElementById('notification');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeExplore();
    setupEventListeners();
    updateCharCount();
});

/**
 * Initialize explore page functionality
 * File location: wwwroot/js/explore.js
 */
function initializeExplore() {
    console.log('Explore page initialized');
    
    // Count initial cards for skip calculation
    const initialCards = document.querySelectorAll('.user-card').length;
    currentSkip = initialCards;
    
    // Setup image navigation for existing cards
    setupImageNavigation();
    
    // Setup filter functionality
    setupFilters();
    
    // Auto-show online status
    updateOnlineStatus();
}

/**
 * Setup all event listeners
 * File location: wwwroot/js/explore.js
 */
function setupEventListeners() {
    // Quick message form submission
    if (quickMessageForm) {
        quickMessageForm.addEventListener('submit', handleQuickMessageSubmit);
    }
    
    // Character counter for message textarea
    if (quickMessageText) {
        quickMessageText.addEventListener('input', updateCharCount);
    }
    
    // Close modal when clicking outside
    if (quickMessageModal) {
        quickMessageModal.addEventListener('click', function(e) {
            if (e.target === quickMessageModal) {
                closeQuickMessage();
            }
        });
    }
    
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            setActiveFilter(this);
        });
    });
    
    // Filter selects
    const ageFilter = document.getElementById('ageFilter');
    const genderFilter = document.getElementById('genderFilter');
    
    if (ageFilter) {
        ageFilter.addEventListener('change', applyFilters);
    }
    
    if (genderFilter) {
        genderFilter.addEventListener('change', applyFilters);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Setup image navigation for cards
 * File location: wwwroot/js/explore.js
 */
function setupImageNavigation() {
    document.querySelectorAll('.user-card').forEach(card => {
        const images = card.querySelectorAll('.card-image');
        const indicators = card.querySelectorAll('.indicator');
        
        // Setup indicator clicks
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                showImage(card, index);
            });
        });
        
        // Setup swipe/touch for mobile
        let startX = 0;
        let startY = 0;
        
        const imageContainer = card.querySelector('.card-images');
        if (imageContainer) {
            imageContainer.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            });
            
            imageContainer.addEventListener('touchend', (e) => {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = startX - endX;
                const diffY = startY - endY;
                
                // Only handle horizontal swipes
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        // Swipe left - next image
                        changeImage(imageContainer.querySelector('.next-arrow'), 1);
                    } else {
                        // Swipe right - previous image
                        changeImage(imageContainer.querySelector('.prev-arrow'), -1);
                    }
                }
            });
        }
    });
}

/**
 * Change image in card
 * File location: wwwroot/js/explore.js
 */
function changeImage(button, direction) {
    const card = button.closest('.user-card');
    const images = card.querySelectorAll('.card-image');
    const indicators = card.querySelectorAll('.indicator');
    
    if (images.length <= 1) return;
    
    let currentIndex = 0;
    images.forEach((img, index) => {
        if (img.classList.contains('active')) {
            currentIndex = index;
        }
    });
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    
    showImage(card, newIndex);
}

/**
 * Show specific image in card
 * File location: wwwroot/js/explore.js
 */
function showImage(card, index) {
    const images = card.querySelectorAll('.card-image');
    const indicators = card.querySelectorAll('.indicator');
    
    images.forEach((img, i) => {
        img.classList.toggle('active', i === index);
    });
    
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
}

/**
 * Handle user like action
 * File location: wwwroot/js/explore.js
 */
async function likeUser(userId) {
    try {
        showLoading(true);
        
        const response = await fetch('/Explore/LikeUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getAntiForgeryToken()
            },
            body: JSON.stringify({ userId: userId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Đã thả tim! 💖', 'success');
            
            // Add heart animation
            animateHeart(userId);
            
            // Hide the card after a short delay
            setTimeout(() => {
                hideCard(userId);
            }, 1000);
            
        } else {
            showNotification(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error liking user:', error);
        showNotification('Có lỗi xảy ra khi thả tim', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle super like action
 * File location: wwwroot/js/explore.js
 */
async function superLikeUser(userId) {
    try {
        showLoading(true);
        
        // For now, treat as regular like but with different animation
        const response = await fetch('/Explore/LikeUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getAntiForgeryToken()
            },
            body: JSON.stringify({ userId: userId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Siêu thích! ⭐', 'success');
            
            // Add star animation
            animateStar(userId);
            
            // Hide the card after a short delay
            setTimeout(() => {
                hideCard(userId);
            }, 1000);
            
        } else {
            showNotification(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error super liking user:', error);
        showNotification('Có lỗi xảy ra', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle pass user action
 * File location: wwwroot/js/explore.js
 */
function passUser(userId) {
    showNotification('Đã bỏ qua', 'info');
    
    // Add pass animation
    animatePass(userId);
    
    // Hide the card
    setTimeout(() => {
        hideCard(userId);
    }, 500);
}

/**
 * Show quick message modal
 * File location: wwwroot/js/explore.js
 */
function showQuickMessage(userId, userName) {
    currentTargetUserId = userId;
    
    if (targetUserName) {
        targetUserName.textContent = userName;
    }
    
    if (quickMessageText) {
        quickMessageText.value = '';
        quickMessageText.focus();
    }
    
    updateCharCount();
    
    if (quickMessageModal) {
        quickMessageModal.classList.add('active');
        
        // Increase view count when opening message modal
        increaseViewCount(userId);
    }
}

/**
 * Close quick message modal
 * File location: wwwroot/js/explore.js
 */
function closeQuickMessage() {
    if (quickMessageModal) {
        quickMessageModal.classList.remove('active');
    }
    currentTargetUserId = null;
}

/**
 * Handle quick message form submission
 * File location: wwwroot/js/explore.js
 */
async function handleQuickMessageSubmit(e) {
    e.preventDefault();
    
    if (!currentTargetUserId || !quickMessageText.value.trim()) {
        showNotification('Vui lòng nhập tin nhắn', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch('/Explore/SendQuickMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getAntiForgeryToken()
            },
            body: JSON.stringify({
                userId: currentTargetUserId,
                message: quickMessageText.value.trim()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Tin nhắn đã được gửi! 💌', 'success');
            closeQuickMessage();
            
            // Optionally redirect to chat
            if (result.chatUrl) {
                setTimeout(() => {
                    if (confirm('Bạn có muốn chuyển đến trang chat không?')) {
                        window.location.href = result.chatUrl;
                    }
                }, 1000);
            }
        } else {
            showNotification(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Có lỗi xảy ra khi gửi tin nhắn', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Select suggestion message
 * File location: wwwroot/js/explore.js
 */
function selectSuggestion(message) {
    if (quickMessageText) {
        quickMessageText.value = message;
        quickMessageText.focus();
        updateCharCount();
    }
}

/**
 * Update character count
 * File location: wwwroot/js/explore.js
 */
function updateCharCount() {
    if (quickMessageText && charCount) {
        const count = quickMessageText.value.length;
        charCount.textContent = count;
        
        // Change color based on limit
        if (count > 450) {
            charCount.style.color = '#f44336';
        } else if (count > 400) {
            charCount.style.color = '#ff9800';
        } else {
            charCount.style.color = '#6c757d';
        }
    }
}

/**
 * Load more users
 * File location: wwwroot/js/explore.js
 */
async function loadMoreUsers() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoading(true);
        
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';
        }
        
        const response = await fetch(`/Explore/GetMoreUsers?skip=${currentSkip}&take=10`);
        const result = await response.json();
        
        if (result.success && result.users && result.users.length > 0) {
            appendUsers(result.users);
            currentSkip += result.users.length;
            
            showNotification(`Đã tải thêm ${result.users.length} người`, 'success');
        } else {
            showNotification('Không có thêm người nào để hiển thị', 'info');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading more users:', error);
        showNotification('Có lỗi xảy ra khi tải thêm', 'error');
    } finally {
        isLoading = false;
        showLoading(false);
        
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Xem thêm';
        }
    }
}

/**
 * Append new users to cards container
 * File location: wwwroot/js/explore.js
 */
function appendUsers(users) {
    users.forEach(user => {
        const cardHtml = createUserCardHtml(user);
        cardsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
    
    // Setup image navigation for new cards
    setupImageNavigation();
}

/**
 * Create HTML for user card
 * File location: wwwroot/js/explore.js
 */
function createUserCardHtml(user) {
    const photoUrls = user.photoUrls ? JSON.parse(user.photoUrls) : [];
    if (user.profilePictureUrl && !photoUrls.includes(user.profilePictureUrl)) {
        photoUrls.unshift(user.profilePictureUrl);
    }
    
    const interests = user.interests ? JSON.parse(user.interests) : [];
    
    let imagesHtml = '';
    if (photoUrls.length > 0) {
        photoUrls.slice(0, 5).forEach((url, index) => {
            imagesHtml += `
                <div class="card-image ${index === 0 ? 'active' : ''}" style="background-image: url('${url}')">
                    ${photoUrls.length > 1 ? `
                        <div class="image-indicators">
                            ${photoUrls.slice(0, 5).map((_, i) => `
                                <span class="indicator ${i === index ? 'active' : ''}" data-index="${i}"></span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
    } else {
        imagesHtml = `
            <div class="card-image active no-image">
                <div class="no-image-placeholder">
                    <i class="fas fa-user"></i>
                    <p>Chưa có ảnh</p>
                </div>
            </div>
        `;
    }
    
    const navArrows = photoUrls.length > 1 ? `
        <button class="nav-arrow prev-arrow" onclick="changeImage(this, -1)">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="nav-arrow next-arrow" onclick="changeImage(this, 1)">
            <i class="fas fa-chevron-right"></i>
        </button>
    ` : '';
    
    const interestsHtml = interests.length > 0 ? `
        <div class="interests">
            ${interests.slice(0, 3).map(interest => `
                <span class="interest-tag">${interest}</span>
            `).join('')}
            ${interests.length > 3 ? `<span class="more-interests">+${interests.length - 3}</span>` : ''}
        </div>
    ` : '';
    
    return `
        <div class="user-card" data-user-id="${user.userId}" data-profile-id="${user.id}">
            <div class="card-images">
                ${imagesHtml}
                ${navArrows}
                <div class="online-status online">
                    <span class="status-dot"></span>
                    Đang hoạt động
                </div>
            </div>
            <div class="card-info">
                <div class="basic-info">
                    <h3 class="user-name">
                        ${user.fullName}
                        ${user.age ? `<span class="age">${user.age}</span>` : ''}
                    </h3>
                    <p class="location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${user.location || 'Chưa cập nhật'}
                    </p>
                </div>
                <div class="quick-info">
                    ${user.bio ? `<p class="bio">${user.bio}</p>` : ''}
                    ${interestsHtml}
                </div>
                <div class="card-stats">
                    <div class="stat">
                        <i class="fas fa-eye"></i>
                        <span>0</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-heart"></i>
                        <span>0</span>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="action-btn pass-btn" onclick="passUser('${user.userId}')" title="Bỏ qua">
                    <i class="fas fa-times"></i>
                </button>
                <button class="action-btn message-btn" onclick="showQuickMessage('${user.userId}', '${user.fullName}')" title="Nhắn tin">
                    <i class="fas fa-comment"></i>
                </button>
                <button class="action-btn like-btn" onclick="likeUser('${user.userId}')" title="Thích">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="action-btn superlike-btn" onclick="superLikeUser('${user.userId}')" title="Siêu thích">
                    <i class="fas fa-star"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Setup filter functionality
 * File location: wwwroot/js/explore.js
 */
function setupFilters() {
    // Initial filter state
    setActiveFilter(document.querySelector('.filter-tab[data-filter="all"]'));
}

/**
 * Set active filter tab
 * File location: wwwroot/js/explore.js
 */
function setActiveFilter(tab) {
    if (!tab) return;
    
    // Remove active class from all tabs
    document.querySelectorAll('.filter-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    // Add active class to selected tab
    tab.classList.add('active');
    
    // Apply filter
    applyFilters();
}

/**
 * Apply all filters
 * File location: wwwroot/js/explore.js
 */
function applyFilters() {
    const activeTab = document.querySelector('.filter-tab.active');
    const ageFilter = document.getElementById('ageFilter')?.value;
    const genderFilter = document.getElementById('genderFilter')?.value;
    
    const cards = document.querySelectorAll('.user-card');
    
    cards.forEach(card => {
        let show = true;
        
        // Apply gender filter
        if (genderFilter) {
            // Note: You'll need to add data attributes to cards for filtering
            // For now, we'll show all cards
        }
        
        // Apply age filter
        if (ageFilter) {
            // Note: You'll need to add data attributes to cards for filtering
            // For now, we'll show all cards
        }
        
        // Apply tab filter
        const filterType = activeTab?.dataset.filter;
        if (filterType === 'nearby') {
            // Filter by location - would need location data
        } else if (filterType === 'new') {
            // Filter by recently joined - would need join date
        }
        
        card.style.display = show ? 'flex' : 'none';
    });
}

/**
 * Increase view count for user
 * File location: wwwroot/js/explore.js
 */
async function increaseViewCount(userId) {
    try {
        await fetch('/Explore/IncreaseViewCount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': getAntiForgeryToken()
            },
            body: JSON.stringify({ userId: userId })
        });
    } catch (error) {
        console.error('Error increasing view count:', error);
    }
}

/**
 * Hide card with animation
 * File location: wwwroot/js/explore.js
 */
function hideCard(userId) {
    const card = document.querySelector(`[data-user-id="${userId}"]`);
    if (card) {
        card.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => {
            card.remove();
        }, 500);
    }
}

/**
 * Animate heart for like action
 * File location: wwwroot/js/explore.js
 */
function animateHeart(userId) {
    const card = document.querySelector(`[data-user-id="${userId}"]`);
    if (card) {
        const heart = document.createElement('div');
        heart.innerHTML = '💖';
        heart.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            z-index: 10;
            animation: heartPulse 1s ease forwards;
            pointer-events: none;
        `;
        
        card.appendChild(heart);
        
        setTimeout(() => {
            heart.remove();
        }, 1000);
    }
}

/**
 * Animate star for super like action
 * File location: wwwroot/js/explore.js
 */
function animateStar(userId) {
    const card = document.querySelector(`[data-user-id="${userId}"]`);
    if (card) {
        const star = document.createElement('div');
        star.innerHTML = '⭐';
        star.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            z-index: 10;
            animation: starSpin 1s ease forwards;
            pointer-events: none;
        `;
        
        card.appendChild(star);
        
        setTimeout(() => {
            star.remove();
        }, 1000);
    }
}

/**
 * Animate pass action
 * File location: wwwroot/js/explore.js
 */
function animatePass(userId) {
    const card = document.querySelector(`[data-user-id="${userId}"]`);
    if (card) {
        card.style.animation = 'slideLeft 0.5s ease forwards';
    }
}

/**
 * Handle keyboard shortcuts
 * File location: wwwroot/js/explore.js
 */
function handleKeyboardShortcuts(e) {
    // Only handle shortcuts if no modal is open and no input is focused
    if (quickMessageModal?.classList.contains('active') || 
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    
    const firstCard = document.querySelector('.user-card');
    if (!firstCard) return;
    
    const userId = firstCard.dataset.userId;
    const userName = firstCard.querySelector('.user-name')?.textContent.trim();
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'x':
            e.preventDefault();
            passUser(userId);
            break;
        case 'ArrowRight':
        case 'l':
            e.preventDefault();
            likeUser(userId);
            break;
        case 'ArrowUp':
        case 's':
            e.preventDefault();
            superLikeUser(userId);
            break;
        case 'm':
            e.preventDefault();
            showQuickMessage(userId, userName);
            break;
        case 'Escape':
            e.preventDefault();
            closeQuickMessage();
            break;
    }
}

/**
 * Update online status
 * File location: wwwroot/js/explore.js
 */
function updateOnlineStatus() {
    // Simulate online status updates
    const statuses = document.querySelectorAll('.online-status');
    statuses.forEach(status => {
        // Randomly show online/offline status
        const isOnline = Math.random() > 0.3;
        status.classList.toggle('online', isOnline);
        status.classList.toggle('offline', !isOnline);
        
        if (isOnline) {
            status.innerHTML = '<span class="status-dot"></span>Đang hoạt động';
        } else {
            status.innerHTML = '<span class="status-dot"></span>Offline';
        }
    });
}

/**
 * Show loading overlay
 * File location: wwwroot/js/explore.js
 */
function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('active', show);
    }
}

/**
 * Show notification
 * File location: wwwroot/js/explore.js
 */
function showNotification(message, type = 'success') {
    if (!notification) return;
    
    const icon = notification.querySelector('.notification-icon');
    const messageEl = notification.querySelector('.notification-message');
    
    // Remove existing type classes
    notification.classList.remove('success', 'error', 'warning', 'info');
    
    // Add new type class
    notification.classList.add(type);
    
    // Set icon based on type
    if (icon) {
        switch(type) {
            case 'success':
                icon.innerHTML = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
                break;
            case 'warning':
                icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            case 'info':
                icon.innerHTML = '<i class="fas fa-info-circle"></i>';
                break;
        }
    }
    
    // Set message
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    // Show notification
    notification.classList.add('show');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Get anti-forgery token
 * File location: wwwroot/js/explore.js
 */
function getAntiForgeryToken() {
    const token = document.querySelector('input[name="__RequestVerificationToken"]');
    return token ? token.value : '';
}

// CSS animations (to be added to explore.css)
const additionalCSS = `
@keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.8); }
}

@keyframes slideLeft {
    from { transform: translateX(0); }
    to { transform: translateX(-100%); }
}

@keyframes heartPulse {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

@keyframes starSpin {
    0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
    50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); opacity: 0; }
}
`;

// Add additional CSS if not already present
if (!document.querySelector('#explore-animations')) {
    const style = document.createElement('style');
    style.id = 'explore-animations';
    style.textContent = additionalCSS;
    document.head.appendChild(style);
}