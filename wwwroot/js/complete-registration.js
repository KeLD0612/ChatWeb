// === GLOBAL VARIABLES ===
let currentStep = 1;
let totalSteps = 13;
let selectedGender = '';
let selectedFashionStyle = '';
let selectedRelationshipGoal = '';
let selectedInterests = [];
let selectedPersonalityTraits = [];
let userData = {};

// === INITIALIZE ===

// Initialize khi trang load
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Complete Registration initialized');

    // ✅ UPDATED - Xử lý external login với serverData
    const serverData = window.serverData || {};
    const isExternalLogin = serverData.isExternalLogin || false;

    if (isExternalLogin) {
        console.log('External login detected:', serverData);

        // Prefill data cho external login
        const emailInput = document.getElementById('email');
        const fullNameInput = document.getElementById('fullName');

        if (emailInput) emailInput.value = serverData.prefilledEmail || '';
        if (fullNameInput) fullNameInput.value = serverData.prefilledName || '';

        // Set flag trong userData
        userData.isExternalLogin = true;
        userData.externalProvider = serverData.externalProvider || '';
        userData.email = serverData.prefilledEmail || '';
        userData.fullName = serverData.prefilledName || '';
        userData.password = null; // External login không cần password

        console.log('External login userData:', userData);
    } else {
        console.log('Regular registration detected');
        userData.isExternalLogin = false;
    }

    // Initialize các components
    initializeDateSelectors();
    initializeProvinceSelector();
    initializeInterestsGrid();
    initializeFashionOptions();
    initializePersonalityGrid();
    initializeRelationshipOptions();
    setupEmailValidation();
    setupBioCharCount();

    updateStepHeader();
    updateProgressBar();
});

// === STEP NAVIGATION ===

