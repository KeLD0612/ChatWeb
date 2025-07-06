using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webchat.Models;

namespace webchat.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Roles = "Admin")]
    public class ReportManagementController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ReportManagementController> _logger;

        public ReportManagementController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<ReportManagementController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: Danh sách reports
        public async Task<IActionResult> Index(string status = "all", string searchString = "", int page = 1)
        {
            var reports = _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReportedUser)
                .Include(r => r.ReportedMessage)
                .ThenInclude(m => m.Sender)
                .AsQueryable();

            // Filter by status
            if (status != "all")
            {
                reports = reports.Where(r => r.Status.ToLower() == status.ToLower());
            }

            // Search functionality
            if (!string.IsNullOrEmpty(searchString))
            {
                reports = reports.Where(r =>
                    (r.Reporter.FullName != null && r.Reporter.FullName.Contains(searchString)) ||
                    (r.Reporter.Email != null && r.Reporter.Email.Contains(searchString)) ||
                    (r.ReportedUser.FullName != null && r.ReportedUser.FullName.Contains(searchString)) ||
                    (r.ReportedUser.Email != null && r.ReportedUser.Email.Contains(searchString)) ||
                    r.Reason.Contains(searchString));
            }

            ViewBag.CurrentStatus = status;
            ViewBag.SearchString = searchString;
            ViewBag.PendingCount = await _context.Reports.CountAsync(r => r.Status == "Pending");
            ViewBag.ResolvedCount = await _context.Reports.CountAsync(r => r.Status == "Resolved");
            ViewBag.RejectedCount = await _context.Reports.CountAsync(r => r.Status == "Rejected");

            int pageSize = 15;
            var totalReports = await reports.CountAsync();
            var paginatedReports = await reports
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            ViewBag.TotalPages = (int)Math.Ceiling(totalReports / (double)pageSize);
            ViewBag.CurrentPage = page;
            ViewBag.TotalReports = totalReports;

            return View(paginatedReports);
        }

        // GET: Chi tiết report
        public async Task<IActionResult> Details(int id)
        {
            _logger.LogInformation($"=== Details called with id: {id} ===");

            var report = await _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReportedUser)
                .Include(r => r.ReportedMessage)
                .ThenInclude(m => m.Sender)
                .Include(r => r.ReportedMessage)
                .ThenInclude(m => m.Receiver)
                .FirstOrDefaultAsync(r => r.ReportId == id);

            _logger.LogInformation($"Report found: {report != null}");

            if (report == null)
            {
                _logger.LogWarning($"Report with id {id} not found");
                return NotFound();
            }

            // Lấy lịch sử reports của user này
            ViewBag.UserReportHistory = await _context.Reports
                .Include(r => r.Reporter)
                .Where(r => r.ReportedUserId == report.ReportedUserId && r.ReportId != id)
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .ToListAsync();

            // Lấy context messages (tin nhắn trước và sau tin nhắn bị báo cáo)
            if (report.ReportedMessage != null)
            {
                var contextMessages = await _context.Messages
                    .Include(m => m.Sender)
                    .Where(m =>
                        ((m.SenderId == report.ReportedMessage.SenderId && m.ReceiverId == report.ReportedMessage.ReceiverId) ||
                         (m.SenderId == report.ReportedMessage.ReceiverId && m.ReceiverId == report.ReportedMessage.SenderId)) &&
                        m.SentAt >= report.ReportedMessage.SentAt.AddMinutes(-30) &&
                        m.SentAt <= report.ReportedMessage.SentAt.AddMinutes(30))
                    .OrderBy(m => m.SentAt)
                    .ToListAsync();

                ViewBag.ContextMessages = contextMessages;
            }

            // FIXED: Tạo list các object thông thường thay vì anonymous types
            var templates = new List<object>();
            templates.Add(new { Id = 1, Title = "Cảnh báo nội dung không phù hợp", Content = "Nội dung của bạn vi phạm quy tắc cộng đồng. Vui lòng tuân thủ các quy định." });
            templates.Add(new { Id = 2, Title = "Cảnh báo ngôn từ không phù hợp", Content = "Ngôn từ của bạn không phù hợp với tiêu chuẩn cộng đồng. Hãy tôn trọng người khác." });
            templates.Add(new { Id = 3, Title = "Cảnh báo spam", Content = "Hành vi spam của bạn đã bị phát hiện. Vui lòng ngừng gửi tin nhắn không mong muốn." });
            templates.Add(new { Id = 4, Title = "Cảnh báo quấy rối", Content = "Hành vi quấy rối không được chấp nhận. Đây là cảnh báo cuối cùng trước khi bị khóa tài khoản." });
            templates.Add(new { Id = 5, Title = "Vi phạm nghiêm trọng", Content = "Hành vi của bạn vi phạm nghiêm trọng quy tắc cộng đồng và có thể dẫn đến việc khóa tài khoản." });
            ViewBag.ResponseTemplates = templates;

            return View(report);
        }

        // POST: Xử lý report
        [HttpPost]
        public async Task<IActionResult> ProcessReport([FromBody] ProcessReportRequest request)
        {
            try
            {
                _logger.LogInformation($"Processing report {request.Id} with action: {request.Action}");

                var report = await _context.Reports.FindAsync(request.Id);
                if (report == null)
                {
                    return Json(new { success = false, message = "Report không tồn tại" });
                }

                var currentAdmin = await _userManager.GetUserAsync(User);
                string responseMessage = "";

                switch (request.Action.ToLower())
                {
                    case "warning":
                        report.Status = "Resolved";
                        report.AdminNote = request.AdminNote;
                        report.ProcessedAt = DateTime.Now;
                        report.ProcessedBy = currentAdmin?.Id;

                        // Tạo cảnh báo cho user
                        await CreateUserWarning(report.ReportedUserId, request.AdminNote, report.ReportId);
                        responseMessage = "Đã gửi cảnh báo cho người dùng";
                        break;

                    case "reject":
                        report.Status = "Rejected";
                        report.AdminNote = request.AdminNote;
                        report.ProcessedAt = DateTime.Now;
                        report.ProcessedBy = currentAdmin?.Id;
                        responseMessage = "Đã từ chối report";
                        break;

                    case "ban_user_temporary":
                        report.Status = "Resolved";
                        report.AdminNote = request.AdminNote;
                        report.ProcessedAt = DateTime.Now;
                        report.ProcessedBy = currentAdmin?.Id;

                        // Ban tạm thời
                        await BanUser(report.ReportedUserId, request.BanDuration ?? 7, request.AdminNote, false);
                        responseMessage = $"Đã ban tạm thời người dùng {request.BanDuration ?? 7} ngày";
                        break;

                    case "ban_user_permanent":
                        report.Status = "Resolved";
                        report.AdminNote = request.AdminNote;
                        report.ProcessedAt = DateTime.Now;
                        report.ProcessedBy = currentAdmin?.Id;

                        // Ban vĩnh viễn
                        await BanUser(report.ReportedUserId, null, request.AdminNote, true);
                        responseMessage = "Đã ban vĩnh viễn người dùng";
                        break;

                    case "delete_message":
                        if (report.ReportedMessageId.HasValue)
                        {
                            var message = await _context.Messages.FindAsync(report.ReportedMessageId.Value);
                            if (message != null)
                            {
                                message.IsDeleted = true;
                                message.DeletedAt = DateTime.Now;
                                message.DeletedBy = currentAdmin?.Id;
                            }
                        }
                        report.Status = "Resolved";
                        report.AdminNote = request.AdminNote;
                        report.ProcessedAt = DateTime.Now;
                        report.ProcessedBy = currentAdmin?.Id;
                        responseMessage = "Đã xóa tin nhắn và giải quyết report";
                        break;

                    default:
                        return Json(new { success = false, message = "Hành động không hợp lệ" });
                }

                await _context.SaveChangesAsync();

                // Log admin action
                _logger.LogInformation($"Admin {currentAdmin?.Email} processed report {request.Id}: {request.Action} - {request.AdminNote}");

                return Json(new { success = true, message = responseMessage, newStatus = report.Status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing report {request.Id}");
                return Json(new { success = false, message = "Lỗi xử lý report: " + ex.Message });
            }
        }

        // GET: Thống kê reports
        [HttpGet]
        public async Task<IActionResult> GetReportStats()
        {
            try
            {
                var stats = new
                {
                    TotalReports = await _context.Reports.CountAsync(),
                    PendingReports = await _context.Reports.CountAsync(r => r.Status == "Pending"),
                    ResolvedReports = await _context.Reports.CountAsync(r => r.Status == "Resolved"),
                    RejectedReports = await _context.Reports.CountAsync(r => r.Status == "Rejected"),
                    TodayReports = await _context.Reports.CountAsync(r => r.CreatedAt.Date == DateTime.Today),
                    ThisWeekReports = await _context.Reports.CountAsync(r => r.CreatedAt >= DateTime.Now.AddDays(-7)),
                    ThisMonthReports = await _context.Reports.CountAsync(r => r.CreatedAt >= DateTime.Now.AddMonths(-1))
                };

                return Json(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report stats");
                return Json(new { success = false, message = "Lỗi lấy thống kê" });
            }
        }

        // POST: Xử lý hàng loạt
        [HttpPost]
        public async Task<IActionResult> BulkProcess([FromBody] BulkProcessRequest request)
        {
            try
            {
                var currentAdmin = await _userManager.GetUserAsync(User);
                var reports = await _context.Reports
                    .Where(r => request.ReportIds.Contains(r.ReportId) && r.Status == "Pending")
                    .ToListAsync();

                int processedCount = 0;
                foreach (var report in reports)
                {
                    if (request.Action.ToLower() == "resolve")
                    {
                        report.Status = "Resolved";
                        report.AdminNote = request.AdminNote;
                        report.ProcessedAt = DateTime.Now;
                        report.ProcessedBy = currentAdmin?.Id;
                        processedCount++;
                    }
                    else if (request.Action.ToLower() == "reject")
                    {
                        report.Status = "Rejected";
                        report.AdminNote = request.AdminNote;
                        report.ProcessedAt = DateTime.Now;
                        report.ProcessedBy = currentAdmin?.Id;
                        processedCount++;
                    }
                }

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = $"Đã xử lý {processedCount} reports thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk processing reports");
                return Json(new { success = false, message = "Lỗi xử lý hàng loạt: " + ex.Message });
            }
        }

        // HELPER METHODS
        private async Task CreateUserWarning(string userId, string warning, int reportId)
        {
            var userWarning = new UserWarning
            {
                UserId = userId,
                Warning = warning,
                RelatedReportId = reportId,
                CreatedAt = DateTime.Now,
                IsActive = true
            };

            _context.UserWarnings.Add(userWarning);
        }

        private async Task BanUser(string userId, int? durationDays, string reason, bool isPermanent)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.IsActive = false;
                user.BannedAt = DateTime.Now;
                user.BanReason = reason;
                user.BanExpiresAt = isPermanent ? null : DateTime.Now.AddDays(durationDays ?? 7);
                user.IsPermanentlyBanned = isPermanent;
            }
        }

        // REQUEST MODELS
        public class BulkProcessRequest
        {
            public List<int> ReportIds { get; set; } = new List<int>();
            public string Action { get; set; } = "";
            public string AdminNote { get; set; } = "";
        }

        public class ProcessReportRequest
        {
            public int Id { get; set; }
            public string Action { get; set; } = "";
            public string AdminNote { get; set; } = "";
            public int? BanDuration { get; set; }
        }
    }
}