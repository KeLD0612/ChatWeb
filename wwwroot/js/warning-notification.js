// warning-notification.js - Hiển thị thông báo cảnh báo cho user

document.addEventListener('DOMContentLoaded', function () {
    checkForWarnings();
});

function checkForWarnings() {
    // Kiểm tra session có warnings không
    fetch('/Account/GetUnreadWarnings')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.warnings && data.warnings.length > 0) {
                showWarningModal(data.warnings);
            }
        })
        .catch(error => {
            console.error('Error checking warnings:', error);
        });
}

function showWarningModal(warnings) {
    // Tạo modal động
    const modalId = 'warningModal';

    // Xóa modal cũ nếu có
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }

    const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-lg">
                <div class="modal-content border-warning">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Thông báo quan trọng từ quản trị viên
                        </h5>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <h6 class="fw-bold">Bạn có ${warnings.length} cảnh báo chưa đọc:</h6>
                        </div>
                        
                        ${warnings.map((warning, index) => `
                            <div class="card mb-3 border-warning">
                                <div class="card-header bg-warning bg-opacity-10">
                                    <h6 class="mb-0">
                                        <i class="fas fa-bell me-2"></i>
                                        Cảnh báo #${index + 1}
                                        <small class="text-muted float-end">
                                            ${new Date(warning.CreatedAt).toLocaleDateString('vi-VN')}
                                        </small>
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-0">${warning.Warning}</p>
                                </div>
                            </div>
                        `).join('')}
                        
                        <div class="alert alert-info">
                            <h6 class="fw-bold">Lưu ý quan trọng:</h6>
                            <ul class="mb-0">
                                <li>Vui lòng tuân thủ các quy tắc cộng đồng</li>
                                <li>Tiếp tục vi phạm có thể dẫn đến việc khóa tài khoản</li>
                                <li>Mọi thắc mắc xin liên hệ bộ phận hỗ trợ</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-warning" onclick="acknowledgeWarnings([${warnings.map(w => w.WarningId).join(',')}])">
                            <i class="fas fa-check me-1"></i>
                            Tôi đã hiểu (${warnings.length})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Thêm modal vào DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

function acknowledgeWarnings(warningIds) {
    fetch('/Account/AcknowledgeWarnings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value || ''
        },
        body: JSON.stringify({ warningIds: warningIds })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Đóng modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('warningModal'));
                modal.hide();

                // Hiển thị thông báo thành công
                showToast('success', 'Đã xác nhận đọc cảnh báo', 'Cảm ơn bạn đã đọc và hiểu các cảnh báo.');
            } else {
                showToast('error', 'Lỗi', 'Không thể xác nhận cảnh báo. Vui lòng thử lại.');
            }
        })
        .catch(error => {
            console.error('Error acknowledging warnings:', error);
            showToast('error', 'Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
        });
}

function showToast(type, title, message) {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${title}</strong><br>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();

    // Tự động xóa toast sau khi ẩn
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}