function nextStep() {
    console.log(`Moving to next step from ${currentStep}`);

    // Clear previous error messages
    clearErrorMessages();

    // Validate current step
    if (!validateCurrentStep()) {
        return;
    }

    // Save current step data
    saveCurrentStepData();

    // Move to next step
    if (currentStep < totalSteps) {
        document.getElementById(`step${currentStep}`).classList.remove('active');
        currentStep++;
        document.getElementById(`step${currentStep}`).classList.add('active');

        updateStepHeader();
        updateProgressBar();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function previousStep() {
    if (currentStep > 1) {
        document.getElementById(`step${currentStep}`).classList.remove('active');
        currentStep--;
        document.getElementById(`step${currentStep}`).classList.add('active');

        updateStepHeader();
        updateProgressBar();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateStepHeader() {
    const stepNumber = document.getElementById('stepNumber');
    const stepTitle = document.getElementById('stepTitle');
    const stepSubtitle = document.getElementById('stepSubtitle');

    const stepData = {
        1: { title: 'Chào mừng đến với Dating App!', subtitle: 'Tìm kiếm tình yêu đích thực chỉ trong vài bước' },
        2: { title: 'Thông tin cơ bản', subtitle: 'Hãy cho chúng tôi biết về bạn' },
        3: { title: 'Giới tính', subtitle: 'Để tìm được người phù hợp' },
        4: { title: 'Ngày sinh', subtitle: 'Tuổi là một yếu tố quan trọng' },
        5: { title: 'Vị trí', subtitle: 'Tìm kiếm những người gần bạn' },
        6: { title: 'Sở thích', subtitle: 'Những gì bạn yêu thích' },
        7: { title: 'Phong cách', subtitle: 'Cách bạn thể hiện bản thân' },
        8: { title: 'Tính cách', subtitle: 'Những đặc điểm nổi bật của bạn' },
        9: { title: 'Mục tiêu', subtitle: 'Bạn đang tìm kiếm điều gì?' },
        10: { title: 'Người lý tưởng', subtitle: 'Mô tả về nửa kia của bạn' },
        11: { title: 'Giới thiệu', subtitle: 'Kể về bản thân bạn' },
        12: { title: 'Ảnh của bạn', subtitle: 'Hãy để mọi người thấy vẻ đẹp của bạn' },
        13: { title: 'Hoàn thành!', subtitle: 'Bạn đã sẵn sàng bắt đầu hành trình tìm kiếm tình yêu' }
    };

    if (stepNumber) stepNumber.textContent = currentStep;
    if (stepTitle) stepTitle.textContent = stepData[currentStep]?.title || 'Đăng ký';
    if (stepSubtitle) stepSubtitle.textContent = stepData[currentStep]?.subtitle || '';
}

function updateProgressBar() {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
}

// === VALIDATION ===

function validateCurrentStep() {
    let isValid = true;

    switch (currentStep) {
        case 2:
            isValid = validateBasicInfo();
            break;
        case 3:
            isValid = validateGender();
            break;
        case 4:
            isValid = validateBirthday();
            break;
        case 5:
            isValid = validateLocation();
            break;
        case 12:
            isValid = validatePhotos();
            break;
        default:
            isValid = true;
    }

    return isValid;
}

// ✅ UPDATED - Validation cho basic info
function validateBasicInfo() {
    let isValid = true;

    // Luôn validate nickname/fullName
    const name = document.getElementById('fullName').value.trim();
    if (!name) {
        showFieldError('fullNameError', 'Vui lòng nhập tên hiển thị!');
        document.getElementById('fullName').classList.add('error');
        isValid = false;
    }

    // ✅ UPDATED - Chỉ validate email và password nếu KHÔNG phải external login
    if (!userData.isExternalLogin) {
        const email = document.getElementById('email');
        const password = document.getElementById('password');

        if (email) {
            const emailValue = email.value.trim();
            if (!emailValue || !isValidEmail(emailValue)) {
                showFieldError('emailError', 'Vui lòng nhập email hợp lệ!');
                email.classList.add('error');
                isValid = false;
            } else if (document.getElementById('emailCheck') && document.getElementById('emailCheck').classList.contains('unavailable')) {
                showFieldError('emailError', 'Email này đã được sử dụng!');
                email.classList.add('error');
                isValid = false;
            }
        }

        if (password) {
            const passwordValue = password.value;
            if (passwordValue.length < 6) {
                showFieldError('passwordError', 'Mật khẩu phải có ít nhất 6 ký tự!');
                password.classList.add('error');
                isValid = false;
            }
        }
    }

    return isValid;
}

function validateGender() {
    if (!selectedGender) {
        showFieldError('genderError', 'Vui lòng chọn giới tính!');
        return false;
    }
    return true;
}

function validateBirthday() {
    const day = document.getElementById('birthDay').value;
    const month = document.getElementById('birthMonth').value;
    const year = document.getElementById('birthYear').value;

    if (!day || !month || !year) {
        showFieldError('birthdayError', 'Vui lòng chọn đầy đủ ngày sinh!');
        return false;
    }

    const birthday = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birthday.getFullYear();

    if (age < 18) {
        showFieldError('birthdayError', 'Bạn phải ít nhất 18 tuổi!');
        return false;
    }

    return true;
}

function validateLocation() {
    const province = document.getElementById('province').value;
    const district = document.getElementById('district').value;

    if (!province || !district) {
        showFieldError('locationError', 'Vui lòng chọn đầy đủ địa điểm!');
        return false;
    }
    return true;
}

function validatePhotos() {
    const profilePicture = document.getElementById('profilePicture');
    if (!profilePicture.files || profilePicture.files.length === 0) {
        showToast('Vui lòng chọn ít nhất một ảnh đại diện!', 'error');
        return false;
    }
    return true;
}

// === DATA HANDLING ===

// ✅ UPDATED - Save current step data
function saveCurrentStepData() {
    switch (currentStep) {
        case 2:
            // ✅ UPDATED - Luôn lưu fullName
            const fullName = document.getElementById('fullName');
            if (fullName) {
                userData.fullName = fullName.value.trim();
            }

            // ✅ UPDATED - Chỉ lưu email và password nếu không phải external login
            if (!userData.isExternalLogin) {
                const email = document.getElementById('email');
                const password = document.getElementById('password');

                if (email) userData.email = email.value.trim();
                if (password) userData.password = password.value;
            }
            // Với external login, email đã được prefill và password = null
            break;
        case 3:
            userData.gender = selectedGender;
            break;
        case 4:
            const day = document.getElementById('birthDay').value;
            const month = document.getElementById('birthMonth').value;
            const year = document.getElementById('birthYear').value;
            userData.birthDay = parseInt(day);
            userData.birthMonth = parseInt(month);
            userData.birthYear = parseInt(year);
            break;
        case 5:
            userData.province = document.getElementById('province').value;
            userData.district = document.getElementById('district').value;
            break;
        case 6:
            userData.interests = selectedInterests.slice();
            userData.customInterest = document.getElementById('customInterest').value;
            break;
        case 7:
            userData.fashionStyle = selectedFashionStyle;
            userData.customFashionStyle = document.getElementById('customFashionStyle').value;
            break;
        case 8:
            userData.personalityTraits = selectedPersonalityTraits.slice();
            userData.customPersonality = document.getElementById('customPersonality').value;
            break;
        case 9:
            userData.relationshipGoal = selectedRelationshipGoal;
            userData.customRelationshipGoal = document.getElementById('customRelationshipGoal').value;
            break;
        case 10:
            userData.idealPartner = document.getElementById('idealPartner').value;
            break;
        case 11:
            userData.bio = document.getElementById('bio').value;
            break;
    }

    console.log('Current userData:', userData);
}

// === EMAIL VALIDATION ===

// ✅ UPDATED - Email checking function (skip for external login)
async function checkEmailAvailability() {
    // Skip email check for external login
    if (userData.isExternalLogin) {
        return;
    }

    const email = document.getElementById('email').value.trim();

    if (!email || !isValidEmail(email)) {
        clearEmailCheck();
        return;
    }

    try {
        const response = await fetch('/api/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });

        const result = await response.json();
        const emailCheck = document.getElementById('emailCheck');

        if (result.available) {
            emailCheck.innerHTML = '<i class="fas fa-check"></i> Email khả dụng';
            emailCheck.className = 'email-check available';
            document.getElementById('email').classList.remove('error');
            document.getElementById('email').classList.add('success');
        } else {
            emailCheck.innerHTML = '<i class="fas fa-times"></i> Email đã được sử dụng';
            emailCheck.className = 'email-check unavailable';
            document.getElementById('email').classList.remove('success');
            document.getElementById('email').classList.add('error');
        }
    } catch (error) {
        console.error('Error checking email:', error);
        clearEmailCheck();
    }
}

function clearEmailCheck() {
    const emailCheck = document.getElementById('emailCheck');
    if (emailCheck) {
        emailCheck.innerHTML = '';
        emailCheck.className = 'email-check';
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.classList.remove('error', 'success');
        }
    }
}

function setupEmailValidation() {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function () {
            const email = this.value.trim();
            if (email.length > 0) {
                clearTimeout(this.emailTimeout);
                this.emailTimeout = setTimeout(() => {
                    checkEmailAvailability();
                }, 500);
            } else {
                clearEmailCheck();
            }
        });
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// === GENDER SELECTION ===

function selectGender(gender, element) {
    selectedGender = gender;
    document.getElementById('gender').value = gender;

    // Remove selected class from all options
    document.querySelectorAll('.gender-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Add selected class to clicked option
    element.classList.add('selected');

    // Enable next button
    document.getElementById('genderNext').disabled = false;
}

// === DATE SELECTORS ===

function initializeDateSelectors() {
    const daySelect = document.getElementById('birthDay');
    const monthSelect = document.getElementById('birthMonth');
    const yearSelect = document.getElementById('birthYear');

    // Populate days
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }

    // Populate months
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    // Populate years (18-80 years old)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 18; i >= currentYear - 80; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
}

// === PROVINCE & DISTRICT ===

function initializeProvinceSelector() {
    const provinceSelect = document.getElementById('province');
    const provinces = [
        'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
        'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
        // ... add more provinces
    ];

    provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        provinceSelect.appendChild(option);
    });
}

function loadDistricts() {
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');
    const selectedProvince = provinceSelect.value;

    // Clear existing districts
    districtSelect.innerHTML = '<option value="">Chọn quận huyện</option>';

    if (!selectedProvince) {
        districtSelect.disabled = true;
        return;
    }

    districtSelect.disabled = false;

    // Sample districts data - you should replace with your actual data
    const districtsData = {
        'Hà Nội': ['Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy'],
        'TP. Hồ Chí Minh': ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5'],
        'Đà Nẵng': ['Liên Chiểu', 'Thanh Khê', 'Hải Châu', 'Sơn Trà']
    };

    const districts = districtsData[selectedProvince] || ['Trung tâm', 'Ngoại thành'];

    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
    });
}

