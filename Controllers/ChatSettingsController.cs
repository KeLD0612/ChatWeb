using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO;
using webchat.Models;

namespace webchat.Controllers
{
    [Authorize]
    public class ChatSettingsController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ChatSettingsController> _logger;
        private readonly IWebHostEnvironment _environment;

        public ChatSettingsController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<ChatSettingsController> logger,
            IWebHostEnvironment environment)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
            _environment = environment;
        }

        [HttpGet]
        public async Task<IActionResult> GetChatSettings(string otherUserId)
        {
            try
            {
                // Log cho debug
                _logger.LogInformation($"=== GetChatSettings START ===");
                _logger.LogInformation($"Received otherUserId: '{otherUserId}'");

                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogError("User not authenticated");
                    return Json(new { success = false, error = "User not authenticated" });
                }

                _logger.LogInformation($"Current user: '{currentUser.Id}'");

                if (string.IsNullOrEmpty(otherUserId))
                {
                    _logger.LogError("Invalid user ID: null or empty");
                    return Json(new { success = false, error = "Invalid user ID" });
                }

                // Kiểm tra xem người dùng đích có tồn tại không
                var otherUser = await _userManager.FindByIdAsync(otherUserId);
                if (otherUser == null)
                {
                    _logger.LogWarning($"Other user not found: '{otherUserId}'");
                    return Json(new { success = false, error = "User not found" });
                }

                // Tìm thiết lập chat cho người dùng hiện tại và người đang chat
                var chatSettings = await _context.ChatSettings
                    .FirstOrDefaultAsync(s => s.UserId == currentUser.Id && s.OtherUserId == otherUserId);

                if (chatSettings == null)
                {
                    // Lấy tên hiển thị từ người dùng đích
                    var otherUserName = otherUser.GetDisplayName();

                    _logger.LogInformation($"Creating default settings with nickname: '{otherUserName}'");

                    // Trả về thiết lập mặc định nếu chưa có
                    return Json(new
                    {
                        success = true,
                        settings = new
                        {
                            backgroundImage = "default.jpg",
                            nickname = otherUserName,
                            theme = "default"
                        }
                    });
                }

                _logger.LogInformation($"Found settings: Background={chatSettings.BackgroundImage}, Nickname={chatSettings.Nickname}");

                return Json(new
                {
                    success = true,
                    settings = new
                    {
                        backgroundImage = chatSettings.BackgroundImage,
                        nickname = chatSettings.Nickname,
                        theme = chatSettings.Theme
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat settings");
                return Json(new { success = false, error = "Server error: " + ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetBackgroundTemplates()
        {
            try
            {
                _logger.LogInformation("=== GetBackgroundTemplates START ===");

                var backgroundsPath = Path.Combine(_environment.WebRootPath, "images", "backgrounds");

                if (!Directory.Exists(backgroundsPath))
                {
                    _logger.LogError($"Backgrounds directory not found: {backgroundsPath}");
                    // Tạo thư mục nếu chưa tồn tại
                    Directory.CreateDirectory(backgroundsPath);
                    return Json(new { success = true, backgrounds = new List<string>() });
                }

                var backgroundFiles = Directory.GetFiles(backgroundsPath)
                    .Select(file => Path.GetFileName(file))
                    .Where(file => file.EndsWith(".jpg") || file.EndsWith(".png") || file.EndsWith(".jpeg"))
                    .ToList();

                _logger.LogInformation($"Found {backgroundFiles.Count} background templates");

                return Json(new { success = true, backgrounds = backgroundFiles });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting background templates");
                return Json(new { success = false, error = ex.Message });
            }
        }

  
        [HttpGet]
        public async Task<IActionResult> GetUserChatBackground(string userId)
        {
            try
            {
                _logger.LogInformation("=== GetUserChatBackground START ===");
                _logger.LogInformation($"UserId: {userId}");

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("UserId is null or empty");
                    return Json(new { success = false, error = "Invalid user ID" });
                }

                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogError("Current user is not authenticated");
                    return Json(new { success = false, error = "User not authenticated" });
                }

                _logger.LogInformation($"Current user: {currentUser.Id}, Target user: {userId}");

                // Tìm thiết lập chat cho người dùng hiện tại và người đang chat
                var chatSettings = await _context.ChatSettings
                    .FirstOrDefaultAsync(s => s.UserId == currentUser.Id && s.OtherUserId == userId);

                if (chatSettings == null)
                {
                    _logger.LogInformation($"No settings found, creating default setting with background: default.jpg");

                    // Tự động tạo cài đặt mặc định nếu chưa có
                    var targetUser = await _userManager.FindByIdAsync(userId);
                    string otherUserName = "User";

                    if (targetUser != null)
                    {
                        otherUserName = targetUser.GetDisplayName();
                    }

                    chatSettings = new ChatSettings
                    {
                        UserId = currentUser.Id,
                        OtherUserId = userId,
                        BackgroundImage = "default.jpg",
                        Nickname = otherUserName,
                        Theme = "default",
                        LastUpdated = DateTime.Now
                    };

                    _context.ChatSettings.Add(chatSettings);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Default settings created and saved");

                    return Json(new { success = true, backgroundImage = "default.jpg" });
                }

                _logger.LogInformation($"Found settings, background: {chatSettings.BackgroundImage}");
                return Json(new { success = true, backgroundImage = chatSettings.BackgroundImage });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting chat background");
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateChatBackground([FromBody] UpdateBackgroundRequest request)
        {
            try
            {
                _logger.LogInformation("=== UpdateChatBackground START ===");
                _logger.LogInformation($"Request: OtherUserId={request.OtherUserId}, Background={request.BackgroundImage}");

                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogError("User not authenticated");
                    return Json(new { success = false, error = "User not authenticated" });
                }

                _logger.LogInformation($"Current user: {currentUser.Id}");

                if (string.IsNullOrEmpty(request.OtherUserId))
                {
                    _logger.LogError("Invalid user ID: null or empty");
                    return Json(new { success = false, error = "Invalid user ID" });
                }

                // Kiểm tra người dùng đích có tồn tại không
                var otherUser = await _userManager.FindByIdAsync(request.OtherUserId);
                if (otherUser == null)
                {
                    _logger.LogWarning($"Target user not found: {request.OtherUserId}");
                    return Json(new { success = false, error = "Target user not found" });
                }

                // Kiểm tra file tồn tại
                string filePath = Path.Combine(_environment.WebRootPath, "images", "backgrounds", request.BackgroundImage);
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogError($"Background image not found: {filePath}");
                    return Json(new { success = false, error = "Background image not found" });
                }

                // Tìm hoặc tạo mới ChatSettings
                var chatSettings = await _context.ChatSettings
                    .FirstOrDefaultAsync(s => s.UserId == currentUser.Id && s.OtherUserId == request.OtherUserId);

                if (chatSettings == null)
                {
                    // Lấy tên hiển thị để làm nickname mặc định
                    var otherUserName = otherUser.GetDisplayName();

                    _logger.LogInformation($"Creating new chat settings with nickname: {otherUserName}");

                    chatSettings = new ChatSettings
                    {
                        UserId = currentUser.Id,
                        OtherUserId = request.OtherUserId,
                        BackgroundImage = request.BackgroundImage,
                        Nickname = otherUserName,
                        Theme = "default",
                        LastUpdated = DateTime.Now
                    };

                    _context.ChatSettings.Add(chatSettings);
                }
                else
                {
                    _logger.LogInformation($"Updating existing chat settings ID: {chatSettings.Id}");
                    chatSettings.BackgroundImage = request.BackgroundImage;
                    chatSettings.LastUpdated = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Settings saved successfully");

                return Json(new { success = true, backgroundImage = request.BackgroundImage });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating chat background");
                return Json(new { success = false, error = ex.Message });
            }
        }


        [HttpPost]
        public async Task<IActionResult> UpdateNickname([FromBody] UpdateNicknameRequest request)
        {
            try
            {
                _logger.LogInformation("=== UpdateNickname START ===");
                _logger.LogInformation($"Request: OtherUserId={request.OtherUserId}, Nickname={request.Nickname}");

                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogError("User not authenticated");
                    return Json(new { success = false, error = "User not authenticated" });
                }

                if (string.IsNullOrEmpty(request.OtherUserId))
                {
                    _logger.LogError("Invalid user ID: null or empty");
                    return Json(new { success = false, error = "Invalid user ID" });
                }

                // Kiểm tra người dùng đích có tồn tại không
                var otherUser = await _userManager.FindByIdAsync(request.OtherUserId);
                if (otherUser == null)
                {
                    _logger.LogWarning($"Target user not found: {request.OtherUserId}");
                    return Json(new { success = false, error = "Target user not found" });
                }

                if (string.IsNullOrEmpty(request.Nickname))
                {
                    // Lấy tên mặc định nếu nickname trống
                    request.Nickname = otherUser.GetDisplayName();
                }

                var chatSettings = await _context.ChatSettings
                    .FirstOrDefaultAsync(s => s.UserId == currentUser.Id && s.OtherUserId == request.OtherUserId);

                if (chatSettings == null)
                {
                    chatSettings = new ChatSettings
                    {
                        UserId = currentUser.Id,
                        OtherUserId = request.OtherUserId,
                        Nickname = request.Nickname,
                        BackgroundImage = "default.jpg",
                        Theme = "default",
                        LastUpdated = DateTime.Now
                    };

                    _context.ChatSettings.Add(chatSettings);
                }
                else
                {
                    chatSettings.Nickname = request.Nickname;
                    chatSettings.LastUpdated = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Nickname updated successfully");

                return Json(new { success = true, nickname = request.Nickname });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating nickname");
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

                // Chỉ chấp nhận hình nền mẫu (không bắt đầu bằng /)
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

                // Kiểm tra xem user đích có tồn tại không
                var targetUser = await _userManager.FindByIdAsync(request.UserId);
                if (targetUser == null)
                {
                    _logger.LogWarning($"SaveUserBackground: Target user not found: {request.UserId}");
                    return Json(new { success = false, error = "Target user not found" });
                }

                // Tìm hoặc tạo mới thiết lập chat
                var chatSettings = await _context.ChatSettings
                    .FirstOrDefaultAsync(s => s.UserId == currentUser.Id && s.OtherUserId == request.UserId);

                if (chatSettings == null)
                {
                    _logger.LogInformation($"SaveUserBackground: Creating new settings");
                    chatSettings = new ChatSettings
                    {
                        UserId = currentUser.Id,
                        OtherUserId = request.UserId,
                        BackgroundImage = request.BackgroundImage,
                        Nickname = targetUser.GetDisplayName(),
                        Theme = "default",
                        LastUpdated = DateTime.Now
                    };

                    _context.ChatSettings.Add(chatSettings);
                }
                else
                {
                    _logger.LogInformation($"SaveUserBackground: Updating existing settings");
                    chatSettings.BackgroundImage = request.BackgroundImage;
                    chatSettings.LastUpdated = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("SaveUserBackground: Successfully saved");

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving user background");
                return Json(new { success = false, error = ex.Message });
            }
        }

        // Thêm class này vào phần Request models
        public class SaveBackgroundRequest
        {
            public string UserId { get; set; }
            public string BackgroundImage { get; set; }
        }

        // Request models
        public class UpdateBackgroundRequest
        {
            public string OtherUserId { get; set; }
            public string BackgroundImage { get; set; }
        }

        public class UpdateNicknameRequest
        {
            public string OtherUserId { get; set; }
            public string Nickname { get; set; }
        }
    }
}