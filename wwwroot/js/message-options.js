document.addEventListener('DOMContentLoaded', function () {
    console.log('🔧 Initializing message options template...');
    initializeMessageOptionsTemplate();
});



// THÊM VÀO message-options.js

// Xử lý báo cáo tin nhắn
function reportMessage(messageId) {
    console.log('🚨 Reporting message:', messageId);

    // Tạo modal báo cáo
    const modal = createReportModal(messageId);
    document.body.appendChild(modal);

    // Hiển thị modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    // Xóa modal sau khi đóng
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

// Tạo modal báo cáo
function createReportModal(messageId) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'reportModal';
    modal.tabIndex = -1;

    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-flag text-danger"></i> Báo cáo tin nhắn
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="reportForm">
                        <div class="mb-3">
                            <label for="reportReason" class="form-label">Lý do báo cáo *</label>
                            <select id="reportReason" class="form-select" required>
                                <option value="">Chọn lý do báo cáo...</option>
                                <option value="Spam">Spam hoặc quảng cáo</option>
                                <option value="Harassment">Quấy rối hoặc bắt nạt</option>
                                <option value="Inappropriate Content">Nội dung không phù hợp</option>
                                <option value="Hate Speech">Ngôn từ thù địch</option>
                                <option value="Violence">Bạo lực hoặc đe dọa</option>
                                <option value="Sexual Content">Nội dung tình dục</option>
                                <option value="False Information">Thông tin sai lệch</option>
                                <option value="Copyright">Vi phạm bản quyền</option>
                                <option value="Scam">Lừa đảo</option>
                                <option value="Other">Khác</option>
                            </select>
                        </div>
                        
                        <div class="mb-3" id="customReasonDiv" style="display: none;">
                            <label for="customReason" class="form-label">Lý do khác</label>
                            <input type="text" id="customReason" class="form-control" 
                                   placeholder="Nhập lý do cụ thể...">
                        </div>
                        
                        <div class="mb-3">
                            <label for="reportDescription" class="form-label">Mô tả chi tiết (tùy chọn)</label>
                            <textarea id="reportDescription" class="form-control" rows="3" 
                                      placeholder="Cung cấp thêm thông tin về vấn đề này..."></textarea>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <strong>Lưu ý:</strong> Báo cáo sẽ được gửi đến admin để xem xét. 
                            Việc báo cáo sai có thể dẫn đến việc tài khoản của bạn bị hạn chế.
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                    <button type="button" class="btn btn-danger" onclick="submitReport(${messageId})">
                        <i class="fas fa-paper-plane"></i> Gửi báo cáo
                    </button>
                </div>
            </div>
        </div>
    `;

    // Xử lý hiển thị custom reason
    const reasonSelect = modal.querySelector('#reportReason');
    const customReasonDiv = modal.querySelector('#customReasonDiv');

    reasonSelect.addEventListener('change', function () {
        if (this.value === 'Other') {
            customReasonDiv.style.display = 'block';
            modal.querySelector('#customReason').required = true;
        } else {
            customReasonDiv.style.display = 'none';
            modal.querySelector('#customReason').required = false;
        }
    });

    return modal;
}

// Gửi báo cáo
async function submitReport(messageId) {
    const reasonSelect = document.getElementById('reportReason');
    const customReason = document.getElementById('customReason');
    const description = document.getElementById('reportDescription');

    // Validation
    if (!reasonSelect.value) {
        showReportAlert('warning', 'Vui lòng chọn lý do báo cáo');
        return;
    }

    if (reasonSelect.value === 'Other' && !customReason.value.trim()) {
        showReportAlert('warning', 'Vui lòng nhập lý do cụ thể');
        return;
    }

    // Chuẩn bị data
    const reason = reasonSelect.value === 'Other' ? customReason.value.trim() : reasonSelect.value;
    const reportData = {
        messageId: messageId,
        reason: reason,
        description: description.value.trim()
    };

    try {
        // Hiển thị loading
        const submitBtn = document.querySelector('button[onclick*="submitReport"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
        submitBtn.disabled = true;

        const response = await fetch('/Chat/ReportMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value || ''
            },
            body: JSON.stringify(reportData)
        });

        const result = await response.json();

        if (result.success) {
            showReportAlert('success', result.message || 'Báo cáo đã được gửi thành công');

            // Đóng modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
            modal.hide();

            // Ẩn menu options
            hideMessageOptions();

        } else {
            showReportAlert('danger', result.error || 'Có lỗi xảy ra khi gửi báo cáo');
        }

    } catch (error) {
        console.error('Error reporting message:', error);
        showReportAlert('danger', 'Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
        // Khôi phục button
        const submitBtn = document.querySelector('button[onclick*="submitReport"]');
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Hiển thị thông báo trong modal
function showReportAlert(type, message) {
    const modalBody = document.querySelector('#reportModal .modal-body');

    // Xóa alert cũ
    const existingAlert = modalBody.querySelector('.temp-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Tạo alert mới
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} temp-alert`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'times'}"></i>
        ${message}
    `;

    modalBody.insertBefore(alert, modalBody.firstChild);

    // Tự động xóa sau 5 giây (trừ success message)
    if (type !== 'success') {
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}



async function pinMessage(messageId, elementId) {
    try {
        const messageElement = document.getElementById(elementId);
        const isPinned = !messageElement.classList.contains('pinned');

        // THÊM ĐOẠN NÀY: Check giới hạn ghim
        if (isPinned) {
            const currentPinned = document.querySelectorAll('.message-item.pinned').length;
            const MAX_PINNED = 3;
            if (currentPinned >= MAX_PINNED) {
                showNotification(`Chỉ được ghim tối đa ${MAX_PINNED} tin nhắn`, 'warning');
                return;
            }
        }

        const response = await fetch('/Chat/PinMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: parseInt(messageId), pin: isPinned })
        });

        const result = await response.json();
        if (result.success) {
            if (messageElement) {
                messageElement.classList.toggle('pinned', result.isPinned);
                if (result.isPinned) {
                    // Thêm icon ghim vào tin nhắn
                    const messageContent = messageElement.querySelector('.message-content');
                    if (messageContent && !messageContent.querySelector('.pin-icon')) {
                        const pinIcon = document.createElement('span');
                        pinIcon.className = 'pin-icon';
                        pinIcon.innerHTML = '<i class="fas fa-thumbtack text-warning ms-2"></i>';
                        messageContent.appendChild(pinIcon);
                    }
                } else {
                    // Xóa icon ghim
                    const pinIcon = messageElement.querySelector('.pin-icon');
                    if (pinIcon) pinIcon.remove();
                }
            }
            updatePinnedMessages();
            showNotification(result.isPinned ? 'Đã ghim tin nhắn' : 'Đã bỏ ghim tin nhắn', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('❌ Pin failed:', error);
        showNotification(`Lỗi ghim: ${error.message}`, 'error');
    }
}

function initializeMessageOptionsTemplate() {
    if (document.getElementById('messageOptionsMenu')) {
        console.log('✅ Template already exists');
        return;
    }

    const template = document.createElement('div');
    template.id = 'messageOptionsMenu';
    template.className = 'message-options-menu d-none';
    template.innerHTML = `
        <div class="option" data-action="delete" style="display: none; padding: 8px 16px; cursor: pointer;">
            <i class="fas fa-trash"></i> Xóa
        </div>
        <div class="option" data-action="recall" style="display: none; padding: 8px 16px; cursor: pointer; position: relative;">
            <i class="fas fa-undo"></i> Thu hồi
            <div class="sub-menu" style="display: none;">
                <div class="sub-option" data-action="recall-sender" style="padding: 8px 16px; cursor: pointer; white-space: nowrap;">Thu hồi phía bạn</div>
                <div class="sub-option" data-action="recall-both" style="padding: 8px 16px; cursor: pointer; white-space: nowrap;">Thu hồi cho cả hai</div>
            </div>
        </div>
        <div class="option" data-action="reply" style="padding: 8px 16px; cursor: pointer;">
            <i class="fas fa-reply"></i> Trả lời
        </div>
        <div class="option" data-action="pin" style="padding: 8px 16px; cursor: pointer;">
            <i class="fas fa-thumbtack"></i> Ghim
        </div>
        <div class="option" data-action="report" style="padding: 8px 16px; cursor: pointer;">
            <i class="fas fa-flag"></i> Báo cáo
        </div>
    `;

    document.body.appendChild(template);
    console.log('✅ Template created successfully');
}

function showMessageOptions(event, messageId, elementId, isSender) {
    event.preventDefault();
    event.stopPropagation();

    console.log('🎯 Showing options for:', { messageId, elementId, isSender });

    hideAllMessageOptions();

    const template = document.getElementById('messageOptionsMenu');
    if (!template) {
        console.error('❌ Template not found! Initializing...');
        initializeMessageOptionsTemplate();
        setTimeout(() => showMessageOptions(event, messageId, elementId, isSender), 100);
        return;
    }

    const menu = template.cloneNode(true);
    menu.id = `menu-${messageId}-${Date.now()}`;
    menu.classList.remove('d-none');
    menu.dataset.messageId = messageId;
    menu.dataset.elementId = elementId;
    menu.dataset.isSender = isSender;

    configureMenuOptions(menu, isSender);

    // QUAN TRỌNG: Thêm menu vào DOM trước khi position
    document.body.appendChild(menu);

    // Position menu SAU KHI đã thêm vào DOM
    positionMenu(menu, event, isSender);

    setupRecallSubMenu(menu);

    console.log('✅ Menu displayed:', menu.id);
}
function configureMenuOptions(menu, isSender) {
    const deleteOption = menu.querySelector('[data-action="delete"]');
    const recallOption = menu.querySelector('[data-action="recall"]');

    if (isSender) {
        if (recallOption) recallOption.style.display = 'block';
        if (deleteOption) deleteOption.style.display = 'none';
    } else {
        if (deleteOption) deleteOption.style.display = 'block';
        if (recallOption) recallOption.style.display = 'none';
    }
}

function positionMenu(menu, event, isSender) {
    const button = event.target;
    const rect = button.getBoundingClientRect();

    // Lấy kích thước thực của menu sau khi render
    const menuRect = menu.getBoundingClientRect();
    const menuWidth = menuRect.width || 150;
    const menuHeight = menuRect.height || 200;

    let left, top;

    // Mặc định menu ở dưới button
    top = rect.bottom + window.scrollY + 5;

    if (isSender) {
        // Tin nhắn của mình (bên phải) - Menu mở về bên TRÁI của button
        left = rect.left + window.scrollX - menuWidth + rect.width;
    } else {
        // Tin nhắn người khác (bên trái) - Menu mở về bên PHẢI của button
        left = rect.left + window.scrollX;
    }

    // Đảm bảo không vượt quá màn hình
    const padding = 10;

    // Check right edge
    if (left + menuWidth > window.innerWidth - padding) {
        left = window.innerWidth - menuWidth - padding;
    }

    // Check left edge
    if (left < padding) {
        left = padding;
    }

    // Check bottom edge
    if (top + menuHeight > window.innerHeight + window.scrollY - padding) {
        // Hiển thị menu phía trên button
        top = rect.top + window.scrollY - menuHeight - 5;
    }

    menu.style.cssText = `
        position: absolute;
        top: ${top}px;
        left: ${left}px;
        z-index: 10000;
        display: block;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 150px;
        padding: 8px 0;
        font-size: 14px;
    `;
}

function setupRecallSubMenu(menu) {
    const recallOption = menu.querySelector('[data-action="recall"]');
    if (!recallOption) return;

    const subMenu = recallOption.querySelector('.sub-menu');
    if (!subMenu) return;

    // KHÔNG set style ngay, chỉ set khi hover
    subMenu.style.cssText = `
        display: none;
        position: absolute;
        top: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        min-width: 160px;
        padding: 4px 0;
        z-index: 10001;
    `;

    recallOption.addEventListener('mouseenter', () => {
        // Tính toán vị trí MỖI LẦN hover
        const menuRect = menu.getBoundingClientRect();
        const subMenuWidth = 160; // width của submenu

        // Kiểm tra có đủ chỗ bên phải không
        const spaceOnRight = window.innerWidth - menuRect.right;
        const hasSpaceOnRight = spaceOnRight >= subMenuWidth + 10;

        if (hasSpaceOnRight) {
            // Đủ chỗ bên phải - mở bình thường
            subMenu.style.left = '100%';
            subMenu.style.right = 'auto';
            subMenu.style.marginLeft = '2px';
            subMenu.style.marginRight = '0';
        } else {
            // Không đủ chỗ bên phải - mở về bên trái
            subMenu.style.left = 'auto';
            subMenu.style.right = '100%';
            subMenu.style.marginLeft = '0';
            subMenu.style.marginRight = '2px';
        }

        subMenu.style.display = 'block';

        console.log('Submenu position:', {
            menuRight: menuRect.right,
            spaceOnRight: spaceOnRight,
            hasSpaceOnRight: hasSpaceOnRight,
            windowWidth: window.innerWidth
        });
    });

    recallOption.addEventListener('mouseleave', (e) => {
        setTimeout(() => {
            if (!subMenu.matches(':hover') && !recallOption.matches(':hover')) {
                subMenu.style.display = 'none';
            }
        }, 100);
    });

    // Giữ submenu mở khi hover vào nó
    subMenu.addEventListener('mouseenter', () => {
        subMenu.style.display = 'block';
    });

    subMenu.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!recallOption.matches(':hover')) {
                subMenu.style.display = 'none';
            }
        }, 100);
    });
}
function hideAllMessageOptions() {
    document.querySelectorAll('.message-options-menu:not(.d-none)').forEach(menu => {
        if (menu.id !== 'messageOptionsMenu') {
            menu.remove();
        }
    });
}

document.addEventListener('click', async (event) => {
    const clickedElement = event.target;
    const menu = clickedElement.closest('.message-options-menu');

    if (clickedElement.classList.contains('option') || clickedElement.classList.contains('sub-option')) {
        const action = clickedElement.getAttribute('data-action');
        const messageId = menu.dataset.messageId;
        const elementId = menu.dataset.elementId;
        const isSender = menu.dataset.isSender === 'true';

        console.log('🎬 Action triggered:', { action, messageId, elementId, isSender });

        try {
            await handleMessageAction(action, messageId, elementId, isSender);
        } catch (error) {
            console.error('❌ Action failed:', error);
            showNotification('Có lỗi xảy ra', 'error');
        }

        hideAllMessageOptions();
    }
    else if (!menu) {
        hideAllMessageOptions();
    }
});

async function handleMessageAction(action, messageId, elementId, isSender) {
    switch (action) {
        case 'recall-sender':
            await recallMessage(messageId, 'SenderOnly', elementId);
            break;
        case 'recall-both':
            await recallMessage(messageId, 'Both', elementId);
            break;
        case 'delete':
            await deleteMessage(messageId, elementId);
            break;
        case 'reply':
            replyMessage(messageId, elementId);
            break;
        case 'pin':
            await pinMessage(messageId, elementId);
            break;
        case 'report':
            reportMessage(messageId);  // Thêm case này
            break;
        default:
            console.warn('⚠️ Unknown action:', action);
    }
}

async function recallMessage(messageId, recallType, elementId) {
    try {
        showNotification('Đang thu hồi...', 'info');

        const response = await fetch('/Chat/RecallMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: parseInt(messageId), recallType })
        });

        const result = await response.json();
        if (result.success) {
            const messageElement = document.getElementById(elementId);
            if (messageElement) {
                const contentElement = messageElement.querySelector('.message-content');
                if (contentElement) {
                    contentElement.innerHTML = '<i class="fas fa-undo text-muted"></i> <em>Tin nhắn đã được thu hồi</em>';
                }
                messageElement.classList.add('recalled');
            }
            showNotification('Thu hồi thành công', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('❌ Recall failed:', error);
        showNotification(`Lỗi thu hồi: ${error.message}`, 'error');
    }
}

async function deleteMessage(messageId, elementId) {
    try {
        const response = await fetch(`/Chat/DeleteMessage/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            credentials: 'include'
        });

        const result = await response.json();
        if (result.success) {
            const messageElement = document.getElementById(elementId);
            if (messageElement) {
                messageElement.style.opacity = '0';
                messageElement.style.transform = 'translateX(-100%)';
                messageElement.style.transition = 'all 0.3s ease-out';
                setTimeout(() => messageElement.remove(), 300);
            }
        } else {
            throw new Error(result.error || 'Lỗi xóa tin nhắn');
        }
    } catch (error) {
        console.error('❌ Delete failed:', error);
        showNotification(`Lỗi xóa: ${error.message}`, 'error');
    }
}