// === INTERESTS ===

function initializeInterestsGrid() {
    const interestsGrid = document.getElementById('interestsGrid');
    const interests = [
        'Du lịch', 'Ẩm thực', 'Âm nhạc', 'Phim ảnh', 'Đọc sách', 'Thể thao',
        'Yoga', 'Gym', 'Chạy bộ', 'Bơi lội', 'Leo núi', 'Chụp ảnh',
        'Vẽ', 'Nấu ăn', 'Làm bánh', 'Game', 'Công nghệ', 'Lập trình'
    ];

    interests.forEach(interest => {
        const tag = document.createElement('div');
        tag.className = 'interest-tag';
        tag.textContent = interest;
        tag.onclick = () => toggleInterest(interest, tag);
        interestsGrid.appendChild(tag);
    });
}

function toggleInterest(interest, element) {
    if (selectedInterests.includes(interest)) {
        selectedInterests = selectedInterests.filter(i => i !== interest);
        element.classList.remove('selected');
    } else {
        if (selectedInterests.length < 8) {
            selectedInterests.push(interest);
            element.classList.add('selected');
        } else {
            showToast('Bạn chỉ có thể chọn tối đa 8 sở thích!', 'warning');
        }
    }
}

function addCustomInterest() {
    const customInput = document.getElementById('customInterest');
    const customInterest = customInput.value.trim();

    if (!customInterest) return;

    if (selectedInterests.length >= 8) {
        showToast('Bạn chỉ có thể chọn tối đa 8 sở thích!', 'warning');
        return;
    }

    if (!selectedInterests.includes(customInterest)) {
        selectedInterests.push(customInterest);

        // Add to grid
        const interestsGrid = document.getElementById('interestsGrid');
        const tag = document.createElement('div');
        tag.className = 'interest-tag selected custom';
        tag.textContent = customInterest;
        tag.onclick = () => toggleInterest(customInterest, tag);
        interestsGrid.appendChild(tag);

        customInput.value = '';
    }
}

