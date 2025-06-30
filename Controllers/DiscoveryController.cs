using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Security.Claims;
using webchat.Models;
using webchat.Services;

namespace webchat.Controllers
{
    [Authorize]
    public class DiscoveryController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<DiscoveryController> _logger;
        private readonly IUserService _userService;

        public DiscoveryController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<DiscoveryController> logger,
            IUserService userService
            )
        {
            _context        = context;
            _userManager    = userManager;
            _logger         = logger;
            _userService    = userService;
        }

        /// <summary>
        /// Hiển thị trang khám phá người dùng với giao diện swipe
        /// </summary>
        public async Task<IActionResult> Index(string search)
        {
            _logger.LogInformation("=== DiscoveryController.Index START ===");
            //_logger.LogInformation($"Search parameter: '{search ?? "null"}'");

            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogWarning("Current user is null, redirecting to login");
                    return RedirectToAction("Login", "Account", new { area = "Identity" });
                }

                IQueryable<ApplicationUser> query = _context.Users
                    .Where(u => u.Id != currentUser.Id);

                if (!string.IsNullOrEmpty(search))
                {
                    _logger.LogInformation($"Applying search filter: '{search}'");
                    query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));
                }

                var users = await query
                    .OrderBy(u => u.FullName ?? u.Email)
                    .ToListAsync();

                _logger.LogInformation($"Found {users.Count} users for discovery list");

                ViewBag.CurrentUser = currentUser;
                ViewBag.Search = search ?? string.Empty;

                _logger.LogInformation("=== DiscoveryController.Index END ===");
                return View(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in DiscoveryController.Index");
                ViewBag.CurrentUser = await _userManager.GetUserAsync(User);
                ViewBag.Search = search ?? string.Empty;
                ViewBag.ErrorMessage = "Không thể tải danh sách người dùng: " + ex.Message;
                return View(new List<ApplicationUser>());
            }
        }
        [HttpGet]
        public async Task<IActionResult> DebugUsers()
        {
            try
            {
                var allUsers = await _context.Users
                    .Select(u => new
                    {
                        Id = u.Id,
                        Email = u.Email,
                        DisplayName = u.GetDisplayName(),
                        EmailConfirmed = u.EmailConfirmed,
                        LockoutEnabled = u.LockoutEnabled
                    })
                    .ToListAsync();

                _logger.LogInformation($"Debug: Found {allUsers.Count} users in database");
                return Json(new
                {
                    success = true,
                    totalUsers = allUsers.Count,
                    users = allUsers
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DebugUsers");
                return Json(new { success = false, error = ex.Message });
            }
        }
        /// <summary>
        /// API endpoint để lấy thêm users cho việc swipe
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetUsers(int count = 5)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized();
                }

                var users = await _userService.GetUsersForDiscoveryAsync(currentUserId, count);

                // Chuyển đổi sang format JSON phù hợp cho frontend
                var usersData = users.Select(u => new {
                    id = u.Id,
                    fullName = u.FullName,
                    bio = u.Bio,
                    createdAt = u.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss")
                }).ToList();

                _logger.LogInformation($"API: Returning {usersData.Count} users for discovery");

                return Json(usersData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users for discovery");
                return StatusCode(500, new { error = "Không thể tải danh sách người dùng" });
            }
        }

        /// <summary>
        /// API endpoint để xử lý hành động swipe (like/pass)
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SwipeAction([FromBody] SwipeActionRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized();
                }

                if (request == null || string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.Action))
                {
                    return BadRequest(new { error = "Dữ liệu không hợp lệ" });
                }

                _logger.LogInformation($"User {currentUserId} performed {request.Action} on user {request.UserId}");

                // Lưu hành động swipe
                await _userService.SaveSwipeActionAsync(currentUserId, request.UserId, request.Action);

                // Kiểm tra match nếu là action "like"
                bool isMatch = false;
                object matchedUser = null;

                if (request.Action.ToLower() == "like")
                {
                    isMatch = await _userService.CheckMatchAsync(currentUserId, request.UserId);

                    if (isMatch)
                    {
                        // Tạo match record
                        await _userService.CreateMatchAsync(currentUserId, request.UserId);

                        // Lấy thông tin user được match
                        var user = await _userService.GetUserByIdAsync(request.UserId);
                        matchedUser = new {
                            id = user.Id,
                            fullName = user.FullName
                        };

                        _logger.LogInformation($"Match created between {currentUserId} and {request.UserId}");
                    }
                }

                return Json(new {
                    success = true,
                    isMatch = isMatch,
                    matchedUser = matchedUser
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing swipe action: {request?.Action} on user {request?.UserId}");
                return StatusCode(500, new { error = "Không thể xử lý hành động" });
            }
        }

        /// <summary>
        /// API endpoint để reload toàn bộ danh sách users
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ReloadUsers()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized();
                }

                // Reset discovery state và lấy users mới
                var users = await _userService.GetUsersForDiscoveryAsync(currentUserId, 10, resetState: true);

                var usersData = users.Select(u => new {
                    id = u.Id,
                    fullName = u.FullName,
                    bio = u.Bio,
                    createdAt = u.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss")
                }).ToList();

                _logger.LogInformation($"Reloaded {usersData.Count} users for user {currentUserId}");

                return Json(usersData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reloading users");
                return StatusCode(500, new { error = "Không thể tải lại danh sách" });
            }
        }

        /// <summary>
        /// Lấy thống kê swipe của user hiện tại
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetSwipeStats()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized();
                }

                var stats = await _userService.GetSwipeStatsAsync(currentUserId);

                return Json(new {
                    totalSwipes = stats.TotalSwipes,
                    likes = stats.Likes,
                    passes = stats.Passes,
                    matches = stats.Matches,
                    likeRate = stats.TotalSwipes > 0 ? (double)stats.Likes / stats.TotalSwipes * 100 : 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting swipe stats");
                return StatusCode(500, new { error = "Không thể lấy thống kê" });
            }
        }

        /// <summary>
        /// Lấy danh sách matches của user
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMatches()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized();
                }

                var matches = await _userService.GetMatchesAsync(currentUserId);

                var matchesData = matches.Select(m => new {
                    id = m.MatchId,
                    user = new {
                        id = m.UserId2,
                        fullName = m.User2.FullName,
                        bio = m.User2.Bio
                    },
                    createdAt = m.MatchedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                    isNewMatch = (DateTime.Now - m.MatchedAt).TotalDays < 1
                }).ToList();

                return Json(matchesData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting matches");
                return StatusCode(500, new { error = "Không thể lấy danh sách match" });
            }
        }

        /// <summary>
        /// Undo hành động swipe cuối cùng (premium feature)
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UndoLastSwipe()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized();
                }

                // Kiểm tra quyền premium của user
                var canUndo = await _userService.CanUndoSwipeAsync(currentUserId);
                if (!canUndo)
                {
                    return BadRequest(new { error = "Tính năng này chỉ dành cho thành viên premium" });
                }

                var undoResult = await _userService.UndoLastSwipeAsync(currentUserId);

                if (undoResult.Success)
                {
                    return Json(new {
                        success = true,
                        undoedUser = new {
                            id = undoResult.UndoedUser.Id,
                            fullName = undoResult.UndoedUser.FullName,
                            bio = undoResult.UndoedUser.Bio,
                            createdAt = undoResult.UndoedUser.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss")
                        }
                    });
                }
                else
                {
                    return BadRequest(new { error = undoResult.ErrorMessage });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error undoing last swipe");
                return StatusCode(500, new { error = "Không thể hoàn tác" });
            }
        }

        /// <summary>
        /// Lấy user ID hiện tại từ claims
        /// </summary>
        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }

    /// <summary>
    /// Model cho request swipe action
    /// </summary>
    public class SwipeActionRequest
    {
        public string UserId { get; set; }
        public string Action { get; set; } // "like" hoặc "pass"
    }

    /// <summary>
    /// Model cho response của undo action
    /// </summary>
    public class UndoSwipeResult
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
        public dynamic UndoedUser { get; set; }
    }

    /// <summary>
    /// Model cho thống kê swipe
    /// </summary>
    public class SwipeStats
    {
        public int TotalSwipes { get; set; }
        public int Likes { get; set; }
        public int Passes { get; set; }
        public int Matches { get; set; }
    }
}
