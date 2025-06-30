// Areas/Admin/Controllers/ReportManagementController.cs
using Microsoft.AspNetCore.Authorization;
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

        public ReportManagementController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Danh sách reports
        public async Task<IActionResult> Index(string status = "all", int page = 1)
        {
            var reports = _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReportedUser)
                .Include(r => r.ReportedMessage)
                .AsQueryable();

            if (status != "all")
            {
                reports = reports.Where(r => r.Status.ToLower() == status.ToLower());
            }

            ViewBag.CurrentStatus = status;
            ViewBag.PendingCount = await _context.Reports.CountAsync(r => r.Status == "Pending");
            ViewBag.ResolvedCount = await _context.Reports.CountAsync(r => r.Status == "Resolved");
            ViewBag.RejectedCount = await _context.Reports.CountAsync(r => r.Status == "Rejected");

            int pageSize = 15;
            var paginatedReports = await reports
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            ViewBag.TotalPages = (int)Math.Ceiling(await reports.CountAsync() / (double)pageSize);
            ViewBag.CurrentPage = page;

            return View(paginatedReports);
        }

        // GET: Chi tiết report
        public async Task<IActionResult> Details(int id)
        {
            var report = await _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReportedUser)
                .Include(r => r.ReportedMessage)
                .FirstOrDefaultAsync(r => r.ReportId == id);

            if (report == null) return NotFound();

            // Lấy lịch sử reports của user này
            ViewBag.UserReportHistory = await _context.Reports
                .Where(r => r.ReportedUserId == report.ReportedUserId)
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .ToListAsync();

            return View(report);
        }

        // POST: Xử lý report
        [HttpPost]
        public async Task<IActionResult> ProcessReport(int id, string action, string adminNote = "")
        {
            var report = await _context.Reports.FindAsync(id);
            if (report == null) return NotFound();

            switch (action.ToLower())
            {
                case "resolve":
                    report.Status = "Resolved";
                    break;
                case "reject":
                    report.Status = "Rejected";
                    break;
                case "ban_user":
                    report.Status = "Resolved";
                    var reportedUser = await _context.Users.FindAsync(report.ReportedUserId);
                    if (reportedUser != null)
                    {
                        reportedUser.IsActive = false;
                    }
                    break;
            }

            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Report đã được xử lý thành công" });
        }

        // GET: Thống kê reports
        [HttpGet]
        public async Task<IActionResult> GetReportStats()
        {
            var stats = new
            {
                TotalReports = await _context.Reports.CountAsync(),
                PendingReports = await _context.Reports.CountAsync(r => r.Status == "Pending"),
                ResolvedReports = await _context.Reports.CountAsync(r => r.Status == "Resolved"),
                RejectedReports = await _context.Reports.CountAsync(r => r.Status == "Rejected"),
                ReportsThisWeek = await _context.Reports.CountAsync(r => r.CreatedAt >= DateTime.Now.AddDays(-7)),
                MostReportedUsers = await _context.Reports
                    .GroupBy(r => r.ReportedUserId)
                    .Select(g => new { UserId = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToListAsync()
            };

            return Json(stats);
        }
    }
}