// === FASHION STYLES ===

function initializeFashionOptions() {
    const fashionOptions = document.getElementById('fashionOptions');
    const styles = [
        'Casual - Thoải mái', 'Formal - Lịch sự', 'Sporty - Thể thao',
        'Vintage - Cổ điển', 'Bohemian - Tự do', 'Minimalist - Tối giản'
    ];

    styles.forEach(style => {
        const option = document.createElement('div');
        option.className = 'fashion-option';
        option.textContent = style;
        option.onclick = () => selectFashionStyle(style, option);
        fashionOptions.appendChild(option);
    });
}

function selectFashionStyle(style, element) {
    selectedFashionStyle = style;
    document.getElementById('fashionStyle').value = style;

    document.querySelectorAll('.fashion-option').forEach(option => {
        option.classList.remove('selected');
    });

    element.classList.add('selected');
}

// === PERSONALITY TRAITS ===

function initializePersonalityGrid() {
    const personalityGrid = document.getElementById('personalityGrid');
    const traits = [
        'Hòa đồng', 'Hài hước', 'Lãng mạn', 'Thông minh', 'Chăm chỉ',
        'Tự tin', 'Kiên nhẫn', 'Tử tế', 'Sáng tạo', 'Trung thực'
    ];

    traits.forEach(trait => {
        const tag = document.createElement('div');
        tag.className = 'personality-tag';
        tag.textContent = trait;
        tag.onclick = () => togglePersonalityTrait(trait, tag);
        personalityGrid.appendChild(tag);
    });
}

function togglePersonalityTrait(trait, element) {
    if (selectedPersonalityTraits.includes(trait)) {
        selectedPersonalityTraits = selectedPersonalityTraits.filter(t => t !== trait);
        element.classList.remove('selected');
    } else {
        if (selectedPersonalityTraits.length < 6) {
            selectedPersonalityTraits.push(trait);
            element.classList.add('selected');
        } else {
            showToast('Bạn chỉ có thể chọn tối đa 6 đặc điểm!', 'warning');
        }
    }
}

// === RELATIONSHIP GOALS ===

function initializeRelationshipOptions() {
    const relationshipOptions = document.getElementById('relationshipOptions');
    const goals = [
        'Tìm hiểu - Làm quen', 'Hẹn hò nghiêm túc', 'Kết hôn',
        'Tìm bạn đời', 'Tình yêu lâu dài', 'Chưa rõ - Tùy duyên'
    ];

    goals.forEach(goal => {
        const option = document.createElement('div');
        option.className = 'relationship-option';
        option.textContent = goal;
        option.onclick = () => selectRelationshipGoal(goal, option);
        relationshipOptions.appendChild(option);
    });
}

function selectRelationshipGoal(goal, element) {
    selectedRelationshipGoal = goal;
    document.getElementById('relationshipGoal').value = goal;

    document.querySelectorAll('.relationship-option').forEach(option => {
        option.classList.remove('selected');
    });

    element.classList.add('selected');
}

// === BIO CHARACTER COUNT ===

function setupBioCharCount() {
    const bioTextarea = document.getElementById('bio');
    const charCountSpan = document.getElementById('bioCharCount');

    if (bioTextarea && charCountSpan) {
        bioTextarea.addEventListener('input', function () {
            const currentLength = this.value.length;
            charCountSpan.textContent = currentLength;

            if (currentLength > 500) {
                charCountSpan.style.color = '#e53e3e';
            } else {
                charCountSpan.style.color = '#666';
            }
        });
    }
}

