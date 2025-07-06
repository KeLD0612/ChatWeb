// File location: wwwroot/js/home-explore.js

// Global variables
let currentSkip = 0;
let isLoading = false;
let currentTargetUserId = null;

// Base API URL for Home Explore
const API_BASE_URL = '/Home';

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
 * File location: wwwroot/js/home-explore.js
 */
function initializeExplore() {
    console.log('Home Explore page initialized with API base:', API_BASE_URL);
    
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
 * File location: wwwroot/js/home-explore.js
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
 * File location: wwwroot/js/home-explore.js
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