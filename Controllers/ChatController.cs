using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webchat.Models;

namespace webchat.Controllers
{
    [Authorize]
    public class ChatController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<ChatController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<IActionResult> Index(string userId = null, string userName = null)
        {
            _logger.LogInformation($"=== ChatController.Index called with userId: {userId}, userName: {userName} ===");

            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogWarning("Current user is null, redirecting to login");
                    return RedirectToAction("Login", "Account", new { area = "Identity" });
                }

                _logger.LogInformation($"Current user: {currentUser.Email} (ID: {currentUser.Id})");

                // Lấy danh sách users
                var users = await _context.Users
                    .Where(u => u.Id != currentUser.Id)
                    .OrderBy(u => u.FullName ?? u.Email)
                    .ToListAsync();

                _logger.LogInformation($"Found {users.Count} users for chat list");

                // Truyền thông tin user được chọn từ URL
                ViewBag.CurrentUser = currentUser;
                ViewBag.SelectedUserId = userId ?? string.Empty;
                ViewBag.SelectedUserName = !string.IsNullOrEmpty(userName) ? Uri.UnescapeDataString(userName) : string.Empty;

                if (!string.IsNullOrEmpty(userId))
                {
                    _logger.LogInformation($"Auto-selecting user: {ViewBag.SelectedUserName} (ID: {ViewBag.SelectedUserId})");
                }

                return View(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading chat page");

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

            var targetUser = await _userManager.FindByIdAsync(userId);
            if (targetUser == null)
            {
                _logger.LogWarning($"Target user not found: {userId}");
                return RedirectToAction("Index");
            }

            _logger.LogInformation($"Starting chat with user: {targetUser.Email}");

            return RedirectToAction("Index", new
            {
                userId = userId,
                userName = Uri.EscapeDataString(targetUser.FullName ?? targetUser.Email ?? "Unknown User")
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetMessages(string userId)
        {
            _logger.LogInformation($"GetMessages called for userId: {userId}");

            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(new { error = "Invalid user ID" });
                }

                // Lấy messages từ database
                var messages = await _context.Messages
                    .Include(m => m.Sender)
                    .Where(m => (m.SenderId == currentUser.Id && m.ReceiverId == userId) ||
                               (m.SenderId == userId && m.ReceiverId == currentUser.Id))
                    .OrderBy(m => m.SentAt)
                    .ToListAsync();

                _logger.LogInformation($"Retrieved {messages.Count} messages between users");

                var result = messages.Select(m => new {
                    senderId = m.SenderId,
                    senderName = m.Sender.FullName ?? m.Sender.Email ?? "Unknown User",
                    content = m.Content,
                    timestamp = m.SentAt,
                    isRead = m.IsRead
                }).ToList();

                return Json(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving messages for user {UserId}", userId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}
