// Areas/Admin/Controllers/MessageManagementController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webchat.Models;

namespace webchat.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Roles = "Admin")]
    public class MessageManagementController : Controller
    {
        private readonly ApplicationDbContext _context;

        public MessageManagementController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: Danh sách messages
        public async Task<IActionResult> Index(string searchString, string messageType = "all", int page = 1)
        {
            var messages = _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .AsQueryable();

            if (!String.IsNullOrEmpty(searchString))
            {
                messages = messages.Where(m => m.Content.Contains(searchString) ||
                                             m.Sender.FullName.Contains(searchString) ||
                                             m.Receiver.FullName.Contains(searchString));
            }

            if (messageType != "all")
            {
                messages = messages.Where(m => m.MessageType == messageType);
            }

            ViewBag.CurrentFilter = searchString;
            ViewBag.CurrentType = messageType;
            ViewBag.TextMessages = await _context.Messages.CountAsync(m => m.MessageType == "text");
            ViewBag.ImageMessages = await _context.Messages.CountAsync(m => m.MessageType == "image");
            ViewBag.VideoMessages = await _context.Messages.CountAsync(m => m.MessageType == "video");

            int pageSize = 20;
            var paginatedMessages = await messages
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            ViewBag.TotalPages = (int)Math.Ceiling(await messages.CountAsync() / (double)pageSize);
            ViewBag.CurrentPage = page;

            return View(paginatedMessages);
        }

        // POST: Xóa message
        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message == null) return NotFound();

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = "Tin nhắn đã được xóa" });
        }

        // GET: Thống kê messages
        [HttpGet]
        public async Task<IActionResult> GetMessageStats()
        {
            var today = DateTime.Today;
            var thisWeek = today.AddDays(-7);
            var thisMonth = new DateTime(today.Year, today.Month, 1);

            var stats = new
            {
                TotalMessages = await _context.Messages.CountAsync(),
                MessagesToday = await _context.Messages.CountAsync(m => m.SentAt.Date == today),
                MessagesThisWeek = await _context.Messages.CountAsync(m => m.SentAt >= thisWeek),
                MessagesThisMonth = await _context.Messages.CountAsync(m => m.SentAt >= thisMonth),
                TextMessages = await _context.Messages.CountAsync(m => m.MessageType == "text"),
                ImageMessages = await _context.Messages.CountAsync(m => m.MessageType == "image"),
                VideoMessages = await _context.Messages.CountAsync(m => m.MessageType == "video"),
                UnreadMessages = await _context.Messages.CountAsync(m => !m.IsRead)
            };

            return Json(stats);
        }

        // GET: Top active users
        [HttpGet]
        public async Task<IActionResult> GetTopActiveUsers()
        {
            var topSenders = await _context.Messages
                .GroupBy(m => m.SenderId)
                .Select(g => new {
                    UserId = g.Key,
                    MessageCount = g.Count(),
                    UserName = g.First().Sender.FullName ?? g.First().Sender.Email
                })
                .OrderByDescending(x => x.MessageCount)
                .Take(10)
                .ToListAsync();

            return Json(topSenders);
        }
    }
}
