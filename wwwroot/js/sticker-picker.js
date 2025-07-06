// sticker-picker.js - Hệ thống sticker chuyển động

// Sticker data với GIF chuyển động từ nguồn ổn định
const stickerData = {
    recent: [],

    // Danh mục Cảm xúc - GIF chuyển động
    emotions: [
        { id: 'emo_1', name: 'Happy Dance', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Grinning%20Face.png', type: 'animated' },
        { id: 'emo_2', name: 'Laughing', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20with%20Tears%20of%20Joy.png', type: 'animated' },
        { id: 'emo_3', name: 'Heart Eyes', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Heart-Eyes.png', type: 'animated' },
        { id: 'emo_4', name: 'Wink', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Winking%20Face.png', type: 'animated' },
        { id: 'emo_5', name: 'Thinking', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Thinking%20Face.png', type: 'animated' },
        { id: 'emo_6', name: 'Cool', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Sunglasses.png', type: 'animated' },
        { id: 'emo_7', name: 'Sad', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Crying%20Face.png', type: 'animated' },
        { id: 'emo_8', name: 'Angry', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Pouting%20Face.png', type: 'animated' },
        { id: 'emo_9', name: 'Party', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Partying%20Face.png', type: 'animated' },
        { id: 'emo_10', name: 'Kiss', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20Blowing%20a%20Kiss.png', type: 'animated' }
    ],

    // Danh mục Động vật chuyển động
    animals: [
        { id: 'ani_1', name: 'Cat', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png', type: 'animated' },
        { id: 'ani_2', name: 'Dog', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dog%20Face.png', type: 'animated' },
        { id: 'ani_3', name: 'Rabbit', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit%20Face.png', type: 'animated' },
        { id: 'ani_4', name: 'Bear', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Bear.png', type: 'animated' },
        { id: 'ani_5', name: 'Panda', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Panda.png', type: 'animated' },
        { id: 'ani_6', name: 'Tiger', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Tiger%20Face.png', type: 'animated' },
        { id: 'ani_7', name: 'Monkey', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Monkey%20Face.png', type: 'animated' },
        { id: 'ani_8', name: 'Unicorn', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Unicorn.png', type: 'animated' }
    ],

    // Danh mục Hành động chuyển động
    actions: [
        { id: 'act_1', name: 'Thumbs Up', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Thumbs%20Up.png', type: 'animated' },
        { id: 'act_2', name: 'Clap', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Clapping%20Hands.png', type: 'animated' },
        { id: 'act_3', name: 'Wave', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Waving%20Hand.png', type: 'animated' },
        { id: 'act_4', name: 'OK Hand', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/OK%20Hand.png', type: 'animated' },
        { id: 'act_5', name: 'Peace', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Victory%20Hand.png', type: 'animated' },
        { id: 'act_6', name: 'Muscle', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Flexed%20Biceps.png', type: 'animated' },
        { id: 'act_7', name: 'Dancing', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Man%20Dancing.png', type: 'animated' },
        { id: 'act_8', name: 'Running', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Man%20Running.png', type: 'animated' }
    ],

    // Danh mục Yêu thương chuyển động - VERSION CÓ NHIỀU STICKER ROMANTIC
    love: [
        // Hearts - Trái tim
        { id: 'lov_1', name: 'Red Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2764.png', type: 'animated' },
        { id: 'lov_2', name: 'Pink Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f49c.png', type: 'animated' },
        { id: 'lov_3', name: 'Yellow Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f49b.png', type: 'animated' },
        { id: 'lov_4', name: 'Blue Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f499.png', type: 'animated' },
        { id: 'lov_5', name: 'Purple Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f49c.png', type: 'animated' },
        { id: 'lov_6', name: 'Orange Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9e1.png', type: 'animated' },
        { id: 'lov_7', name: 'White Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f90d.png', type: 'animated' },
        { id: 'lov_8', name: 'Black Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f5a4.png', type: 'animated' },
        { id: 'lov_9', name: 'Brown Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f90e.png', type: 'animated' },
        { id: 'lov_10', name: 'Two Hearts', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f495.png', type: 'animated' },
        { id: 'lov_11', name: 'Revolving Hearts', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f49e.png', type: 'animated' },
        { id: 'lov_12', name: 'Beating Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f493.png', type: 'animated' },
        { id: 'lov_13', name: 'Growing Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f497.png', type: 'animated' },
        { id: 'lov_14', name: 'Sparkling Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f496.png', type: 'animated' },
        { id: 'lov_15', name: 'Heart with Arrow', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f498.png', type: 'animated' },
        { id: 'lov_16', name: 'Heart with Ribbon', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f49d.png', type: 'animated' },
        { id: 'lov_17', name: 'Broken Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f494.png', type: 'animated' },
        { id: 'lov_18', name: 'Mending Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2764-200d-1f527.png', type: 'animated' },

        // Romantic Faces - Khuôn mặt lãng mạn
        { id: 'lov_19', name: 'Heart Eyes', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f60d.png', type: 'animated' },
        { id: 'lov_20', name: 'Kissing Face', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f617.png', type: 'animated' },
        { id: 'lov_21', name: 'Blowing Kiss', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f618.png', type: 'animated' },
        { id: 'lov_22', name: 'Kissing Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f619.png', type: 'animated' },
        { id: 'lov_23', name: 'Smiling Hearts', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f970.png', type: 'animated' },
        { id: 'lov_24', name: 'Star Struck', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f929.png', type: 'animated' },

        // Romantic Gestures - Cử chỉ lãng mạn  
        { id: 'lov_25', name: 'Kiss Mark', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f48b.png', type: 'animated' },
        { id: 'lov_26', name: 'Love Letter', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f48c.png', type: 'animated' },
        { id: 'lov_27', name: 'Ring', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f48d.png', type: 'animated' },
        { id: 'lov_28', name: 'Gem', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f48e.png', type: 'animated' },
        { id: 'lov_29', name: 'Bouquet', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f490.png', type: 'animated' },
        { id: 'lov_30', name: 'Rose', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f339.png', type: 'animated' },
        { id: 'lov_31', name: 'Wilted Flower', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f940.png', type: 'animated' },
        { id: 'lov_32', name: 'Cherry Blossom', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f338.png', type: 'animated' },
        { id: 'lov_33', name: 'White Flower', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4ae.png', type: 'animated' },

        // Romantic Activities - Hoạt động lãng mạn
        { id: 'lov_34', name: 'Wedding', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f492.png', type: 'animated' },
        { id: 'lov_35', name: 'Bride', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f470.png', type: 'animated' },
        { id: 'lov_36', name: 'Groom', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f935-200d-2642-fe0f.png', type: 'animated' },
        { id: 'lov_37', name: 'Couple Kiss', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f48f.png', type: 'animated' },
        { id: 'lov_38', name: 'Couple Heart', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f491.png', type: 'animated' },
        { id: 'lov_39', name: 'Family', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f46a.png', type: 'animated' },

        // Special Symbols - Ký hiệu đặc biệt
        { id: 'lov_40', name: 'Infinity', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/267e.png', type: 'animated' },
        { id: 'lov_41', name: 'Heart Exclamation', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2763.png', type: 'animated' },
        { id: 'lov_42', name: 'Heart Decoration', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f49f.png', type: 'animated' },

        // Romantic Foods & Drinks - Đồ ăn thức uống lãng mạn
        { id: 'lov_43', name: 'Chocolate', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36b.png', type: 'animated' },
        { id: 'lov_44', name: 'Candy', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36c.png', type: 'animated' },
        { id: 'lov_45', name: 'Lollipop', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36d.png', type: 'animated' },
        { id: 'lov_46', name: 'Wine Glass', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f377.png', type: 'animated' },
        { id: 'lov_47', name: 'Champagne', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f37e.png', type: 'animated' },
        { id: 'lov_48', name: 'Clinking Glasses', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f942.png', type: 'animated' },

        // Cute Animals in Love - Động vật đáng yêu
        { id: 'lov_49', name: 'Cat with Hearts', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f63b.png', type: 'animated' },
        { id: 'lov_50', name: 'Kissing Cat', url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f63d.png', type: 'animated' }
    ],

    // Danh mục Lễ hội chuyển động
    party: [
        { id: 'par_1', name: 'Birthday Cake', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Birthday%20Cake.png', type: 'animated' },
        { id: 'par_2', name: 'Party Popper', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Party%20Popper.png', type: 'animated' },
        { id: 'par_3', name: 'Confetti Ball', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Confetti%20Ball.png', type: 'animated' },
        { id: 'par_4', name: 'Fireworks', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fireworks.png', type: 'animated' },
        { id: 'par_5', name: 'Balloon', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Balloon.png', type: 'animated' },
        { id: 'par_6', name: 'Gift', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Wrapped%20Gift.png', type: 'animated' }
    ],

    // Danh mục Ma thuật chuyển động
    magic: [
        { id: 'mag_1', name: 'Sparkles', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Sparkles.png', type: 'animated' },
        { id: 'mag_2', name: 'Magic Wand', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Magic%20Wand.png', type: 'animated' },
        { id: 'mag_3', name: 'Crystal Ball', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Crystal%20Ball.png', type: 'animated' },
        { id: 'mag_4', name: 'Star', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Star.png', type: 'animated' },
        { id: 'mag_5', name: 'Shooting Star', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Shooting%20Star.png', type: 'animated' },
        { id: 'mag_6', name: 'Rainbow', url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rainbow.png', type: 'animated' }
    ]
};

// Khởi tạo sticker picker
function initializeStickerPicker() {
    console.log('🎪 Initializing animated sticker picker...');

    // Load recent stickers
    stickerData.recent = JSON.parse(localStorage.getItem('recentStickers') || '[]');

    // Tạo sticker picker popup
    if (!document.getElementById('stickerPickerPopup')) {
        createStickerPickerHTML();
    }

    // Setup event listeners
    setupStickerPickerEvents();
}

// Tạo HTML cho sticker picker
function createStickerPickerHTML() {
    const stickerPickerHTML = `
        <div id="stickerPickerPopup" class="sticker-picker-popup" style="
            position: absolute;
            bottom: 60px;
            right: 0;
            width: 380px;
            height: 450px;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            display: none;
            z-index: 1000;
            overflow: hidden;
        ">
            <div class="sticker-picker-header" style="
                display: flex;
                border-bottom: 1px solid #dee2e6;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                overflow-x: auto;
                scrollbar-width: none;
            ">
                <button class="sticker-tab active" data-category="recent" title="Gần đây" style="
                    flex: 0 0 auto; padding: 12px 8px; text-align: center; cursor: pointer; border: none; background: white; color: #0d6efd; font-size: 16px; min-width: 50px;
                ">⏰</button>
                <button class="sticker-tab" data-category="emotions" title="Cảm xúc" style="
                    flex: 0 0 auto; padding: 12px 8px; text-align: center; cursor: pointer; border: none; background: none; color: #6c757d; font-size: 16px; min-width: 50px;
                ">😊</button>
                <button class="sticker-tab" data-category="animals" title="Động vật" style="
                    flex: 0 0 auto; padding: 12px 8px; text-align: center; cursor: pointer; border: none; background: none; color: #6c757d; font-size: 16px; min-width: 50px;
                ">🐱</button>
                <button class="sticker-tab" data-category="actions" title="Hành động" style="
                    flex: 0 0 auto; padding: 12px 8px; text-align: center; cursor: pointer; border: none; background: none; color: #6c757d; font-size: 16px; min-width: 50px;
                ">🤸</button>
                <button class="sticker-tab" data-category="love" title="Yêu thương" style="
                    flex: 0 0 auto; padding: 12px 8px; text-align: center; cursor: pointer; border: none; background: none; color: #6c757d; font-size: 16px; min-width: 50px;
                ">❤️</button>
                <button class="sticker-tab" data-category="party" title="Lễ hội" style="
                    flex: 0 0 auto; padding: 12px 8px; text-align: center; cursor: pointer; border: none; background: none; color: #6c757d; font-size: 16px; min-width: 50px;
                ">🎉</button>
                <button class="sticker-tab" data-category="magic" title="Ma thuật" style="
                    flex: 0 0 auto; padding: 12px 8px; text-align: center; cursor: pointer; border: none; background: none; color: #6c757d; font-size: 16px; min-width: 50px;
                ">✨</button>
            </div>
            <div class="sticker-picker-content" id="stickerPickerContent" style="
                height: calc(100% - 50px);
                overflow-y: auto;
                padding: 15px;
            ">
                ${generateStickerContent('recent')}
            </div>
        </div>
    `;

    // Thêm vào input group
    const inputGroup = document.querySelector('.input-group');
    if (inputGroup) {
        inputGroup.style.position = 'relative';
        inputGroup.insertAdjacentHTML('beforeend', stickerPickerHTML);
        console.log('✅ Animated sticker picker HTML added');
    }
}

// Tạo nội dung sticker
function generateStickerContent(category) {
    console.log('🎪 Generating content for category:', category);
    let content = '';

    if (category === 'recent') {
        if (stickerData.recent.length > 0) {
            content += `
                <div class="sticker-category sticker-recent">
                    <div class="sticker-category-title" style="font-size: 14px; font-weight: 600; color: #495057; margin-bottom: 12px;">Gần đây (${stickerData.recent.length})</div>
                    <div class="sticker-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        ${stickerData.recent.slice(0, 16).map(sticker => createStickerHTML(sticker)).join('')}
                    </div>
                </div>
            `;
        } else {
            content += `
                <div class="sticker-category">
                    <div class="sticker-category-title" style="font-size: 14px; font-weight: 600; color: #495057; margin-bottom: 12px;">Chưa có sticker gần đây</div>
                    <div class="empty-state" style="text-align: center; padding: 30px; color: #6c757d;">
                        <div class="empty-icon" style="font-size: 64px; margin-bottom: 10px;">🎪</div>
                        <p style="margin: 0; font-size: 14px;">Sticker bạn sử dụng sẽ hiển thị ở đây</p>
                    </div>
                </div>
            `;
        }

        // Thêm sticker phổ biến từ tất cả danh mục
        const popularStickers = [
            ...stickerData.emotions.slice(0, 2),
            ...stickerData.animals.slice(0, 2),
            ...stickerData.actions.slice(0, 2),
            ...stickerData.love.slice(0, 2),
            ...stickerData.party.slice(0, 2),
            ...stickerData.magic.slice(0, 2)
        ];

        content += `
            <div class="sticker-category">
                <div class="sticker-category-title" style="font-size: 14px; font-weight: 600; color: #495057; margin-bottom: 12px;">Phổ biến (${popularStickers.length})</div>
                <div class="sticker-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                    ${popularStickers.map(sticker => createStickerHTML(sticker)).join('')}
                </div>
            </div>
        `;
    } else {
        const stickers = stickerData[category] || [];
        const categoryTitle = getCategoryTitle(category);

        content = `
            <div class="sticker-category">
                <div class="sticker-category-title" style="font-size: 14px; font-weight: 600; color: #495057; margin-bottom: 12px;">${categoryTitle} (${stickers.length})</div>
                <div class="sticker-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                    ${stickers.map(sticker => createStickerHTML(sticker)).join('')}
                </div>
            </div>
        `;
    }

    return content;
}

// Tạo HTML cho một sticker với hiệu ứng hover
function createStickerHTML(sticker) {
    if (!sticker || !sticker.url) {
        return '';
    }

    return `
        <button class="sticker-item" 
                data-sticker-id="${sticker.id}" 
                data-sticker-url="${sticker.url}" 
                title="${sticker.name}"
                style="
                    width: 80px; 
                    height: 80px; 
                    padding: 6px; 
                    border: 2px solid transparent; 
                    background: #f8f9fa; 
                    border-radius: 12px; 
                    cursor: pointer; 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                "
                onmouseover="
                    this.style.background='linear-gradient(135deg, #e3f2fd, #f3e5f5)'; 
                    this.style.borderColor='#0d6efd'; 
                    this.style.transform='scale(1.08) rotate(2deg)';
                    this.style.boxShadow='0 8px 25px rgba(13, 110, 253, 0.3)';
                    this.style.zIndex='10';
                    this.querySelector('img').style.transform='scale(1.1)';
                "
                onmouseout="
                    this.style.background='#f8f9fa'; 
                    this.style.borderColor='transparent'; 
                    this.style.transform='scale(1) rotate(0deg)';
                    this.style.boxShadow='none';
                    this.style.zIndex='auto';
                    this.querySelector('img').style.transform='scale(1)';
                ">
            <img src="${sticker.url}" 
                 alt="${sticker.name}" 
                 loading="lazy"
                 style="
                    width: 100%; 
                    height: 100%; 
                    object-fit: contain; 
                    border-radius: 8px;
                    transition: transform 0.3s;
                 "
                 onerror="console.error('Failed to load animated sticker:', '${sticker.url}');">
        </button>
    `;
}

// Lấy tên danh mục
function getCategoryTitle(category) {
    const titles = {
        emotions: 'Cảm xúc',
        animals: 'Động vật',
        actions: 'Hành động',
        love: 'Yêu thương',
        party: 'Lễ hội',
        magic: 'Ma thuật'
    };
    return titles[category] || category;
}

// Setup event listeners
function setupStickerPickerEvents() {
    // Toggle sticker picker
    const stickerBtn = document.getElementById('stickerPickerBtn');
    const stickerPopup = document.getElementById('stickerPickerPopup');

    if (stickerBtn && stickerPopup) {
        stickerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleStickerPicker();
        });
    }

    // Tab switching
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('sticker-tab')) {
            const category = e.target.getAttribute('data-category');
            switchStickerCategory(category);
        }
    });

    // Sticker selection
    document.addEventListener('click', (e) => {
        if (e.target.closest('.sticker-item')) {
            const stickerItem = e.target.closest('.sticker-item');
            const stickerId = stickerItem.getAttribute('data-sticker-id');
            const stickerUrl = stickerItem.getAttribute('data-sticker-url');
            selectSticker(stickerId, stickerUrl);
        }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
        const stickerPopup = document.getElementById('stickerPickerPopup');
        const stickerBtn = document.getElementById('stickerPickerBtn');

        if (stickerPopup && stickerBtn &&
            !stickerPopup.contains(e.target) &&
            !stickerBtn.contains(e.target)) {
            stickerPopup.style.display = 'none';
        }
    });
}

// Toggle sticker picker
function toggleStickerPicker() {
    const stickerPopup = document.getElementById('stickerPickerPopup');
    if (stickerPopup) {
        const isVisible = stickerPopup.style.display === 'block';
        stickerPopup.style.display = isVisible ? 'none' : 'block';
        console.log('🎪 Animated sticker picker toggled:', !isVisible);
    }
}

// Switch category với animation
function switchStickerCategory(category) {
    console.log('🎪 Switching to category:', category);

    // Update active tab với animation
    document.querySelectorAll('.sticker-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = 'none';
        tab.style.color = '#6c757d';
        tab.style.transform = 'translateY(0)';
    });

    const activeTab = document.querySelector(`[data-category="${category}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.style.background = 'white';
        activeTab.style.color = '#0d6efd';
        activeTab.style.transform = 'translateY(-1px)';
        activeTab.style.boxShadow = '0 -2px 0 #0d6efd inset';
    }

    // Update content với loading animation
    const content = document.getElementById('stickerPickerContent');
    if (content) {
        // Show loading
        content.innerHTML = `
            <div class="sticker-loading" style="text-align: center; padding: 60px 20px; color: #6c757d;">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem; margin-bottom: 16px;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p style="margin: 0; font-size: 14px; font-weight: 500;">Đang tải sticker chuyển động...</p>
            </div>
        `;

        // Load content sau 300ms
        setTimeout(() => {
            content.innerHTML = generateStickerContent(category);
        }, 300);
    }
}

// Select sticker với haptic feedback
function selectSticker(stickerId, stickerUrl) {
    console.log('🎪 Selected animated sticker:', stickerId, stickerUrl);

    // Haptic feedback nếu có
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }

    // Find sticker object
    const sticker = findStickerById(stickerId);
    if (sticker) {
        // Add to recent
        addToRecentStickers(sticker);

        // Send sticker
        sendStickerMessage(stickerUrl);

        // Visual feedback
        const stickerItem = document.querySelector(`[data-sticker-id="${stickerId}"]`);
        if (stickerItem) {
            stickerItem.style.transform = 'scale(0.9)';
            setTimeout(() => {
                stickerItem.style.transform = 'scale(1)';
            }, 100);
        }
    }

    // Close picker
    const stickerPopup = document.getElementById('stickerPickerPopup');
    if (stickerPopup) {
        stickerPopup.style.display = 'none';
    }
}

// Find sticker by ID từ tất cả danh mục
function findStickerById(stickerId) {
    for (const category in stickerData) {
        if (Array.isArray(stickerData[category])) {
            const sticker = stickerData[category].find(s => s.id === stickerId);
            if (sticker) return sticker;
        }
    }
    return null;
}

// Add to recent stickers với limit
function addToRecentStickers(sticker) {
    // Remove if already exists
    stickerData.recent = stickerData.recent.filter(s => s.id !== sticker.id);

    // Add to beginning
    stickerData.recent.unshift(sticker);

    // Keep only 16 most recent
    stickerData.recent = stickerData.recent.slice(0, 16);

    // Save to localStorage
    localStorage.setItem('recentStickers', JSON.stringify(stickerData.recent));
}

// Send sticker message
async function sendStickerMessage(stickerUrl) {
    if (!selectedUserId) {
        alert('Vui lòng chọn người để gửi sticker!');
        return;
    }

    if (!isSignalRInitialized || !connection || connection.state !== 'Connected') {
        alert('Kết nối SignalR không sẵn sàng. Vui lòng thử lại.');
        return;
    }

    try {
        await connection.invoke("SendMessage", selectedUserId, stickerUrl, "sticker");
        console.log('✅ Animated sticker sent successfully');
    } catch (err) {
        console.error('❌ Send sticker error:', err);
        alert('Không thể gửi sticker. Vui lòng thử lại.');
    }
}

// Add sticker button
function addStickerButton() {
    console.log('🎪 Adding animated sticker button...');

    // Kiểm tra nếu button đã tồn tại
    if (document.getElementById('stickerPickerBtn')) {
        console.log('✅ Sticker button already exists');
        return;
    }

    // Tìm emoji button hoặc send button
    let targetElement = document.getElementById('emojiPickerBtn');
    if (!targetElement) {
        targetElement = document.getElementById('sendButton');
    }

    if (!targetElement) {
        console.error('❌ Cannot find target element for sticker button');
        return;
    }

    // Tạo sticker button với animation
    const stickerButton = document.createElement('button');
    stickerButton.id = 'stickerPickerBtn';
    stickerButton.type = 'button';
    stickerButton.className = 'btn sticker-picker-btn';
    stickerButton.innerHTML = '🎪';
    stickerButton.title = 'Chọn sticker chuyển động';
    stickerButton.style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        padding: 8px;
        cursor: pointer;
        border-radius: 50%;
        transition: all 0.3s;
        color: #6c757d;
        margin-right: 5px;
        position: relative;
    `;

    // Thêm hover effect
    stickerButton.addEventListener('mouseenter', () => {
        stickerButton.style.background = '#f8f9fa';
        stickerButton.style.color = '#495057';
        stickerButton.style.transform = 'scale(1.1)';
    });

    stickerButton.addEventListener('mouseleave', () => {
        stickerButton.style.background = 'none';
        stickerButton.style.color = '#6c757d';
        stickerButton.style.transform = 'scale(1)';
    });

    // Chèn button
    targetElement.parentNode.insertBefore(stickerButton, targetElement);

    console.log('✅ Animated sticker button added successfully');
}

// Get sticker statistics
function getStickerStats() {
    const totalStickers = Object.values(stickerData)
        .filter(Array.isArray)
        .reduce((total, category) => total + category.length, 0);

    console.log(`📊 Animated Sticker Stats:
        - Total: ${totalStickers} animated stickers
        - Categories: ${Object.keys(stickerData).filter(k => Array.isArray(stickerData[k])).length}
        - Recent: ${stickerData.recent.length}
    `);
}

// Auto initialize
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        addStickerButton();
        initializeStickerPicker();
        getStickerStats();
        console.log('🎪 Animated sticker picker system ready!');
    }, 600);
});

// Export cho debug
window.stickerData = stickerData;
window.getStickerStats = getStickerStats;