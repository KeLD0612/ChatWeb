// Areas/Admin/Controllers/UserManagementController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webchat.Models;

namespace webchat.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Roles = "Admin")]
    public class UserManagementController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<UserManagementController> _logger;

        public UserManagementController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<UserManagementController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: Admin/UserManagement
        public async Task<IActionResult> Index(string searchString, string sortOrder, int page = 1)
        {
            ViewBag.CurrentSort = sortOrder;
            ViewBag.NameSortParm = String.IsNullOrEmpty(sortOrder) ? "name_desc" : "";
            ViewBag.DateSortParm = sortOrder == "Date" ? "date_desc" : "Date";
            ViewBag.CurrentFilter = searchString;

            var users = from u in _context.Users select u;

            if (!String.IsNullOrEmpty(searchString))
            {
                users = users.Where(u => u.FullName.Contains(searchString) || u.Email.Contains(searchString));
            }

            switch (sortOrder)
            {
                case "name_desc":
                    users = users.OrderByDescending(u => u.FullName);
                    break;
                case "Date":
                    users = users.OrderBy(u => u.CreatedAt);
                    break;
                case "date_desc":
                    users = users.OrderByDescending(u => u.CreatedAt);
                    break;
                default:
                    users = users.OrderBy(u => u.FullName);
                    break;
            }

            int pageSize = 10;
            var totalUsers = await users.CountAsync();
            var paginatedUsers = await users
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            ViewBag.TotalPages = (int)Math.Ceiling(totalUsers / (double)pageSize);
            ViewBag.CurrentPage = page;
            ViewBag.TotalUsers = totalUsers;

            return View(paginatedUsers);
        }

        // GET: Admin/UserManagement/Details/5
        public async Task<IActionResult> Details(string id)
        {
            if (id == null) return NotFound();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound();

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);
            ViewBag.UserRoles = roles;

            // Get user statistics
            ViewBag.MessagesSent = await _context.Messages.CountAsync(m => m.SenderId == id);
            ViewBag.MessagesReceived = await _context.Messages.CountAsync(m => m.ReceiverId == id);
            ViewBag.LikesGiven = await _context.Likes.CountAsync(l => l.LikerId == id);
            ViewBag.LikesReceived = await _context.Likes.CountAsync(l => l.LikedUserId == id);

            return View(user);
        }

        // POST: Admin/UserManagement/ToggleStatus
        [HttpPost]
        public async Task<IActionResult> ToggleStatus(string id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null) return NotFound();

                user.IsActive = !user.IsActive;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"User {user.Email} status changed to {(user.IsActive ? "Active" : "Inactive")}");

                return Json(new { success = true, isActive = user.IsActive });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling user status");
                return Json(new { success = false, message = "Error occurred" });
            }
        }

        // Areas/Admin/Controllers/UserManagementController.cs
        [HttpPost]
        public async Task<IActionResult> Delete(string id)
        {
            // Kiểm tra ID hợp lệ
            if (string.IsNullOrEmpty(id))
            {
                return Json(new { success = false, message = "ID không hợp lệ" });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Tìm user theo ID duy nhất
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
                if (user == null)
                {
                    return Json(new { success = false, message = "Không tìm thấy user với ID này" });
                }

                // Bảo vệ tài khoản Admin
                if (await _userManager.IsInRoleAsync(user, "Admin"))
                {
                    return Json(new { success = false, message = "Không thể xóa tài khoản Admin" });
                }

                _logger.LogInformation($"Bắt đầu xóa user: {user.Email} (ID: {id})");

                // XÓA DỮ LIỆU LIÊN QUAN THEO THỨ TỰ ĐÚNG

                // 1. Xóa CallRecords (nếu có bảng này)
                var callRecordsCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM CallRecords WHERE CallerId = {0} OR ReceiverId = {0}", id);
                _logger.LogInformation($"Đã xóa {callRecordsCount} call records");

                // 2. Xóa Reports
                var reportsCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM Reports WHERE ReporterId = {0} OR ReportedUserId = {0}", id);
                _logger.LogInformation($"Đã xóa {reportsCount} reports");

                // 3. Xóa Matches
                var matchesCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM Matches WHERE UserId1 = {0} OR UserId2 = {0}", id);
                _logger.LogInformation($"Đã xóa {matchesCount} matches");

                // 4. Xóa Likes
                var likesCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM Likes WHERE LikerId = {0} OR LikedUserId = {0}", id);
                _logger.LogInformation($"Đã xóa {likesCount} likes");

                // 5. Xóa Messages
                var messagesCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM Messages WHERE SenderId = {0} OR ReceiverId = {0}", id);
                _logger.LogInformation($"Đã xóa {messagesCount} messages");

                // 6. Xóa MediaFiles (nếu có)
                var mediaFilesCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM MediaFiles WHERE UserId = {0}", id);
                _logger.LogInformation($"Đã xóa {mediaFilesCount} media files");

                // 7. Xóa UserProfile (nếu có)
                var userProfileCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM UserProfiles WHERE UserId = {0}", id);
                _logger.LogInformation($"Đã xóa {userProfileCount} user profiles");

                // 8. Xóa User Roles
                var userRolesCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM AspNetUserRoles WHERE UserId = {0}", id);
                _logger.LogInformation($"Đã xóa {userRolesCount} user roles");

                // 9. Xóa User Claims (nếu có)
                var userClaimsCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM AspNetUserClaims WHERE UserId = {0}", id);
                _logger.LogInformation($"Đã xóa {userClaimsCount} user claims");

                // 10. Xóa User Logins (nếu có)
                var userLoginsCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM AspNetUserLogins WHERE UserId = {0}", id);
                _logger.LogInformation($"Đã xóa {userLoginsCount} user logins");

                // 11. Xóa User Tokens (nếu có)
                var userTokensCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM AspNetUserTokens WHERE UserId = {0}", id);
                _logger.LogInformation($"Đã xóa {userTokensCount} user tokens");

                // 12. Cuối cùng xóa User chính
                var userDeleteCount = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM AspNetUsers WHERE Id = {0}", id);

                if (userDeleteCount == 0)
                {
                    throw new Exception("Không thể xóa user từ bảng AspNetUsers");
                }

                // Commit transaction
                await transaction.CommitAsync();

                _logger.LogInformation($"✅ Đã xóa thành công user {user.Email} (ID: {id}) và tất cả dữ liệu liên quan");

                return Json(new
                {
                    success = true,
                    message = $"Đã xóa thành công user '{user.Email}' và tất cả dữ liệu liên quan",
                    deletedUserId = id
                });
            }
            catch (Exception ex)
            {
                // Rollback transaction
                await transaction.RollbackAsync();

                _logger.LogError(ex, $"❌ Lỗi khi xóa user ID: {id}. Chi tiết: {ex.Message}");

                return Json(new
                {
                    success = false,
                    message = $"Lỗi khi xóa user: {ex.Message}",
                    errorDetails = ex.InnerException?.Message
                });
            }
        }


        // GET: Admin/UserManagement/GetStats
        [HttpGet]
        public async Task<IActionResult> GetStats()
        {
            var stats = new
            {
                TotalUsers = await _context.Users.CountAsync(),
                ActiveUsers = await _context.Users.CountAsync(u => u.IsActive),
                InactiveUsers = await _context.Users.CountAsync(u => !u.IsActive),
                NewUsersThisMonth = await _context.Users.CountAsync(u => u.CreatedAt.Month == DateTime.Now.Month),
                AdminUsers = await _userManager.GetUsersInRoleAsync("Admin"),
                RegularUsers = await _userManager.GetUsersInRoleAsync("User")
            };

            return Json(stats);
        }
    }
}
