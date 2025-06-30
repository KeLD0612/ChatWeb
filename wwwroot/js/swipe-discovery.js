
/**
 * Tinder-style Swipe Discovery JavaScript
 * Author: AI Assistant
 * Description: Vanilla JavaScript implementation for swipe cards with touch and mouse support
 */

class TinderSwipe {
    constructor(options = {}) {
        // Default configuration
        this.config = {
            cardStackSelector: '#cardStack',
            leftIndicatorSelector: '#leftIndicator',
            rightIndicatorSelector: '#rightIndicator',
            passButtonSelector: '#passBtn',
            likeButtonSelector: '#likeBtn',
            emptyStateSelector: '#emptyState',
            reloadButtonSelector: '#reloadBtn',
            loadingSpinnerSelector: '#loadingSpinner',
            swipeThreshold: 100,
            rotationFactor: 0.1,
            animationDuration: 300,
            preloadCards: 5,
            ...options
        };

        // State management
        this.state = {
            isDragging: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            currentCard: null,
            users: [],
            currentIndex: 0,
            isLoading: false,
            requestToken: null
        };

        // Initialize the swipe system
        this.init();
    }

    /**
     * Initialize the swipe system
     */
    async init() {
        try {
            // Get DOM elements
            this.getElements();

            // Get anti-forgery token
            await this.getAntiForgeryToken();

            // Setup event listeners
            this.setupEventListeners();

            // Load initial users
            await this.loadUsers();

            console.log('✅ TinderSwipe initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize TinderSwipe:', error);
        }
    }

    /**
     * Get DOM elements
     */
    getElements() {
        this.elements = {
            cardStack: document.querySelector(this.config.cardStackSelector),
            leftIndicator: document.querySelector(this.config.leftIndicatorSelector),
            rightIndicator: document.querySelector(this.config.rightIndicatorSelector),
            passButton: document.querySelector(this.config.passButtonSelector),
            likeButton: document.querySelector(this.config.likeButtonSelector),
            emptyState: document.querySelector(this.config.emptyStateSelector),
            reloadButton: document.querySelector(this.config.reloadButtonSelector),
            loadingSpinner: document.querySelector(this.config.loadingSpinnerSelector)
        };

        // Validate required elements
        if (!this.elements.cardStack) {
            throw new Error('Card stack element not found');
        }
    }

