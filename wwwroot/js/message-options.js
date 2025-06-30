// Hiển thị menu tùy chọn khi nhấp vào nút ba chấm
// Hiển thị menu tùy chọn khi nhấp vào nút ba chấm
function showMessageOptions(event, messageId) {
    event.preventDefault();
    event.stopPropagation();

    // Ẩn tất cả menu khác trước khi mở menu mới
    document.querySelectorAll('.message-options-menu').forEach(menu => {
        menu.remove();
    });

    // Clone template menu
    let template = document.getElementById('messageOptionsMenu');
    if (!template) {
        console.error('Template #messageOptionsMenu not found, creating fallback');
        // Tạo fallback template nếu không tìm thấy
        const fallbackTemplate = document.createElement('div');
        fallbackTemplate.id = 'messageOptionsMenu';
        fallbackTemplate.className = 'message-options-menu d-none';
        fallbackTemplate.innerHTML = `
            <div class="option" data-action="delete">Xóa</div>
            <div class="option" data-action="forward">Chuyển tiếp</div>
            <div class="option" data-action="pin">Ghim</div>
            <div class="option" data-action="report">Báo cáo</div>
        `;
        document.body.appendChild(fallbackTemplate);
        template = fallbackTemplate;
    }

    let menu = template.cloneNode(true);
    menu.id = `menu-${messageId}`; // Đặt ID duy nhất cho menu
    menu.classList.remove('d-none');
    menu.classList.add('message-options-menu');

    // Đặt vị trí menu gần nút ba chấm
    menu.style.position = 'absolute';
    menu.style.top = `${event.pageY}px`;
    menu.style.left = `${event.pageX - 120}px`; // Điều chỉnh để menu không bị lệch
    menu.style.zIndex = '1000';

    // Lưu messageId để xử lý hành động
    menu.dataset.messageId = messageId;

    // Thêm menu vào body
    document.body.appendChild(menu);

    // Ngăn chặn sự kiện click trên menu lan ra ngoài
    menu.addEventListener('click', (e) => e.stopPropagation());
}

// Ẩn menu khi nhấp ra ngoài
document.addEventListener('click', function () {
    document.querySelectorAll('.message-options-menu').forEach(menu => {
        menu.remove();
    });
});

// Xử lý hành động khi chọn option
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('option')) {
        const action = event.target.getAttribute('data-action');
        const menu = event.target.closest('.message-options-menu');
        const messageId = menu.dataset.messageId;

        switch (action) {
            case 'delete':
                deleteMessage(messageId);
                break;
            case 'forward':
                forwardMessage(messageId);
                break;
            case 'pin':
                pinMessage(messageId);
                break;
            case 'report':
                reportMessage(messageId);
                break;
        }
        menu.remove(); // Xóa menu sau khi chọn option
    }
});

// Các hàm xử lý hành động (placeholder, bạn có thể thay thế bằng logic thực tế)
function deleteMessage(messageId) {
    console.log(`Xóa tin nhắn ID: ${messageId}`);
    // Gọi API hoặc hàm xóa tin nhắn, ví dụ: fetch(`/api/messages/delete/${messageId}`, { method: 'DELETE' })
}

function forwardMessage(messageId) {
    console.log(`Chuyển tiếp tin nhắn ID: ${messageId}`);
    // Hiện modal chọn người để chuyển tiếp
}

function pinMessage(messageId) {
    console.log(`Ghim tin nhắn ID: ${messageId}`);
    // Gọi API ghim tin nhắn
}

function reportMessage(messageId) {
    console.log(`Báo cáo tin nhắn ID: ${messageId}`);
    // Hiện modal báo cáo
}

// Ẩn menu khi nhấp ra ngoài
document.addEventListener('click', function () {
    document.querySelectorAll('.message-options-menu').forEach(menu => {
        menu.remove();
    });
});

// Xử lý hành động khi chọn option
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('option')) {
        const action = event.target.getAttribute('data-action');
        const menu = event.target.closest('.message-options-menu');
        const messageId = menu.dataset.messageId;

        switch (action) {
            case 'delete':
                deleteMessage(messageId);
                break;
            case 'forward':
                forwardMessage(messageId);
                break;
            case 'pin':
                pinMessage(messageId);
                break;
            case 'report':
                reportMessage(messageId);
                break;
        }
        menu.remove(); // Xóa menu sau khi chọn option
    }
});

// Các hàm xử lý hành động (placeholder, bạn có thể thay thế bằng logic thực tế)
function deleteMessage(messageId) {
    console.log(`Xóa tin nhắn ID: ${messageId}`);
    // Gọi API hoặc hàm xóa tin nhắn, ví dụ: fetch(`/api/messages/delete/${messageId}`, { method: 'DELETE' })
}

function forwardMessage(messageId) {
    console.log(`Chuyển tiếp tin nhắn ID: ${messageId}`);
    // Hiện modal chọn người để chuyển tiếp
}

function pinMessage(messageId) {
    console.log(`Ghim tin nhắn ID: ${messageId}`);
    // Gọi API ghim tin nhắn
}

function reportMessage(messageId) {
    console.log(`Báo cáo tin nhắn ID: ${messageId}`);
    // Hiện modal báo cáo
}