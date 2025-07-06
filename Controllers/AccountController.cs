using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using webchat.Models;

namespace webchat.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AccountController> _logger;

        public AccountController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ApplicationDbContext context,
            ILogger<AccountController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public IActionResult Register()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (ModelState.IsValid)
            {
                var user = new ApplicationUser
                {
                    UserName = model.Email, // SET UserName = Email
                    Email = model.Email,
                    FullName = model.FullName,
                    EmailConfirmed = true // Tạm thời true để test
                };

                var result = await _userManager.CreateAsync(user, model.Password);

                if (result.Succeeded)
                {
                    // Gán role User
                    await _userManager.AddToRoleAsync(user, "User");

                    // Đăng nhập luôn
                    await _signInManager.SignInAsync(user, isPersistent: false);
                    return RedirectToAction("Index", "CompleteRegistration");
                }

                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError("", error.Description);
                }
            }

            return View(model);
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult Login(string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;

            if (ModelState.IsValid)
            {
                var result = await _signInManager.PasswordSignInAsync(model.Email, model.Password,
                                                                     model.RememberMe, lockoutOnFailure: false);
                if (result.Succeeded)
                {
                    _logger.LogInformation("User logged in.");
                    return RedirectToLocal(returnUrl);
                }
                if (result.IsLockedOut)
                {
                    _logger.LogWarning("User account locked out.");
                    return RedirectToAction(nameof(Lockout));
                }
                else
                {
                    ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                    return View(model);
                }
            }

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            _logger.LogInformation("User logged out.");
            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult Lockout()
        {
            return View();
        }

        // ==================== WARNING SYSTEM ====================

        [HttpGet]
        public async Task<IActionResult> GetUnreadWarnings()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not found" });
                }

                var warnings = await _context.UserWarnings
                    .Where(w => w.UserId == userId && w.IsActive && !w.AcknowledgedAt.HasValue)
                    .OrderByDescending(w => w.CreatedAt)
                    .Select(w => new
                    {
                        w.WarningId,
                        w.Warning,
                        w.CreatedAt
                    })
                    .ToListAsync();

                return Json(new { success = true, warnings = warnings });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread warnings");
                return Json(new { success = false, message = "Error getting warnings" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AcknowledgeWarnings([FromBody] AcknowledgeWarningsRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not found" });
                }

                var warnings = await _context.UserWarnings
                    .Where(w => request.WarningIds.Contains(w.WarningId) && w.UserId == userId)
                    .ToListAsync();

                foreach (var warning in warnings)
                {
                    warning.AcknowledgedAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"User {userId} acknowledged {warnings.Count} warnings");

                return Json(new { success = true, message = "Warnings acknowledged successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging warnings");
                return Json(new { success = false, message = "Error acknowledging warnings" });
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult Banned(string message, string reason)
        {
            ViewBag.Message = message ?? "Tài khoản của bạn đã bị khóa.";
            ViewBag.Reason = reason;
            return View();
        }

        // ==================== HELPER METHODS ====================

        private IActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction("Index", "Home");
            }
        }

        // ==================== REQUEST MODELS ====================

        public class AcknowledgeWarningsRequest
        {
            public List<int> WarningIds { get; set; } = new List<int>();
        }
    }

    // ==================== VIEW MODELS ====================

    public class LoginViewModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public bool RememberMe { get; set; }
    }

    public class RegisterViewModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
        public string FullName { get; set; }
        public DateTime DateOfBirth { get; set; }
    }
}