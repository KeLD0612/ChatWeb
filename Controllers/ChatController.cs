using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using webchat.Hubs;
using webchat.Models;

namespace webchat.Controllers
{
    [Authorize]
    public class ChatController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ChatController> _logger;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<ChatController> logger,
            IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
            _hubContext = hubContext;
        }

        public async Task<IActionResult> Index(string userId = null, string userName = null)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return RedirectToAction("Login", "Account", new { area = "Identity" });
                }

                var users = await _context.Users
                    .Where(u => u.Id != currentUser.Id)
                    .Where(u => !string.IsNullOrEmpty(u.Email))
                    .OrderBy(u => u.FullName ?? u.Email)
                    .ToListAsync();

                if (!string.IsNullOrEmpty(userId))
                {
                    var targetUser = users.FirstOrDefault(u => u.Id == userId);
                    if (targetUser == null)
                    {
                        var userInDb = await _userManager.FindByIdAsync(userId);
                        if (userInDb != null)
                        {
                            if (!users.Any(u => u.Id == userInDb.Id))
                            {
                                users.Add(userInDb);
                            }
                        }
                        else
                        {
                            var partialMatches = await _context.Users
                                .Where(u => u.Id.Contains(userId) ||
                                           (u.Email != null && u.Email.Contains(userId)))
                                .ToListAsync();

                            userId = null;
                            userName = null;
                        }
                    }
                }

                if (!string.IsNullOrEmpty(userName))
                {
                    try
                    {
                        var decodedUserName = Uri.UnescapeDataString(userName);
                        var userByName = users.FirstOrDefault(u =>
                            u.GetDisplayName() == decodedUserName);

                        if (userByName != null)
                        {
                            userId = userByName.Id;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error decoding userName: '{userName}'");
                    }
                }

                ViewBag.CurrentUser = currentUser;
                ViewBag.SelectedUserId = userId ?? string.Empty;
                ViewBag.SelectedUserName = !string.IsNullOrEmpty(userName) ?
                    Uri.UnescapeDataString(userName) : (userId != null ? users.FirstOrDefault(u => u.Id == userId)?.GetDisplayName() ?? string.Empty : string.Empty);

                return View(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ChatController.Index");

                ViewBag.CurrentUser = await _userManager.GetUserAsync(User);
                ViewBag.SelectedUserId = string.Empty;
                ViewBag.SelectedUserName = string.Empty;
                ViewBag.ErrorMessage = "Không thể tải danh sách người dùng: " + ex.Message;

                return View(new List<ApplicationUser>());
            }
        }

        [HttpGet]
        public async Task<IActionResult> StartChat(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction("Index");
            }

            try
            {
                var targetUser = await _userManager.FindByIdAsync(userId);

                if (targetUser == null)
                {
                    var userByEmail = await _userManager.FindByEmailAsync(userId);
                    if (userByEmail != null)
                    {
                        targetUser = userByEmail;
                    }
                    else
                    {
                        targetUser = await _context.Users
                            .FirstOrDefaultAsync(u => u.Id == userId || u.Email == userId);
                    }
                }

                if (targetUser == null)
                {
                    return RedirectToAction("Index");
                }

                var userName = targetUser.GetDisplayName();
                var encodedUserName = Uri.EscapeDataString(userName);

                return RedirectToAction("Index", new
                {
                    userId = userId,
                    userName = encodedUserName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in StartChat for userId: '{userId}'");
                return RedirectToAction("Index");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMessages(string userId)
        {
            try
            {
                _logger.LogInformation($"=== GetMessages START ===");
                _logger.LogInformation($"Received userId: '{userId}'");

                // Kiểm tra authentication
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogError("Current user is null - not authenticated");
                    return Json(new { error = "Not authenticated", success = false });
                }

                _logger.LogInformation($"Current user authenticated: {currentUser.Id}");

                // Validate userId
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogError("userId is null or empty");
                    return Json(new { error = "Invalid user ID", success = false });
                }

                // Kiểm tra user tồn tại
                var targetUser = await _userManager.FindByIdAsync(userId);
                if (targetUser == null)
                {
                    _logger.LogError($"Target user not found: {userId}");
                    return Json(new { error = "Target user not found", success = false });
                }

                _logger.LogInformation($"Loading messages between {currentUser.Id} and {userId}");

                // Load messages với try-catch riêng
                List<Message> messages;
                try
                {
                    messages = await _context.Messages
                        .Include(m => m.Sender)
                        .Include(m => m.Receiver)
                        .Include(m => m.RepliedMessage) // Thêm include RepliedMessage
                            .ThenInclude(rm => rm.Sender) // Include sender của replied message
                        .Include(m => m.Reactions) // THÊM REACTIONS
                            .ThenInclude(r => r.User) // INCLUDE USER CỦA REACTION
                        .Where(m => (m.SenderId == currentUser.Id && m.ReceiverId == userId) ||
                                   (m.SenderId == userId && m.ReceiverId == currentUser.Id))
                        .OrderBy(m => m.SentAt)
                        .ToListAsync();

                    _logger.LogInformation($"Found {messages.Count} messages");
                }
                catch (Exception dbEx)
                {
                    _logger.LogError(dbEx, "Database error when loading messages");
                    return Json(new { error = "Database error", success = false });
                }

                // Format messages với xử lý thu hồi và xóa
                var result = messages.Select(m => {
                    try
                    {
                        var isCurrentUserSender = m.SenderId == currentUser.Id;
                        var isRecalledForMe = false;
                        var displayContent = m.Content;
                        var isDeletedByReceiver = false;
                        var isDeletedBySender = false;

                        // Xử lý logic thu hồi và xóa
                        if (m.IsRecalled == true && !string.IsNullOrEmpty(m.RecalledFor))
                        {
                            switch (m.RecalledFor)
                            {
                                case "Both":
                                    // Thu hồi cho cả hai
                                    isRecalledForMe = true;
                                    displayContent = "[Tin nhắn đã được thu hồi]";
                                    break;

                                case "SenderOnly":
                                    if (isCurrentUserSender)
                                    {
                                        // Chỉ thu hồi phía người gửi
                                        isRecalledForMe = true;
                                        displayContent = "[Tin nhắn đã được thu hồi]";
                                    }
                                    break;

                                case "DeletedByReceiver":
                                    if (!isCurrentUserSender)
                                    {
                                        // Tin nhắn đã bị người nhận xóa - không hiển thị cho người nhận
                                        return null;
                                    }
                                    else
                                    {
                                        // Người gửi vẫn thấy tin nhắn nhưng biết là đã bị xóa
                                        isDeletedByReceiver = true;
                                    }
                                    break;

                                case "DeletedBySender":
                                    if (isCurrentUserSender)
                                    {
                                        // Tin nhắn đã bị người gửi xóa - không hiển thị cho người gửi
                                        return null;
                                    }
                                    else
                                    {
                                        // Người nhận vẫn thấy tin nhắn bình thường
                                        isDeletedBySender = true;
                                    }
                                    break;
                            }
                        }

                        // Tạo reply info nếu có
                        object repliedMessageInfo = null;
                        if (m.RepliedMessageId != null && m.RepliedMessage != null)
                        {
                            repliedMessageInfo = new
                            {
                                id = m.RepliedMessage.Id,
                                senderName = m.RepliedMessage.Sender?.GetDisplayName() ?? "Unknown",
                                content = m.RepliedMessage.Content
                            };
                        }

                        return new
                        {
                            id = m.Id,
                            senderId = m.SenderId,
                            senderName = m.Sender?.GetDisplayName() ?? "Unknown User",
                            content = displayContent,
                            originalContent = isCurrentUserSender ? m.Content : null,
                            messageType = m.MessageType ?? "text",
                            timestamp = m.SentAt,
                            isRead = m.IsRead,
                            isSender = isCurrentUserSender,
                            isRecalled = isRecalledForMe,
                            isDeletedByReceiver = isDeletedByReceiver,
                            isDeletedBySender = isDeletedBySender,
                            recallType = m.RecalledFor,
                            repliedMessageId = m.RepliedMessageId,
                            repliedMessage = repliedMessageInfo,
                            isPinned = m.IsPinned,
                            // THÊM REACTIONS
                            reactions = m.Reactions?.Select(r => new
                            {
                                reactionType = r.ReactionType,
                                userId = r.UserId,
                                userName = r.User?.GetDisplayName() ?? "Unknown"
                            }).ToList()
                        };
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error formatting message ID: {m.Id}");
                        return null;
                    }
                })
                .Where(m => m != null) // Filter out null (deleted messages)
                .ToList();

                _logger.LogInformation($"Returning {result.Count} formatted messages");
                return Json(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetMessages");
                return Json(new
                {
                    error = "Server error: " + ex.Message,
                    success = false,
                    stackTrace = ex.StackTrace // Chỉ để debug, remove trong production
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> RecallMessage([FromBody] RecallMessageRequest request)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, error = "User not authenticated" });
                }

                var message = await _context.Messages
                    .FirstOrDefaultAsync(m => m.Id == request.MessageId && m.SenderId == currentUser.Id);

                if (message == null)
                {
                    return NotFound(new { success = false, error = "Message not found or unauthorized" });
                }

                if (message.IsRecalled == true)
                {
                    return BadRequest(new { success = false, error = "Message already recalled" });
                }

                message.IsRecalled = true;
                message.RecalledFor = request.RecallType;

                await _context.SaveChangesAsync();

                if (request.RecallType == "Both")
                {
                    await _hubContext.Clients.Group($"User_{message.ReceiverId}")
                        .SendAsync("MessageRecalled", request.MessageId, request.RecallType);
                }

                return Json(new
                {
                    success = true,
                    message = "Message recalled successfully",
                    recallType = request.RecallType
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error recalling message: {request.MessageId}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpDelete("Chat/DeleteMessage/{messageId}")]
        public async Task<IActionResult> DeleteMessage(int messageId)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, error = "User not authenticated" });
                }

                var message = await _context.Messages
                    .FirstOrDefaultAsync(m => m.Id == messageId &&
                        (m.SenderId == currentUser.Id || m.ReceiverId == currentUser.Id));

                if (message == null)
                {
                    return NotFound(new { success = false, error = "Message not found or unauthorized" });
                }

                if (message.SenderId == currentUser.Id)
                {
                    message.IsRecalled = true;
                    message.RecalledFor = "DeletedBySender";
                }
                else
                {
                    message.IsRecalled = true;
                    message.RecalledFor = "DeletedByReceiver";
                }

                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Message deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting message: {messageId}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> PinMessage([FromBody] PinMessageRequest request)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, error = "User not authenticated" });
                }

                var message = await _context.Messages
                    .FirstOrDefaultAsync(m => m.Id == request.MessageId &&
                                            (m.SenderId == currentUser.Id || m.ReceiverId == currentUser.Id));

                if (message == null)
                {
                    return NotFound(new { success = false, error = "Message not found or unauthorized" });
                }

                message.IsPinned = request.Pin;
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = $"Message {(request.Pin ? "pinned" : "unpinned")} successfully",
                    isPinned = request.Pin
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error pinning message: {request.MessageId}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        // Thêm các methods này vào ChatController.cs (sau method PinMessage)

        [HttpPost]
        public async Task<IActionResult> AddReaction([FromBody] ReactionRequest request)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, error = "User not authenticated" });
                }

                var message = await _context.Messages
                    .Include(m => m.Reactions)
                    .FirstOrDefaultAsync(m => m.Id == request.MessageId);

                if (message == null)
                {
                    return NotFound(new { success = false, error = "Message not found" });
                }

                if (message.SenderId != currentUser.Id && message.ReceiverId != currentUser.Id)
                {
                    return StatusCode(403, new { success = false, error = "Unauthorized to react to this message" });
                }

                var existingReaction = await _context.MessageReactions
                    .FirstOrDefaultAsync(r => r.MessageId == request.MessageId && r.UserId == currentUser.Id);

                if (existingReaction != null)
                {
                    if (existingReaction.ReactionType == request.ReactionType)
                    {
                        _context.MessageReactions.Remove(existingReaction);
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        existingReaction.ReactionType = request.ReactionType;
                        existingReaction.CreatedAt = DateTime.Now;
                        await _context.SaveChangesAsync();
                    }
                }
                else
                {
                    var newReaction = new MessageReaction
                    {
                        MessageId = request.MessageId,
                        UserId = currentUser.Id,
                        ReactionType = request.ReactionType,
                        CreatedAt = DateTime.Now
                    };

                    _context.MessageReactions.Add(newReaction);
                    await _context.SaveChangesAsync();
                }

                var updatedReactions = await _context.MessageReactions
                    .Where(r => r.MessageId == request.MessageId)
                    .Include(r => r.User)
                    .Select(r => new
                    {
                        reactionType = r.ReactionType,
                        userId = r.UserId,
                        userName = r.User.GetDisplayName()
                    })
                    .ToListAsync();

                var otherUserId = message.SenderId == currentUser.Id ? message.ReceiverId : message.SenderId;

                await _hubContext.Clients.User(currentUser.Id)
                    .SendAsync("UpdateReactions", request.MessageId, updatedReactions);

                await _hubContext.Clients.User(otherUserId)
                    .SendAsync("UpdateReactions", request.MessageId, updatedReactions);

                return Json(new { success = true, reactions = updatedReactions });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding reaction");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> ValidateSticker([FromBody] ValidateStickerRequest request)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { success = false, error = "User not authenticated" });
                }

                // Basic URL validation
                if (string.IsNullOrEmpty(request.StickerUrl) || !Uri.IsWellFormedUriString(request.StickerUrl, UriKind.Absolute))
                {
                    return BadRequest(new { success = false, error = "Invalid sticker URL" });
                }

                // Check if URL is from allowed domains
                var allowedDomains = new[] { "tenor.com", "giphy.com", "media.tenor.com" };
                var uri = new Uri(request.StickerUrl);
                var isAllowedDomain = allowedDomains.Any(domain => uri.Host.Contains(domain));

                if (!isAllowedDomain)
                {
                    return BadRequest(new { success = false, error = "Sticker domain not allowed" });
                }

                return Json(new { success = true, message = "Sticker URL is valid" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating sticker");
                return StatusCode(500, new { success = false, error = "Validation failed" });
            }
        }

        // Thêm vào ChatController.cs
        [HttpGet]
        public async Task<IActionResult> GetLocationMessages(string userId)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Json(new { error = "Not authenticated", success = false });
                }

                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { error = "Invalid user ID", success = false });
                }

                var targetUser = await _userManager.FindByIdAsync(userId);
                if (targetUser == null)
                {
                    return Json(new { error = "Target user not found", success = false });
                }

                var locationMessages = await _context.LocationMessages
                    .Where(m => (m.SenderId == currentUser.Id && m.ReceiverId == userId) ||
                               (m.SenderId == userId && m.ReceiverId == currentUser.Id))
                    .OrderBy(m => m.SentAt)
                    .Select(m => new
                    {
                        id = m.Id,
                        senderId = m.SenderId,
                        senderName = m.Sender.GetDisplayName(),
                        latitude = m.Latitude,
                        longitude = m.Longitude,
                        locationName = m.LocationName,
                        mapImageUrl = m.MapImageUrl,
                        timestamp = m.SentAt,
                        isSender = m.SenderId == currentUser.Id
                    })
                    .ToListAsync();

                return Json(locationMessages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting location messages");
                return Json(new { error = "Server error", success = false });
            }
        }
        // Lấy thiết lập ảnh nền cho một user cụ thể
        [HttpGet]
        public async Task<IActionResult> GetUserChatBackground(string userId)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("GetUserChatBackground: userId is null or empty");
                    return Json(new { success = false, error = "Invalid user ID" });
                }

                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogWarning("GetUserChatBackground: currentUser is null");
                    return Json(new { success = false, error = "User not authenticated" });
                }

                _logger.LogInformation($"GetUserChatBackground: currentUser={currentUser.Id}, targetUser={userId}");

                // FIX: Tìm background theo cặp user (không phụ thuộc thứ tự)
                var chatSettings = await _context.ChatSettings
                    .FirstOrDefaultAsync(s =>
                        (s.UserId == currentUser.Id && s.OtherUserId == userId) ||
                        (s.UserId == userId && s.OtherUserId == currentUser.Id));

                if (chatSettings == null)
                {
                    _logger.LogInformation($"GetUserChatBackground: No settings found, using default");
                    return Json(new { success = true, backgroundImage = "default.jpg" });
                }

                _logger.LogInformation($"GetUserChatBackground: Found settings, background={chatSettings.BackgroundImage}");
                return Json(new { success = true, backgroundImage = chatSettings.BackgroundImage });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting chat background for userId: {userId}");
                return Json(new { success = false, error = ex.Message });
            }
        }
            
        [HttpPost]
        public async Task<IActionResult> SaveUserBackground([FromBody] SaveBackgroundRequest request)
        {
            try
            {
                _logger.LogInformation($"SaveUserBackground: request={request.UserId}, {request.BackgroundImage}");

                if (string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.BackgroundImage))
                {
                    _logger.LogWarning("SaveUserBackground: Invalid parameters");
                    return Json(new { success = false, error = "Invalid parameters" });
                }

                if (request.BackgroundImage.StartsWith("/"))
                {
                    _logger.LogWarning($"SaveUserBackground: Custom backgrounds are no longer supported");
                    return Json(new { success = false, error = "Chỉ hỗ trợ hình nền mẫu" });
                }

                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogWarning("SaveUserBackground: currentUser is null");
                    return Json(new { success = false, error = "User not authenticated" });
                }

                var targetUser = await _userManager.FindByIdAsync(request.UserId);
                if (targetUser == null)
                {
                    _logger.LogWarning($"SaveUserBackground: Target user not found: {request.UserId}");
                    return Json(new { success = false, error = "Target user not found" });
                }

                // FIX: Lưu cho cả 2 chiều
                await UpdateChatSettingsForBothUsers(currentUser.Id, request.UserId, request.BackgroundImage, targetUser.GetDisplayName(), currentUser.GetDisplayName());

                _logger.LogInformation("SaveUserBackground: Successfully saved for both users");
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving user background");
                return Json(new { success = false, error = ex.Message });
            }
        }

        private async Task UpdateChatSettingsForBothUsers(string user1Id, string user2Id, string backgroundImage, string user2Name, string user1Name)
        {
            // Update for user1 -> user2
            var settings1 = await _context.ChatSettings.FirstOrDefaultAsync(s => s.UserId == user1Id && s.OtherUserId == user2Id);
            if (settings1 == null)
            {
                settings1 = new ChatSettings
                {
                    UserId = user1Id,
                    OtherUserId = user2Id,
                    BackgroundImage = backgroundImage,
                    Nickname = user2Name,
                    Theme = "default",
                    LastUpdated = DateTime.Now
                };
                _context.ChatSettings.Add(settings1);
            }
            else
            {
                settings1.BackgroundImage = backgroundImage;
                settings1.LastUpdated = DateTime.Now;
            }

            // Update for user2 -> user1
            var settings2 = await _context.ChatSettings.FirstOrDefaultAsync(s => s.UserId == user2Id && s.OtherUserId == user1Id);
            if (settings2 == null)
            {
                settings2 = new ChatSettings
                {
                    UserId = user2Id,
                    OtherUserId = user1Id,
                    BackgroundImage = backgroundImage,
                    Nickname = user1Name,
                    Theme = "default",
                    LastUpdated = DateTime.Now
                };
                _context.ChatSettings.Add(settings2);
            }
            else
            {
                settings2.BackgroundImage = backgroundImage;
                settings2.LastUpdated = DateTime.Now;
            }

            await _context.SaveChangesAsync();
        }

        // THAY THẾ HÀM ReportMessage TRONG ChatController.cs

        [HttpPost]
        public async Task<IActionResult> ReportMessage([FromBody] ReportMessageRequest request)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Json(new { success = false, error = "User not authenticated" });
                }

                var message = await _context.Messages
                    .Include(m => m.Sender)
                    .FirstOrDefaultAsync(m => m.Id == request.MessageId);

                if (message == null)
                {
                    return Json(new { success = false, error = "Message not found" });
                }

                // Kiểm tra xem đã báo cáo tin nhắn này chưa
                var existingReport = await _context.Reports
                    .FirstOrDefaultAsync(r => r.ReporterId == currentUser.Id && r.ReportedMessageId == request.MessageId);

                if (existingReport != null)
                {
                    return Json(new { success = false, error = "Bạn đã báo cáo tin nhắn này rồi" });
                }

                // Tạo báo cáo mới
                var report = new Report
                {
                    ReporterId = currentUser.Id,
                    ReportedUserId = message.SenderId,
                    ReportedMessageId = request.MessageId,
                    Reason = request.Reason,
                    Description = request.Description, // Thêm mô tả chi tiết
                    Status = "Pending",
                    CreatedAt = DateTime.Now,
                    ReportType = "Message" // Phân loại loại báo cáo
                };

                _context.Reports.Add(report);
                await _context.SaveChangesAsync();

                // Log để admin biết có báo cáo mới
                _logger.LogInformation($"New report created: ID {report.ReportId}, Reporter: {currentUser.Email}, Reported: {message.Sender?.Email}, Reason: {request.Reason}");

                // Gửi thông báo real-time đến admin (nếu cần)
                await NotifyAdminNewReport(report);

                return Json(new
                {
                    success = true,
                    message = "Báo cáo đã được gửi thành công. Chúng tôi sẽ xem xét trong thời gian sớm nhất.",
                    reportId = report.ReportId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reporting message");
                return Json(new { success = false, error = "Lỗi khi gửi báo cáo: " + ex.Message });
            }
        }

        // Thêm method helper
        private async Task NotifyAdminNewReport(Report report)
        {
            try
            {
                // Lấy danh sách admin online
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
                var adminIds = adminUsers.Select(u => u.Id).ToList();

                // Gửi SignalR notification đến admin
                await _hubContext.Clients.Users(adminIds).SendAsync("NewReportReceived", new
                {
                    reportId = report.ReportId,
                    reason = report.Reason,
                    reporterEmail = report.Reporter?.Email,
                    createdAt = report.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error notifying admin about new report");
            }
        }

        // CẬP NHẬT REQUEST MODEL
        public class ReportMessageRequest
        {
            public int MessageId { get; set; }
            public string Reason { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty; // Thêm mô tả chi tiết
        }



        // Thêm class này vào phần Request models
        public class SaveBackgroundRequest
        {
            public string UserId { get; set; }
            public string BackgroundImage { get; set; }
        }


        public class ValidateStickerRequest
        {
            public string StickerUrl { get; set; } = string.Empty;
        }

        // Thêm vào phần Request models (cùng với RecallMessageRequest, PinMessageRequest)
        public class ReactionRequest
        {
            public int MessageId { get; set; }
            public string ReactionType { get; set; } = string.Empty;
        }

        // Request models
        public class RecallMessageRequest
        {
            public int MessageId { get; set; }
            public string RecallType { get; set; } = string.Empty;
        }

        public class PinMessageRequest
        {
            public int MessageId { get; set; }
            public bool Pin { get; set; }
        }


    }
}