// === PHOTO UPLOAD ===

function previewProfilePhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('profilePreview');
            const icon = document.getElementById('profileIcon');

            preview.src = e.target.result;
            preview.style.display = 'block';
            icon.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function addAdditionalPhoto(index) {
    document.getElementById(`additionalPhoto${index}`).click();
}

function previewAdditionalPhoto(index, input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const slot = document.querySelector(`#additionalPhotosGrid .photo-upload-slot:nth-child(${index + 1})`);
            slot.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// === COMPLETION ===

async function completeRegistration() {
    const button = document.getElementById('completeBtn');
    const originalText = button.innerHTML;

    try {
        saveCurrentStepData();

        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        button.disabled = true;

        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        const formData = new FormData();

        // Add all user data
        Object.keys(userData).forEach(key => {
            if (key === 'interests' || key === 'personalityTraits') {
                userData[key].forEach(item => formData.append(`${key}`, item));
            } else {
                formData.append(key, userData[key] || '');
            }
        });

        // Add photos
        const profilePicture = document.getElementById('profilePicture');
        if (profilePicture && profilePicture.files[0]) {
            formData.append('ProfilePicture', profilePicture.files[0]);
        }

        for (let i = 0; i < 4; i++) {
            const additionalPhoto = document.getElementById(`additionalPhoto${i}`);
            if (additionalPhoto && additionalPhoto.files[0]) {
                formData.append('AdditionalPhotos', additionalPhoto.files[0]);
            }
        }

        // Add current step data
        const idealPartner = document.getElementById('idealPartner');
        const bio = document.getElementById('bio');

        if (idealPartner) formData.append('idealPartner', idealPartner.value);
        if (bio) formData.append('bio', bio.value);

        // Add anti-forgery token
        const token = document.querySelector('input[name="__RequestVerificationToken"]');
        if (token) formData.append('__RequestVerificationToken', token.value);

        const response = await fetch('/CompleteRegistration/CompleteRegistration', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Server error response:', text);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Server response:', result);

        if (result.debug && Array.isArray(result.debug)) {
            console.group('Server Debug Messages');
            result.debug.forEach((msg, index) => console.log(`[${index + 1}] ${msg}`));
            console.groupEnd();
        }

        if (result.success) {
            showToast('Đăng ký thành công! Đang chuyển hướng...', 'success');
            setTimeout(() => {
                window.location.href = result.redirectUrl || '/Explore';
            }, 1500);
        } else {
            showToast(result.message || 'Có lỗi xảy ra khi đăng ký', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!', 'error');
    } finally {
        // Reset button
        button.innerHTML = originalText;
        button.disabled = false;

        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

// === UTILITY FUNCTIONS ===

function showFieldError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.validation-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });

    const inputElements = document.querySelectorAll('.form-control, .form-select');
    inputElements.forEach(element => {
        element.classList.remove('error', 'success');
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }, 4000);
}

// === CSS INJECTION ===

// Inject CSS for toast notifications and animations
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        min-width: 300px;
        max-width: 500px;
    }
    
    .toast.success { border-left: 4px solid #48bb78; }
    .toast.error { border-left: 4px solid #e53e3e; }
    .toast.warning { border-left: 4px solid #ed8936; }
    .toast.info { border-left: 4px solid #4299e1; }
    
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
    
    .toast-content { 
        display: flex; 
        align-items: center; 
        gap: 10px; 
    }
    
    .toast-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
        opacity: 0.8;
    }
    
    .toast-close:hover {
        opacity: 1;
    }
    
    .gender-option.selected,
    .fashion-option.selected,
    .relationship-option.selected {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        transform: scale(1.05);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .interest-tag.selected,
    .personality-tag.selected {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .interest-tag.disabled,
    .personality-tag.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .validation-message.error {
        color: #e53e3e;
        font-size: 14px;
        margin-top: 5px;
    }
    
    .form-control.error {
        border-color: #e53e3e;
        box-shadow: 0 0 0 1px #e53e3e;
    }
    
    .form-control.success {
        border-color: #48bb78;
        box-shadow: 0 0 0 1px #48bb78;
    }
    
    .email-check.available {
        color: #48bb78;
        font-size: 14px;
        margin-top: 5px;
    }
    
    .email-check.unavailable {
        color: #e53e3e;
        font-size: 14px;
        margin-top: 5px;
    }
`;
document.head.appendChild(style);

console.log('✅ Complete Registration JavaScript loaded successfully');