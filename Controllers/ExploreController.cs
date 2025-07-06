using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using webchat.Models;

namespace webchat.Controllers
{
    [Authorize]
    public class ExploreController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ExploreController> _logger;

        public ExploreController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<ExploreController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        /// <summary>
        /// Trang chính Explore - hiển thị danh sách người dùng để kết bạn
        /// File location: Controllers/ExploreController.cs
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> Index()
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return RedirectToAction("Login", "Account");
                }

                // Kiểm tra xem user hiện tại đã hoàn thành profile chưa
                var currentUserProfile = await _context.UserProfiles
                    .FirstOrDefaultAsync(p => p.UserId == currentUser.Id);

                if (currentUserProfile == null || !currentUserProfile.IsProfileComplete)
                {
                    TempData["Message"] = "Bạn cần hoàn thành hồ sơ trước khi khám phá!";
                    return RedirectToAction("Index", "CompleteRegistration");
                }

                // Lấy danh sách user profiles để hiển thị (loại trừ user hiện tại)
                var usersToExplore = await GetUsersToExplore(currentUser.Id);

                ViewBag.CurrentUserId = currentUser.Id;
                ViewBag.CurrentUserProfile = currentUserProfile;

                return View(usersToExplore);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading explore page");
                TempData["Error"] = "Có lỗi xảy ra khi tải trang khám phá.";
                return RedirectToAction("Index", "Home");
            }
        }

        /// <summary>
        /// Lấy danh sách users để hiển thị trên trang explore
        /// File location: Controllers/ExploreController.cs
        /// </summary>
        private async Task<List<UserProfile>> GetUsersToExplore(string currentUserId)
        {
            return await _context.UserProfiles
                .Include(p => p.User)
                .Where(p => p.UserId != currentUserId &&
                           p.IsProfileComplete == true &&
                           p.IsVisible == true &&
                           p.User.IsActive == true)
                .OrderByDescending(p => p.UpdatedAt)
                .Take(20) // Lấy 20 profiles gần nhất
                .ToListAsync();
        }

        /// <summary>
        /// API để lấy thêm users khi cần load more
        /// File location: Controllers/ExploreController.cs
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMoreUsers(int skip = 0, int take = 10)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Json(new { success = false, message = "Unauthorized" });
                }

                var users = await _context.UserProfiles
                    .Include(p => p.User)
                    .Where(p => p.UserId != currentUser.Id &&
                               p.IsProfileComplete == true &&
                               p.IsVisible == true &&
                               p.User.IsActive == true)
                    .OrderByDescending(p => p.UpdatedAt)
                    .Skip(skip)
                    .Take(take)
                    .Select(p => new
                    {
                        id = p.Id,
                        userId = p.UserId,
                        fullName = p.User.FullName ?? "Unknown",
                        age = p.DateOfBirth.HasValue ? 
                            (int?)(DateTime.Now.Year - p.DateOfBirth.Value.Year) : null,
                        bio = p.Bio,
                        location = p.Location,
                        interests = p.Interests,
                        profilePictureUrl = p.ProfilePictureUrl,
                        photoUrls = p.PhotoUrls,
                        gender = p.Gender,
                        fashionStyle = p.FashionStyle,
                        relationshipGoal = p.RelationshipGoal
                    })
                    .ToListAsync();

                return Json(new { success = true, users = users });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting more users");
                return Json(new { success = false, message = "Error loading users" });
            }
        }

        /// <summary>
        /// Thả tim cho user
        /// File location: Controllers/ExploreController.cs
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> LikeUser([FromBody] LikeUserRequest request)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Json(new { success = false, message = "Unauthorized" });
                }

                var targetProfile = await _context.UserProfiles
                    .FirstOrDefaultAsync(p => p.UserId == request.UserId);

                if (targetProfile == null)
                {
                    return Json(new { success = false, message = "User not found" });
                }

                // Tăng like count
                targetProfile.LikeCount++;
                await _context.SaveChangesAsync();

                // TODO: Thêm logic lưu lại interaction (like/dislike) vào database
                // để tránh hiển thị lại user đã tương tác

                _logger.LogInformation($"User {currentUser.Id} liked user {request.UserId}");

                return Json(new { success = true, message = "Đã thả tim!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error liking user");
                return Json(new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Gửi tin nhắn nhanh cho user
        /// File location: Controllers/ExploreController.cs
        /// </summary>
        /// <summary>
        /// Gửi tin nhắn nhanh cho user
        /// File location: Controllers/ExploreController.cs
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> SendQuickMessage([FromBody] QuickMessageRequest request)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Json(new { success = false, message = "Unauthorized" });
                }

                if (string.IsNullOrWhiteSpace(request.Message))
                {
                    return Json(new { success = false, message = "Tin nhắn không được trống" });
                }

                // Kiểm tra user tồn tại
                var targetUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == request.UserId);

                if (targetUser == null)
                {
                    return Json(new { success = false, message = "Không tìm thấy người dùng" });
                }

                // Tạo tin nhắn mới
                var message = new Message
                {
                    SenderId = currentUser.Id,
                    ReceiverId = request.UserId,
                    Content = request.Message.Trim(),
                    MessageType = "text",
                    SentAt = DateTime.Now,
                    IsRead = false
                };

                _context.Messages.Add(message);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Quick message sent from {currentUser.Id} to {request.UserId}");

                // CÁCH 1: Chỉ định rõ ràng area = "" và bao gồm userName
                var encodedUserName = Uri.EscapeDataString(targetUser.GetDisplayName());
                var chatUrl = Url.Action("Index", "Chat", new
                {
                    area = "",
                    userId = request.UserId,
                    userName = encodedUserName
                });

                // CÁCH 2: Tạo URL thủ công (backup option)
                if (string.IsNullOrEmpty(chatUrl))
                {
                    chatUrl = $"/Chat?userId={request.UserId}&userName={encodedUserName}";
                }

                // CÁCH 3: Sử dụng absolute URL nếu cần
                // var chatUrl = $"{Request.Scheme}://{Request.Host}/Chat?userId={request.UserId}&userName={encodedUserName}";

                return Json(new
                {
                    success = true,
                    message = "Tin nhắn đã được gửi!",
                    chatUrl = chatUrl
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending quick message");
                return Json(new { success = false, message = "Có lỗi xảy ra khi gửi tin nhắn" });
            }
        }

        /// <summary>
        /// Tăng view count khi user xem profile
        /// File location: Controllers/ExploreController.cs
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> IncreaseViewCount([FromBody] ViewUserRequest request)
        {
            try
            {
                var profile = await _context.UserProfiles
                    .FirstOrDefaultAsync(p => p.UserId == request.UserId);

                if (profile != null)
                {
                    profile.ViewCount++;
                    await _context.SaveChangesAsync();
                }

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error increasing view count");
                return Json(new { success = false });
            }
        }

        /// <summary>
        /// Lấy chi tiết profile của user
        /// File location: Controllers/ExploreController.cs
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetUserDetail(string userId)
        {
            try
            {
                var profile = await _context.UserProfiles
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.UserId == userId);

                if (profile == null)
                {
                    return Json(new { success = false, message = "User not found" });
                }

                var userDetail = new
                {
                    id = profile.Id,
                    userId = profile.UserId,
                    fullName = profile.User.FullName ?? "Unknown",
                    bio = profile.Bio,
                    age = profile.DateOfBirth.HasValue ? 
                        (int?)(DateTime.Now.Year - profile.DateOfBirth.Value.Year) : null,
                    location = profile.Location,
                    province = profile.Province,
                    district = profile.District,
                    interests = !string.IsNullOrEmpty(profile.Interests) ? 
                        JsonConvert.DeserializeObject<List<string>>(profile.Interests) : new List<string>(),
                    gender = profile.Gender,
                    fashionStyle = profile.FashionStyle,
                    personality = !string.IsNullOrEmpty(profile.Personality) ? 
                        JsonConvert.DeserializeObject<List<string>>(profile.Personality) : new List<string>(),
                    relationshipGoal = profile.RelationshipGoal,
                    idealPartner = profile.IdealPartner,
                    profilePictureUrl = profile.ProfilePictureUrl,
                    photoUrls = !string.IsNullOrEmpty(profile.PhotoUrls) ? 
                        JsonConvert.DeserializeObject<List<string>>(profile.PhotoUrls) : new List<string>(),
                    viewCount = profile.ViewCount,
                    likeCount = profile.LikeCount
                };

                return Json(new { success = true, user = userDetail });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user detail");
                return Json(new { success = false, message = "Error loading user detail" });
            }
        }
    }

    // Request models để nhận data từ frontend
    public class LikeUserRequest
    {
        public string UserId { get; set; }
    }

    public class QuickMessageRequest
    {
        public string UserId { get; set; }
        public string Message { get; set; }
    }

    public class ViewUserRequest
    {
        public string UserId { get; set; }
    }
}