const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Để xác thực token
const { v4: uuidv4 } = require('uuid'); // Để tạo ID giả lập

// Giả lập cơ sở dữ liệu
let Messages = [];
let Reports = [];
const secretKey = 'your-secret-key'; // Thay bằng key thực tế trong môi trường production

// Middleware xác thực
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.warn('No token provided');
        return res.status(401).json({ error: 'User not authenticated' });
    }
    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // Giả sử token chứa userId
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Thu hồi tin nhắn
router.post('/recall', authenticate, async (req, res) => {
    console.log(`RecallMessage: MessageId=${req.body.messageId}, RecallType=${req.body.recallType}`);
    try {
        const { messageId, recallType } = req.body;
        if (!recallType || !['SenderOnly', 'Both'].includes(recallType)) {
            console.warn('Invalid recall type');
            return res.status(400).json({ error: 'Invalid recall type' });
        }

        const message = Messages.find(m => m.id === messageId && m.senderId === req.user.userId);
        if (!message) {
            console.warn(`Message not found or user is not the sender: ${messageId}`);
            return res.status(404).json({ error: 'Message not found or you are not the sender' });
        }

        const timeDiff = (new Date() - new Date(message.sentAt)) / (1000 * 60);
        if (timeDiff > 10) {
            console.warn(`Message too old to recall: ${messageId}`);
            return res.status(400).json({ error: 'Message is too old to recall' });
        }

        message.isRecalled = true;
        message.recalledFor = recallType;
        message.content = 'Tin nhắn đã được thu hồi';

        console.log(`Message recalled successfully: ${messageId}, Type: ${recallType}`);
        return res.json({ success: true, messageId, recallType });
    } catch (error) {
        console.error('Error recalling message:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Xóa tin nhắn
router.delete('/:messageId', authenticate, async (req, res) => {
    console.log(`DeleteMessage: MessageId=${req.params.messageId}`);
    try {
        const messageId = parseInt(req.params.messageId);
        const messageIndex = Messages.findIndex(m => m.id === messageId &&
            (m.senderId === req.user.userId || m.receiverId === req.user.userId));

        if (messageIndex === -1) {
            console.warn(`Message not found or user is not involved: ${messageId}`);
            return res.status(404).json({ error: 'Message not found or you are not involved in this message' });
        }

        Messages.splice(messageIndex, 1);
        console.log(`Message deleted successfully: ${messageId}`);
        return res.json({ success: true, messageId });
    } catch (error) {
        console.error('Error deleting message:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Ghim tin nhắn
router.post('/pin', authenticate, async (req, res) => {
    console.log(`PinMessage: MessageId=${req.body.messageId}`);
    try {
        const { messageId } = req.body;
        const message = Messages.find(m => m.id === messageId &&
            (m.senderId === req.user.userId || m.receiverId === req.user.userId));

        if (!message) {
            console.warn(`Message not found or user is not involved: ${messageId}`);
            return res.status(404).json({ error: 'Message not found or you are not involved' });
        }

        message.isPinned = !message.isPinned;
        console.log(`Message pin status updated: ${messageId}, IsPinned: ${message.isPinned}`);
        return res.json({ success: true, messageId, isPinned: message.isPinned });
    } catch (error) {
        console.error('Error pinning message:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Báo cáo tin nhắn
router.post('/report', authenticate, async (req, res) => {
    console.log(`ReportMessage: MessageId=${req.body.messageId}`);
    try {
        const { messageId } = req.body;
        const message = Messages.find(m => m.id === messageId);
        if (!message) {
            console.warn(`Message not found: ${messageId}`);
            return res.status(404).json({ error: 'Message not found' });
        }

        const report = {
            id: uuidv4(),
            reporterId: req.user.userId,
            reportedMessageId: messageId,
            reportedUserId: message.senderId,
            reason: 'Báo cáo từ người dùng',
            reportedAt: new Date()
        };
        Reports.push(report);
        console.log(`Report recorded for message: ${messageId}`);
        return res.json({ success: true, messageId, message: 'Báo cáo đã được ghi nhận' });
    } catch (error) {
        console.error('Error reporting message:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Trả lời tin nhắn
router.post('/reply', authenticate, async (req, res) => {
    console.log(`ReplyMessage: MessageId=${req.body.messageId}, Content=${req.body.content}`);
    try {
        const { messageId, content } = req.body;
        const repliedMessage = Messages.find(m => m.id === messageId);
        if (!repliedMessage) {
            console.warn(`Replied message not found: ${messageId}`);
            return res.status(404).json({ error: 'Replied message not found' });
        }

        const newMessage = {
            id: Messages.length + 1,
            senderId: req.user.userId,
            receiverId: repliedMessage.senderId === req.user.userId ? repliedMessage.receiverId : repliedMessage.senderId,
            content,
            messageType: 'text',
            sentAt: new Date(),
            repliedMessageId: messageId
        };
        Messages.push(newMessage);
        console.log(`Reply message sent: ${newMessage.id}`);
        return res.json({ success: true, messageId: newMessage.id });
    } catch (error) {
        console.error('Error replying message:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;