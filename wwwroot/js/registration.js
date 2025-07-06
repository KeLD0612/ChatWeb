// ===================================
// LƯU VÀO: wwwroot/js/registration.js
// ===================================

let currentStep = 1;
const totalSteps = 7;
let selectedGender = '';
let userData = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeDateSelectors();
    setupEmailValidation();
});

// Initialize date selectors
function initializeDateSelectors() {
    const daySelect = document.getElementById('birthDay');
    const monthSelect = document.getElementById('birthMonth');
    const yearSelect = document.getElementById('birthYear');

    // Days
    for (let i = 1; i <= 31; i++) {
        daySelect.innerHTML += `<option value="${i}">${i}</option>`;
    }

    // Months
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    months.forEach((month, index) => {
        monthSelect.innerHTML += `<option value="${index + 1}">${month}</option>`;
    });

    // Years (18+ years old)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 18; i >= currentYear - 80; i--) {
        yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
}

// Setup email validation
function setupEmailValidation() {
    const emailInput = document.getElementById('email');
    let emailTimeout;

    emailInput.addEventListener('input', function () {
        clearTimeout(emailTimeout);
        const email = this.value.trim();

        if (email && isValidEmail(email)) {
            emailTimeout = setTimeout(() => {
                checkEmailAvailability(email);
            }, 500);
        } else {
            clearEmailCheck();
        }
    });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function checkEmailAvailability(email) {
    const emailCheck = document.getElementById('emailCheck');
    emailCheck.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang kiểm tra...';
    emailCheck.className = 'email-check checking';

    try {
        const response = await fetch('/Account/CheckEmailAvailability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });

        const result = await response.json();

        if (result.available) {
            emailCheck.innerHTML = '<i class="fas fa-check"></i> Email có thể sử dụng';
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
    emailCheck.innerHTML = '';
    emailCheck.className = 'email-check';
    document.getElementById('email').classList.remove('error', 'success');
}

// Step navigation
function nextStep() {
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
    }
}

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
    }

    return isValid;
}

function validateBasicInfo() {
    let isValid = true;

    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!name) {
        showFieldError('fullNameError', 'Vui lòng nhập tên của bạn!');
        document.getElementById('fullName').classList.add('error');
        isValid = false;
    }

    if (!email || !isValidEmail(email)) {
        showFieldError('emailError', 'Vui lòng nhập email hợp lệ!');
        document.getElementById('email').classList.add('error');
        isValid = false;
    } else if (document.getElementById('emailCheck').classList.contains('unavailable')) {
        showFieldError('emailError', 'Email này đã được sử dụng!');
        document.getElementById('email').classList.add('error');
        isValid = false;
    }

    if (password.length < 6) {
        showFieldError('passwordError', 'Mật khẩu phải có ít nhất 6 ký tự!');
        document.getElementById('password').classList.add('error');
        isValid = false;
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

    // Check age (must be 18+)
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 18 || (age === 18 && today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()))) {
        showFieldError('birthdayError', 'Bạn phải từ 18 tuổi trở lên!');
        return false;
    }

    return true;
}

function validateLocation() {
    const location = document.getElementById('location').value.trim();
    if (!location) {
        showFieldError('locationError', 'Vui lòng nhập nơi ở!');
        document.getElementById('location').classList.add('error');
        return false;
    }
    return true;
}

function showFieldError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.className = 'validation-message error';
}

function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.validation-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.className = 'validation-message';
    });

    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach(control => {
        control.classList.remove('error');
    });
}

function saveCurrentStepData() {
    switch (currentStep) {
        case 2:
            userData.fullName = document.getElementById('fullName').value;
            userData.email = document.getElementById('email').value;
            userData.password = document.getElementById('password').value;
            break;
        case 3:
            userData.gender = selectedGender;
            break;
        case 4:
            userData.birthDay = document.getElementById('birthDay').value;
            userData.birthMonth = document.getElementById('birthMonth').value;
            userData.birthYear = document.getElementById('birthYear').value;
            break;
        case 5:
            userData.location = document.getElementById('location').value;
            break;
        case 6:
            userData.avatar = document.getElementById('avatarInput').files[0];
            break;
    }
}

function updateStepHeader() {
    const stepNumber = document.getElementById('stepNumber');
    const stepTitle = document.getElementById('stepTitle');
    const stepSubtitle = document.getElementById('stepSubtitle');

    const stepData = {
        1: { title: 'Chào mừng đến với Dating App! ❤️', subtitle: 'Tìm kiếm tình yêu đích thực chỉ trong vài bước' },
        2: { title: 'Thông tin cơ bản 📝', subtitle: 'Hãy cho chúng tôi biết về bạn' },
        3: { title: 'Giới tính 👫', subtitle: 'Để chúng tôi tìm người phù hợp với bạn' },
        4: { title: 'Ngày sinh 🎂', subtitle: 'Chúng tôi cần biết tuổi của bạn' },
        5: { title: 'Nơi ở 📍', subtitle: 'Tìm kiếm những người gần bạn' },
        6: { title: 'Ảnh đại diện 📸', subtitle: 'Hãy để mọi người thấy vẻ đẹp của bạn' },
        7: { title: 'Hoàn thành! 🎉', subtitle: 'Chào mừng bạn đến với cộng đồng Dating App' }
    };

    stepNumber.textContent = currentStep;
    stepTitle.textContent = stepData[currentStep].title;
    stepSubtitle.textContent = stepData[currentStep].subtitle;
}

function updateProgressBar() {
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

function selectGender(gender, element) {
    // Remove previous selection
    document.querySelectorAll('.gender-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Add selection to clicked element
    element.classList.add('selected');
    selectedGender = gender;

    // Enable next button
    document.getElementById('genderNext').disabled = false;

    // Clear error
    document.getElementById('genderError').textContent = '';
}

function previewAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('avatarIcon').style.display = 'none';
            const preview = document.getElementById('avatarPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function completeRegistration() {
    try {
        // Show loading state
        const button = document.getElementById('completeBtn');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        button.disabled = true;

        // Create FormData for file upload
        const formData = new FormData();

        // Add all user data to FormData
        Object.keys(userData).forEach(key => {
            if (key === 'avatar' && userData[key]) {
                formData.append('avatarFile', userData[key]);
            } else {
                formData.append(key, userData[key]);
            }
        });

        // Send to server
        const response = await fetch('/Account/CompleteRegistration', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            // Show success message
            showToast('Đăng ký thành công! Đang chuyển hướng...', 'success');

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = '/Explore';
            }, 1500);
        } else {
            // Show error message
            showToast(result.message || 'Có lỗi xảy ra khi đăng ký', 'error');

            // Reset button
            button.innerHTML = originalText;
            button.disabled = false;
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!', 'error');

        // Reset button
        const button = document.getElementById('completeBtn');
        button.innerHTML = '<i class="fas fa-rocket"></i> Bắt đầu khám phá';
        button.disabled = false;
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Remove toast after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Keyboard navigation
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && currentStep < totalSteps) {
        e.preventDefault();
        nextStep();
    }
});