    /**
     * Get anti-forgery token for AJAX requests
     */
    async getAntiForgeryToken() {
        const tokenElement = document.querySelector('input[name="__RequestVerificationToken"]');
        if (tokenElement) {
            this.state.requestToken = tokenElement.value;
        } else {
            // Try to get token from meta tag
            const metaToken = document.querySelector('meta[name="__RequestVerificationToken"]');
            if (metaToken) {
                this.state.requestToken = metaToken.getAttribute('content');
            }
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Card drag events (mouse)
        this.elements.cardStack.addEventListener('mousedown', this.handleStart.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('mouseup', this.handleEnd.bind(this));

        // Card drag events (touch)
        this.elements.cardStack.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleEnd.bind(this));

        // Action buttons
        if (this.elements.passButton) {
            this.elements.passButton.addEventListener('click', () => this.swipeCard('left'));
        }

        if (this.elements.likeButton) {
            this.elements.likeButton.addEventListener('click', () => this.swipeCard('right'));
        }

        // Reload button
        if (this.elements.reloadButton) {
            this.elements.reloadButton.addEventListener('click', this.reloadUsers.bind(this));
        }

        // Keyboard support
        document.addEventListener('keydown', this.handleKeyboard.bind(this));

        // Prevent context menu on long press
        this.elements.cardStack.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Handle start of drag (mouse/touch)
     */
    handleStart(e) {
        const card = e.target.closest('.user-card');
        if (!card || card !== this.getCurrentCard()) return;

        this.state.isDragging = true;
        this.state.currentCard = card;

        // Get initial position
        if (e.type === 'mousedown') {
            this.state.startX = e.clientX;
            this.state.startY = e.clientY;
        } else if (e.type === 'touchstart') {
            this.state.startX = e.touches[0].clientX;
            this.state.startY = e.touches[0].clientY;
        }

        // Reset current position
        this.state.currentX = 0;
        this.state.currentY = 0;

        // Add dragging class
        card.classList.add('dragging');

        // Prevent default to avoid text selection
        e.preventDefault();
    }

    /**
     * Handle drag movement (mouse/touch)
     */
    handleMove(e) {
        if (!this.state.isDragging || !this.state.currentCard) return;

        let clientX, clientY;

        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            e.preventDefault(); // Prevent scrolling
        }

        // Calculate movement
        this.state.currentX = clientX - this.state.startX;
        this.state.currentY = clientY - this.state.startY;

        // Apply transformation
        this.updateCardTransform();

        // Show/hide indicators
        this.updateIndicators();
    }

    /**
     * Handle end of drag (mouse/touch)
     */
    handleEnd(e) {
        if (!this.state.isDragging || !this.state.currentCard) return;

        const card = this.state.currentCard;
        const deltaX = this.state.currentX;

        // Remove dragging class
        card.classList.remove('dragging');

        // Determine swipe direction
        if (Math.abs(deltaX) > this.config.swipeThreshold) {
            const direction = deltaX > 0 ? 'right' : 'left';
            this.animateCardExit(direction);
        } else {
            // Snap back to center
            this.animateCardReturn();
        }

        // Hide indicators
        this.hideIndicators();

        // Reset state
        this.state.isDragging = false;
        this.state.currentCard = null;
    }

    /**
     * Handle keyboard input
     */
    handleKeyboard(e) {
        if (this.state.isDragging) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.swipeCard('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.swipeCard('right');
                break;
            case 'Space':
                e.preventDefault();
                this.swipeCard('right');
                break;
            case 'Escape':
                e.preventDefault();
                this.reloadUsers();
                break;
        }
    }

    /**
     * Update card transform during drag
     */
    updateCardTransform() {
        if (!this.state.currentCard) return;

        const { currentX, currentY } = this.state;
        const rotation = currentX * this.config.rotationFactor;
        const opacity = Math.max(0.5, 1 - Math.abs(currentX) / 300);

        this.state.currentCard.style.transform = 
            `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;
        this.state.currentCard.style.opacity = opacity;
    }

    /**
     * Update swipe indicators during drag
     */
    updateIndicators() {
        const { currentX } = this.state;
        const threshold = this.config.swipeThreshold;

        if (currentX > threshold / 2) {
            this.showIndicator('right');
            this.hideIndicator('left');
        } else if (currentX < -threshold / 2) {
            this.showIndicator('left');
            this.hideIndicator('right');
        } else {
            this.hideIndicators();
        }
    }

    /**
     * Show specific indicator
     */
    showIndicator(direction) {
        const indicator = direction === 'left' ? 
            this.elements.leftIndicator : this.elements.rightIndicator;

        if (indicator) {
            indicator.classList.add('active');
        }
    }

    /**
     * Hide specific indicator
     */
    hideIndicator(direction) {
        const indicator = direction === 'left' ? 
            this.elements.leftIndicator : this.elements.rightIndicator;

        if (indicator) {
            indicator.classList.remove('active');
        }
    }

    /**
     * Hide all indicators
     */
    hideIndicators() {
        if (this.elements.leftIndicator) {
            this.elements.leftIndicator.classList.remove('active');
        }
        if (this.elements.rightIndicator) {
            this.elements.rightIndicator.classList.remove('active');
        }
    }

    /**
     * Animate card exit
     */
    animateCardExit(direction) {
        if (!this.state.currentCard) return;

        const card = this.state.currentCard;
        const exitX = direction === 'right' ? window.innerWidth : -window.innerWidth;
        const rotation = direction === 'right' ? 30 : -30;

        // Show indicator during animation
        this.showIndicator(direction);

        // Animate exit
        card.style.transition = `transform ${this.config.animationDuration}ms ease-out, 
                                opacity ${this.config.animationDuration}ms ease-out`;
        card.style.transform = `translate(${exitX}px, -100px) rotate(${rotation}deg)`;
        card.style.opacity = '0';

        // Remove card after animation
        setTimeout(() => {
            this.removeCard(direction === 'right' ? 'like' : 'pass');
            this.hideIndicators();
        }, this.config.animationDuration);
    }

    /**
     * Animate card return to center
     */
    animateCardReturn() {
        if (!this.state.currentCard) return;

        const card = this.state.currentCard;

        card.style.transition = `transform ${this.config.animationDuration}ms ease-out, 
                                opacity ${this.config.animationDuration}ms ease-out`;
        card.style.transform = 'translate(0px, 0px) rotate(0deg)';
        card.style.opacity = '1';

        // Remove transition after animation
        setTimeout(() => {
            card.style.transition = '';
        }, this.config.animationDuration);
    }

    /**
     * Programmatically swipe card
     */
    swipeCard(direction) {
        const card = this.getCurrentCard();
        if (!card) return;

        this.state.currentCard = card;
        this.animateCardExit(direction);
    }

    /**
     * Remove card and process swipe action
     */
    async removeCard(action) {
        const card = this.state.currentCard;
        if (!card) return;

        const userId = card.dataset.userId;

        // Remove card from DOM
        card.remove();

        // Update index
        this.state.currentIndex++;

        // Send swipe action to server
        await this.sendSwipeAction(userId, action);

        // Check if we need to load more cards
        if (this.getRemainingCards() <= 2) {
            await this.loadUsers();
        }

        // Check if no cards left
        if (this.getRemainingCards() === 0) {
            this.showEmptyState();
        }

        // Update card stack styling
        this.updateCardStack();
    }

    /**
     * Get current (top) card
     */
    getCurrentCard() {
        return this.elements.cardStack.querySelector('.user-card');
    }

    /**
     * Get number of remaining cards
     */
    getRemainingCards() {
        return this.elements.cardStack.querySelectorAll('.user-card').length;
    }

    /**
     * Update card stack styling
     */
    updateCardStack() {
        const cards = this.elements.cardStack.querySelectorAll('.user-card');
        cards.forEach((card, index) => {
            card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            if (index === 0) {
                card.style.transform = 'scale(1) translateY(0px)';
                card.style.opacity = '1';
                card.style.zIndex = '3';
            } else if (index === 1) {
                card.style.transform = 'scale(0.95) translateY(10px)';
                card.style.opacity = '0.8';
                card.style.zIndex = '2';
            } else if (index === 2) {
                card.style.transform = 'scale(0.9) translateY(20px)';
                card.style.opacity = '0.6';
                card.style.zIndex = '1';
            } else {
                card.style.transform = 'scale(0.85) translateY(30px)';
                card.style.opacity = '0';
                card.style.zIndex = '0';
            }
        });
    }

    /**
     * Load users from server
     */
    async loadUsers() {
        if (this.state.isLoading) return;

        this.state.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch('/Discovery/GetUsers', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': this.state.requestToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const users = await response.json();
            this.addUsers(users);

        } catch (error) {
            console.error('Failed to load users:', error);
            this.showError('Không thể tải danh sách người dùng. Vui lòng thử lại.');
        } finally {
            this.state.isLoading = false;
            this.hideLoading();
        }
    }

    /**
     * Add users to the stack
     */
    addUsers(users) {
        if (!Array.isArray(users) || users.length === 0) {
            if (this.getRemainingCards() === 0) {
                this.showEmptyState();
            }
            return;
        }

        this.hideEmptyState();

        users.forEach((user, index) => {
            const cardElement = this.createCardElement(user);
            this.elements.cardStack.appendChild(cardElement);
        });

        this.updateCardStack();
        console.log(`✅ Added ${users.length} new users`);
    }

    /**
     * Create card element for user
     */
    createCardElement(user) {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.dataset.userId = user.id;

        const avatar = user.fullName ? user.fullName.charAt(0).toUpperCase() : '👤';
        const joinDate = new Date(user.createdAt).toLocaleDateString('vi-VN');

        card.innerHTML = `
            <div class="card-header">
                <div class="user-avatar">${avatar}</div>
                <h2 class="user-name">${user.fullName || 'Người dùng'}</h2>
                <p class="user-bio">${user.bio || 'Chưa có thông tin giới thiệu'}</p>
            </div>
            <div class="user-meta">
                <div class="meta-item">
                    <div class="meta-label">Tham gia</div>
                    <div class="meta-value">${joinDate}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">ID</div>
                    <div class="meta-value">#${user.id}</div>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Send swipe action to server
     */
    async sendSwipeAction(userId, action) {
        try {
            const response = await fetch('/Discovery/SwipeAction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': this.state.requestToken
                },
                body: JSON.stringify({
                    userId: userId,
                    action: action
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.isMatch) {
                this.showMatchNotification(result.matchedUser);
            }

        } catch (error) {
            console.error('Failed to send swipe action:', error);
        }
    }

    /**
     * Show match notification
     */
    showMatchNotification(matchedUser) {
        // Create and show match popup
        const popup = document.createElement('div');
        popup.className = 'match-popup';
        popup.innerHTML = `
            <div class="match-content">
                <h2>🎉 It's a Match!</h2>
                <p>Bạn và ${matchedUser.fullName} đã thích nhau!</p>
                <button onclick="this.parentElement.parentElement.remove()">Tuyệt vời!</button>
            </div>
        `;

        document.body.appendChild(popup);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (popup.parentElement) {
                popup.remove();
            }
        }, 5000);
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'block';
        }
    }

    /**
     * Hide empty state
     */
    hideEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'none';
        }
    }

    /**
     * Show loading spinner
     */
    showLoading() {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = 'block';
        }
    }

    /**
     * Hide loading spinner
     */
    hideLoading() {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Simple alert for now - can be enhanced with custom modal
        alert(message);
    }

    /**
     * Reload users
     */
    async reloadUsers() {
        // Clear current cards
        this.elements.cardStack.innerHTML = '';
        this.state.currentIndex = 0;

        // Hide empty state
        this.hideEmptyState();

        // Load fresh users
        await this.loadUsers();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize TinderSwipe
    window.tinderSwipe = new TinderSwipe();

    console.log('🚀 Tinder-style swipe discovery loaded successfully!');
});

// Handle page visibility change to pause/resume
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('📱 Page hidden - pausing interactions');
    } else {
        console.log('📱 Page visible - resuming interactions');
    }
});