async function pinMessage(messageId, elementId) {
    try {
        const messageElement = document.getElementById(elementId);
        const isPinned = !messageElement.classList.contains('pinned');

        const response = await fetch('/Chat/PinMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: parseInt(messageId), pin: isPinned })
        });

        const result = await response.json();
        if (result.success) {
            if (messageElement) {
                messageElement.classList.toggle('pinned', result.isPinned);
                if (result.isPinned) {
                    // Thêm icon ghim vào tin nhắn
                    const messageContent = messageElement.querySelector('.message-content');
                    if (messageContent && !messageContent.querySelector('.pin-icon')) {
                        const pinIcon = document.createElement('span');
                        pinIcon.className = 'pin-icon';
                        pinIcon.innerHTML = '<i class="fas fa-thumbtack text-warning ms-2"></i>';
                        messageContent.appendChild(pinIcon);
                    }
                } else {
                    // Xóa icon ghim
                    const pinIcon = messageElement.querySelector('.pin-icon');
                    if (pinIcon) pinIcon.remove();
                }
            }
            updatePinnedMessages();
            showNotification(result.isPinned ? 'Đã ghim tin nhắn' : 'Đã bỏ ghim tin nhắn', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('❌ Pin failed:', error);
        showNotification(`Lỗi ghim: ${error.message}`, 'error');
    }
}

async function reportMessage(messageId) {
    const reason = prompt('Lý do báo cáo (tùy chọn):');

    try {
        const response = await fetch('/Chat/ReportMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: parseInt(messageId), reason })
        });

        const result = await response.json();
        if (result.success) {
            showNotification('Báo cáo đã được gửi', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('❌ Report failed:', error);
        showNotification(`Lỗi báo cáo: ${error.message}`, 'error');
    }
}

function replyMessage(messageId, elementId) {
    const messageElement = document.getElementById(elementId);
    if (!messageElement) return;

    // Lấy thông tin tin nhắn được reply
    const contentElement = messageElement.querySelector('.message-content');
    const senderElement = messageElement.querySelector('.message-sender');

    if (!contentElement) return;

    const content = contentElement.textContent.trim();
    const senderName = senderElement ? senderElement.textContent.trim() : 'Unknown';

    // Tạo hoặc update reply box
    let replyBox = document.getElementById('replyBox');
    if (!replyBox) {
        replyBox = createReplyBox();
    }

    // Set data cho reply box
    replyBox.style.display = 'flex';
    replyBox.dataset.replyToId = messageId;
    replyBox.dataset.replyToElementId = elementId;

    const replyToName = replyBox.querySelector('.reply-to-name');
    const replyContent = replyBox.querySelector('.reply-content');

    if (replyToName) replyToName.textContent = senderName;
    if (replyContent) {
        const shortContent = content.length > 50 ? content.substring(0, 50) + '...' : content;
        replyContent.textContent = shortContent;
    }

    // Focus vào input
    const inputBox = document.getElementById('messageInput');
    if (inputBox) {
        inputBox.focus();
        inputBox.placeholder = 'Nhập tin nhắn trả lời...';
    }
}

function createReplyBox() {
    const replyBox = document.createElement('div');
    replyBox.id = 'replyBox';
    replyBox.className = 'reply-box';
    replyBox.style.cssText = `
        display: none;
        align-items: center;
        padding: 10px 15px;
        background: #f0f0f0;
        border-left: 3px solid #0084ff;
        margin-bottom: 10px;
        position: relative;
    `;

    replyBox.innerHTML = `
        <div class="reply-info" style="flex: 1; cursor: pointer;" onclick="scrollToReplyMessage()">
            <div class="d-flex align-items-center mb-1">
                <i class="fas fa-reply text-primary me-2"></i>
                <span class="reply-to-name fw-bold" style="color: #0084ff;"></span>
            </div>
            <div class="reply-content text-muted" style="font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></div>
        </div>
        <button class="btn btn-sm btn-link text-muted" onclick="cancelReply()" style="padding: 4px 8px;">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Insert vào trước input group
    const inputContainer = document.querySelector('.input-group').parentElement;
    if (inputContainer) {
        inputContainer.insertBefore(replyBox, inputContainer.firstChild);
    }

    return replyBox;
}

function cancelReply() {
    const replyBox = document.getElementById('replyBox');
    if (replyBox) {
        replyBox.style.display = 'none';
        replyBox.dataset.replyToId = '';
        replyBox.dataset.replyToElementId = '';
    }

    const inputBox = document.getElementById('messageInput');
    if (inputBox) {
        inputBox.placeholder = 'Nhập tin nhắn...';
    }
}


function scrollToReplyMessage() {
    const replyBox = document.getElementById('replyBox');
    if (!replyBox) return;

    const replyToElementId = replyBox.dataset.replyToElementId;
    if (!replyToElementId) return;

    const targetMessage = document.getElementById(replyToElementId);
    if (targetMessage) {
        // Scroll tới tin nhắn
        targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight tin nhắn
        targetMessage.classList.add('highlight-message');
        setTimeout(() => {
            targetMessage.classList.remove('highlight-message');
        }, 2000);
    }
}


function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 10100; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

function updatePinnedMessages() {
    // Lưu trạng thái dropdown hiện tại
    const currentDropdown = document.getElementById('pinnedDropdown');
    const isDropdownOpen = currentDropdown && currentDropdown.style.display !== 'none';

    // Lọc tin nhắn ghim của cuộc hội thoại hiện tại
    const pinnedMessages = document.querySelectorAll('.message-item.pinned');
    const currentChatPinned = Array.from(pinnedMessages).filter(msg => {
        const senderId = msg.dataset.senderId;
        return senderId === selectedUserId || senderId === currentUserId;
    });

    // Xóa header ghim cũ nếu có
    const oldPinnedHeader = document.querySelector('.pinned-messages-header');
    if (oldPinnedHeader) {
        oldPinnedHeader.remove();
    }

    if (currentChatPinned.length === 0) {
        return;
    }

    // Giới hạn tối đa 3 tin nhắn ghim
    const MAX_PINNED = 3;
    if (currentChatPinned.length > MAX_PINNED) {
        showNotification(`Chỉ được ghim tối đa ${MAX_PINNED} tin nhắn`, 'warning');
        // Bỏ ghim tin nhắn cũ nhất
        const oldestPinned = currentChatPinned[0];
        unpinMessage(oldestPinned.id);
        return;
    }

    // Tạo header ghim mới
    const chatHeader = document.getElementById('chatHeader');
    if (!chatHeader) return;

    const pinnedHeader = document.createElement('div');
    pinnedHeader.className = 'pinned-messages-header';
    pinnedHeader.innerHTML = `
        <div class="pinned-indicator" onclick="showPinnedMessagesDropdown(event)">
            <i class="fas fa-thumbtack"></i>
            <span>+${currentChatPinned.length} ghim</span>
            <i class="fas fa-chevron-down ms-1"></i>
        </div>
        <div class="pinned-dropdown" id="pinnedDropdown" style="display: none;">
            ${currentChatPinned.map(msg => {
        const contentEl = msg.querySelector('.message-content');
        let content = '';

        // Lấy nội dung text, bỏ qua icon và reply preview
        const textNodes = contentEl ? Array.from(contentEl.childNodes).filter(node =>
            node.nodeType === Node.TEXT_NODE ||
            (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('pin-icon') && !node.classList.contains('reply-preview'))
        ) : [];

        content = textNodes.map(node => node.textContent).join(' ').trim();

        // Xử lý tin nhắn đặc biệt
        if (msg.dataset.isRecalled === 'true') {
            content = 'Tin nhắn đã được thu hồi';
        } else if (!content) {
            const messageType = msg.querySelector('.message-content')?.dataset.messageType;
            switch (messageType) {
                case 'sticker': content = '🎪 Sticker'; break;
                case 'image': content = '📷 Hình ảnh'; break;
                case 'video': content = '📹 Video'; break;
                case 'voice': content = '🎤 Tin nhắn thoại'; break;
                case 'document': content = '📎 Tệp đính kèm'; break;
                default: content = 'Tin nhắn';
            }
        }

        const sender = msg.querySelector('.message-sender')?.textContent || 'Unknown';
        const shortContent = content.length > 40 ? content.substring(0, 40) + '...' : content;
        const messageId = msg.dataset.messageId || msg.id.replace('message-', '');

        return `
                    <div class="pinned-dropdown-item">
                        <div class="pinned-item-content" onclick="scrollToPinnedMessage('${msg.id}')">
                            <div class="pinned-sender">${sender}:</div>
                            <div class="pinned-text">${shortContent}</div>
                        </div>
                        <button class="btn-unpin-small" onclick="event.stopPropagation(); unpinMessage('${msg.id}')" title="Bỏ ghim">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    // Chèn vào sau chat header
    chatHeader.insertAdjacentElement('afterend', pinnedHeader);

    // Nếu dropdown đang mở trước đó, giữ nó mở
    if (isDropdownOpen) {
        const newDropdown = document.getElementById('pinnedDropdown');
        if (newDropdown) {
            newDropdown.style.display = 'block';
        }
    }
}


// Function hiển thị dropdown
function showPinnedMessagesDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('pinnedDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}
// Đóng dropdown khi click ra ngoài
document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('pinnedDropdown');
    if (dropdown && !event.target.closest('.pinned-indicator')) {
        dropdown.style.display = 'none';
    }
});
// Function scroll tới tin nhắn ghim
function scrollToPinnedMessage(elementId) {
    const targetMessage = document.getElementById(elementId);
    if (targetMessage) {
        targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight tin nhắn
        targetMessage.classList.add('highlight-message');
        setTimeout(() => {
            targetMessage.classList.remove('highlight-message');
        }, 2000);
    }

    // Đóng dropdown
    const dropdown = document.getElementById('pinnedDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

async function unpinMessage(elementId) {
    const messageElement = document.getElementById(elementId);
    if (!messageElement) return;

    const messageId = messageElement.dataset.messageId;
    if (messageId) {
        await pinMessage(messageId, elementId);
    }
}



console.log('✅ Message options module loaded successfully');