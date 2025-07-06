using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using webchat.Models;
using webchat.Models.ViewModels;

namespace webchat.Controllers
{
    [AllowAnonymous]
    public class CompleteRegistrationController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<CompleteRegistrationController> _logger;

        public CompleteRegistrationController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ApplicationDbContext context,
            IWebHostEnvironment environment,
            ILogger<CompleteRegistrationController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _environment = environment;
            _logger = logger;
        }
        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var model = new CompleteRegistrationViewModel();

            // Kiểm tra nếu user đã đăng nhập
            if (User.Identity.IsAuthenticated)
            {
                var user = await _userManager.GetUserAsync(User);
                if (user != null)
                {
                    var profile = await _context.UserProfiles
                        .FirstOrDefaultAsync(p => p.UserId == user.Id);

                    // Nếu đã có profile hoàn chỉnh thì chuyển về Explore
                    if (profile?.IsProfileComplete == true)
                    {
                        return RedirectToAction("Index", "Explore");
                    }

                    // ✅ FIX: Cải thiện xử lý external login
                    model.FullName = user.FullName ?? "";
                    model.Email = user.Email ?? "";

                    // Kiểm tra nếu user đăng nhập bằng external provider
                    var externalLogins = await _userManager.GetLoginsAsync(user);
                    if (externalLogins.Any())
                    {
                        var loginProvider = externalLogins.First().LoginProvider;

                        model.IsExternalLogin = true;
                        model.ExternalLoginProvider = loginProvider;

                        // ✅ FIX: Thiết lập ViewBag chính xác cho external login
                        ViewBag.IsExternalLogin = true;
                        ViewBag.ExternalProvider = loginProvider;
                        ViewBag.PrefilledEmail = user.Email ?? "";
                        ViewBag.PrefilledName = user.FullName ?? "";
                        ViewBag.SkipBasicInfo = true;
                        ViewBag.StartStep = 3; // Bắt đầu từ step giới tính

                        _logger.LogInformation("External login user accessing complete registration: {UserId}, Provider: {Provider}, Email: {Email}",
                            user.Id, loginProvider, user.Email);
                    }
                    else
                    {
                        // ✅ FIX: Thiết lập ViewBag cho regular login  
                        ViewBag.IsExternalLogin = false;
                        ViewBag.ExternalProvider = "";
                        ViewBag.PrefilledEmail = "";
                        ViewBag.PrefilledName = "";
                        ViewBag.SkipBasicInfo = false;
                        ViewBag.StartStep = 1;

                        _logger.LogInformation("Regular user accessing complete registration: {UserId}", user.Id);
                    }
                }
            }
            else
            {
                // ✅ FIX: User chưa đăng nhập - redirect về login
                _logger.LogWarning("Unauthenticated user trying to access complete registration");
                return RedirectToAction("Login", "Account", new { area = "Identity" });
            }

            return View(model);
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CompleteRegistration([FromForm] CompleteRegistrationViewModel model)
        {
            var debugMessages = new List<string>();
            try
            {
                debugMessages.Add($"[Server] Starting registration process for email: {model.Email} at {DateTime.Now}");
                _logger.LogInformation("Starting registration process for email: {Email} at {Time}", model.Email, DateTime.Now);

                debugMessages.Add($"[Server] Received model for email: {model.Email}");
                _logger.LogDebug("Received model for email: {Email}", model.Email);

                ApplicationUser user;

                // ✅ FIX: Xử lý external login với validation chính xác
                if (model.IsExternalLogin && User.Identity.IsAuthenticated)
                {
                    debugMessages.Add("[Server] Processing external login user");
                    _logger.LogDebug("Processing external login user");

                    // Lấy user hiện tại từ authentication context
                    user = await _userManager.GetUserAsync(User);
                    if (user == null)
                    {
                        debugMessages.Add("[Server] External login user not found in context");
                        _logger.LogError("External login user not found in context");
                        return Json(new { success = false, message = "Không thể tìm thấy thông tin người dùng", debug = debugMessages });
                    }

                    debugMessages.Add($"[Server] Found external login user: {user.Email}");
                    _logger.LogInformation("Found external login user: {UserId}, Email: {Email}", user.Id, user.Email);

                    // ✅ FIX: Chỉ validate FullName cho external login
                    if (string.IsNullOrEmpty(model.FullName?.Trim()))
                    {
                        debugMessages.Add("[Server] Missing FullName for external login user");
                        return Json(new { success = false, message = "Vui lòng nhập tên của bạn", debug = debugMessages });
                    }

                    // Update FullName cho external login user
                    user.FullName = model.FullName.Trim();

                    // ✅ FIX: Đảm bảo email được set từ authenticated user
                    model.Email = user.Email; // Override model email với authenticated user email
                }
                else
                {
                    // ✅ FIX: Validation đầy đủ cho regular registration
                    if (string.IsNullOrEmpty(model.Email?.Trim()) || string.IsNullOrEmpty(model.Password))
                    {
                        debugMessages.Add("[Server] Missing email or password for regular registration");
                        return Json(new { success = false, message = "Email và mật khẩu là bắt buộc", debug = debugMessages });
                    }

                    if (string.IsNullOrEmpty(model.FullName?.Trim()))
                    {
                        debugMessages.Add("[Server] Missing FullName for regular registration");
                        return Json(new { success = false, message = "Vui lòng nhập tên của bạn", debug = debugMessages });
                    }

                    debugMessages.Add($"[Server] Processing manual registration for email: {model.Email}");
                    _logger.LogDebug("Processing manual registration for email: {Email}", model.Email);

                    // Kiểm tra email đã tồn tại chỉ cho đăng ký thủ công
                    var existingUser = await _userManager.FindByEmailAsync(model.Email);
                    if (existingUser != null)
                    {
                        debugMessages.Add($"[Server] Email already exists: {model.Email}");
                        _logger.LogWarning("Email already exists: {Email}", model.Email);
                        return Json(new { success = false, message = "Email này đã được đăng ký", debug = debugMessages });
                    }

                    debugMessages.Add($"[Server] Email {model.Email} is available for registration");
                    _logger.LogDebug("Email {Email} is available for registration", model.Email);

                    // Tạo user mới cho đăng ký thông thường
                    user = new ApplicationUser
                    {
                        UserName = model.Email,
                        Email = model.Email,
                        FullName = model.FullName.Trim(),
                        DateOfBirth = model.DateOfBirth,
                        CreatedAt = DateTime.Now,
                        IsActive = true,
                        EmailConfirmed = true
                    };

                    debugMessages.Add($"[Server] Creating new user: {user.Id}");
                    _logger.LogDebug("Creating new user: {UserId}", user.Id);

                    var result = await _userManager.CreateAsync(user, model.Password);
                    if (!result.Succeeded)
                    {
                        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                        debugMessages.Add($"[Server] Failed to create user: {errors}");
                        _logger.LogError("Failed to create user: {Errors}", errors);
                        return Json(new { success = false, message = "Lỗi tạo tài khoản: " + errors, debug = debugMessages });
                    }

                    debugMessages.Add($"[Server] Successfully created user: {user.Id}");
                    _logger.LogInformation("Successfully created user: {UserId}", user.Id);

                    // Gán role User
                    debugMessages.Add($"[Server] Assigning 'User' role to user: {user.Id}");
                    _logger.LogDebug("Assigning 'User' role to user: {UserId}", user.Id);
                    await _userManager.AddToRoleAsync(user, "User");
                    debugMessages.Add($"[Server] Assigned 'User' role to user: {user.Id}");
                    _logger.LogInformation("Assigned 'User' role to user: {UserId}", user.Id);

                    // Đăng nhập user mới
                    debugMessages.Add($"[Server] Signing in new user: {user.Id}");
                    _logger.LogDebug("Signing in new user: {UserId}", user.Id);
                    await _signInManager.SignInAsync(user, isPersistent: false);
                    debugMessages.Add($"[Server] Successfully signed in user: {user.Id}");
                    _logger.LogInformation("Successfully signed in user: {UserId}", user.Id);
                }

                // ✅ FIX: Validate required fields cho cả hai loại registration
                if (model.BirthDay <= 0 || model.BirthMonth <= 0 || model.BirthYear <= 0)
                {
                    debugMessages.Add("[Server] Invalid birth date provided");
                    return Json(new { success = false, message = "Vui lòng nhập ngày sinh hợp lệ", debug = debugMessages });
                }

                if (string.IsNullOrEmpty(model.Gender?.Trim()))
                {
                    debugMessages.Add("[Server] Missing gender");
                    return Json(new { success = false, message = "Vui lòng chọn giới tính", debug = debugMessages });
                }

                if (string.IsNullOrEmpty(model.Province?.Trim()) || string.IsNullOrEmpty(model.District?.Trim()))
                {
                    debugMessages.Add("[Server] Missing location information");
                    return Json(new { success = false, message = "Vui lòng chọn địa điểm", debug = debugMessages });
                }

                // Cập nhật thông tin user
                debugMessages.Add($"[Server] Updating user information for user: {user.Id}");
                _logger.LogDebug("Updating user information for user: {UserId}", user.Id);

                user.FullName = model.FullName.Trim();
                user.DateOfBirth = model.DateOfBirth;

                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    var updateErrors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                    debugMessages.Add($"[Server] Failed to update user information: {updateErrors}");
                    _logger.LogError("Failed to update user information: {Errors}", updateErrors);
                    return Json(new { success = false, message = "Lỗi cập nhật thông tin: " + updateErrors, debug = debugMessages });
                }

                debugMessages.Add($"[Server] Successfully updated user information: {user.Id}");
                _logger.LogInformation("Successfully updated user information: {UserId}", user.Id);

                // Xử lý upload ảnh
                var profilePictureUrl = "";
                var photoUrls = new List<string>();

                debugMessages.Add($"[Server] Processing photo uploads for user: {user.Id}");
                _logger.LogDebug("Processing photo uploads for user: {UserId}", user.Id);

                // Xử lý ảnh đại diện
                if (model.ProfilePicture != null && model.ProfilePicture.Length > 0)
                {
                    debugMessages.Add($"[Server] Saving profile picture for user: {user.Id}");
                    _logger.LogDebug("Saving profile picture for user: {UserId}", user.Id);
                    profilePictureUrl = await SavePhotoAsync(model.ProfilePicture, user.Id, "profile");
                    if (!string.IsNullOrEmpty(profilePictureUrl))
                    {
                        debugMessages.Add($"[Server] Profile picture saved: {profilePictureUrl}");
                        _logger.LogInformation("Profile picture saved: {ProfilePictureUrl}", profilePictureUrl);
                    }
                }

                // Xử lý ảnh bổ sung
                if (model.AdditionalPhotos != null && model.AdditionalPhotos.Count > 0)
                {
                    debugMessages.Add($"[Server] Processing {model.AdditionalPhotos.Count} additional photos for user: {user.Id}");
                    _logger.LogDebug("Processing {PhotoCount} additional photos for user: {UserId}", model.AdditionalPhotos.Count, user.Id);

                    foreach (var photo in model.AdditionalPhotos)
                    {
                        if (photo != null && photo.Length > 0)
                        {
                            debugMessages.Add($"[Server] Saving additional photo for user: {user.Id}");
                            var photoUrl = await SavePhotoAsync(photo, user.Id, "additional");
                            if (!string.IsNullOrEmpty(photoUrl))
                            {
                                photoUrls.Add(photoUrl);
                                debugMessages.Add($"[Server] Additional photo saved: {photoUrl}");
                                _logger.LogInformation("Additional photo saved: {PhotoUrl}", photoUrl);
                            }
                        }
                    }
                }

                // ✅ FIX: Kiểm tra và xử lý UserProfile với error handling tốt hơn
                debugMessages.Add($"[Server] Checking for existing user profile for user: {user.Id}");
                _logger.LogDebug("Checking for existing user profile for user: {UserId}", user.Id);

                var existingProfile = await _context.UserProfiles
                    .FirstOrDefaultAsync(p => p.UserId == user.Id);

                try
                {
                    if (existingProfile != null)
                    {
                        debugMessages.Add($"[Server] Updating existing user profile for user: {user.Id}");
                        _logger.LogInformation("Updating existing user profile for user: {UserId}", user.Id);

                        // Cập nhật profile existing
                        existingProfile.Bio = model.Bio ?? "";
                        existingProfile.DateOfBirth = model.DateOfBirth;
                        existingProfile.Location = $"{model.District?.Trim()}, {model.Province?.Trim()}";
                        existingProfile.Province = model.Province?.Trim() ?? "";
                        existingProfile.District = model.District?.Trim() ?? "";
                        existingProfile.Interests = JsonConvert.SerializeObject(model.Interests ?? new List<string>());
                        existingProfile.Gender = model.Gender?.Trim() ?? "";
                        existingProfile.FashionStyle = !string.IsNullOrEmpty(model.CustomFashionStyle?.Trim()) ?
                            model.CustomFashionStyle.Trim() : (model.FashionStyle?.Trim() ?? "");
                        existingProfile.Personality = JsonConvert.SerializeObject(
                            (model.PersonalityTraits ?? new List<string>())
                            .Concat(new[] { model.CustomPersonality ?? "" })
                            .Where(p => !string.IsNullOrEmpty(p?.Trim()))
                            .Select(p => p.Trim()));
                        existingProfile.RelationshipGoal = !string.IsNullOrEmpty(model.CustomRelationshipGoal?.Trim()) ?
                            model.CustomRelationshipGoal.Trim() : (model.RelationshipGoal?.Trim() ?? "");
                        existingProfile.IdealPartner = model.IdealPartner?.Trim() ?? "";

                        if (!string.IsNullOrEmpty(profilePictureUrl))
                            existingProfile.ProfilePictureUrl = profilePictureUrl;

                        if (photoUrls.Any())
                            existingProfile.PhotoUrls = JsonConvert.SerializeObject(photoUrls);

                        existingProfile.IsProfileComplete = true;
                        existingProfile.IsVisible = true;
                        existingProfile.UpdatedAt = DateTime.Now;

                        _context.UserProfiles.Update(existingProfile);
                        debugMessages.Add($"[Server] Updated user profile for user: {existingProfile.UserId}");
                        _logger.LogDebug("Updated user profile for user: {UserId}", existingProfile.UserId);
                    }
                    else
                    {
                        debugMessages.Add($"[Server] Creating new user profile for user: {user.Id}");
                        _logger.LogInformation("Creating new user profile for user: {UserId}", user.Id);

                        // ✅ FIX: Tạo UserProfile mới với validation chặt chẽ
                        var userProfile = new UserProfile
                        {
                            UserId = user.Id,
                            Bio = model.Bio?.Trim() ?? "",
                            DateOfBirth = model.DateOfBirth,
                            Location = $"{model.District?.Trim()}, {model.Province?.Trim()}",
                            Province = model.Province?.Trim() ?? "",
                            District = model.District?.Trim() ?? "",
                            Interests = JsonConvert.SerializeObject(model.Interests ?? new List<string>()),
                            Gender = model.Gender?.Trim() ?? "",
                            FashionStyle = !string.IsNullOrEmpty(model.CustomFashionStyle?.Trim()) ?
                                model.CustomFashionStyle.Trim() : (model.FashionStyle?.Trim() ?? ""),
                            Personality = JsonConvert.SerializeObject(
                                (model.PersonalityTraits ?? new List<string>())
                                .Concat(new[] { model.CustomPersonality ?? "" })
                                .Where(p => !string.IsNullOrEmpty(p?.Trim()))
                                .Select(p => p.Trim())),
                            RelationshipGoal = !string.IsNullOrEmpty(model.CustomRelationshipGoal?.Trim()) ?
                                model.CustomRelationshipGoal.Trim() : (model.RelationshipGoal?.Trim() ?? ""),
                            IdealPartner = model.IdealPartner?.Trim() ?? "",
                            ProfilePictureUrl = profilePictureUrl ?? "",
                            PhotoUrls = JsonConvert.SerializeObject(photoUrls),
                            IsProfileComplete = true,
                            IsVisible = true,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };

                        _context.UserProfiles.Add(userProfile);
                        debugMessages.Add($"[Server] New user profile created for user: {userProfile.UserId}");
                        _logger.LogDebug("New user profile created for user: {UserId}", userProfile.UserId);
                    }

                    // ✅ FIX: Lưu với transaction để đảm bảo consistency
                    debugMessages.Add($"[Server] Saving changes to database for user: {user.Id}");
                    _logger.LogDebug("Saving changes to database for user: {UserId}", user.Id);

                    await _context.SaveChangesAsync();

                    debugMessages.Add($"[Server] Successfully saved changes to database for user: {user.Id}");
                    _logger.LogInformation("Successfully saved changes to database for user: {UserId}", user.Id);

                    debugMessages.Add($"[Server] User registration completed successfully: {user.Id} at {DateTime.Now}");
                    _logger.LogInformation("User registration completed successfully: {UserId} at {Time}", user.Id, DateTime.Now);

                    return Json(new { success = true, message = "Đăng ký thành công!", redirectUrl = "/Explore", debug = debugMessages });
                }
                catch (DbUpdateException dbEx)
                {
                    debugMessages.Add($"[Server] Database error saving profile: {dbEx.Message}");
                    _logger.LogError(dbEx, "Database error saving profile for user: {UserId}", user.Id);

                    // Specific database error handling
                    if (dbEx.InnerException?.Message.Contains("UNIQUE") == true)
                    {
                        return Json(new { success = false, message = "Dữ liệu bị trùng lặp. Vui lòng thử lại.", debug = debugMessages });
                    }
                    else if (dbEx.InnerException?.Message.Contains("FOREIGN KEY") == true)
                    {
                        return Json(new { success = false, message = "Lỗi liên kết dữ liệu. Vui lòng thử lại.", debug = debugMessages });
                    }
                    else
                    {
                        return Json(new { success = false, message = "Lỗi cơ sở dữ liệu. Vui lòng thử lại.", debug = debugMessages });
                    }
                }
            }
            catch (Exception ex)
            {
                debugMessages.Add($"[Server] Error completing registration for email: {model.Email}. Error: {ex.Message}");
                _logger.LogError(ex, "Error completing registration for email: {Email}", model.Email);
                return Json(new { success = false, message = "Có lỗi xảy ra, vui lòng thử lại: " + ex.Message, debug = debugMessages });
            }
        }
        [HttpGet]
        public IActionResult GetDistricts(string province)
        {
            var districts = RegistrationData.Districts.ContainsKey(province)
                ? RegistrationData.Districts[province]
                : new List<string>();

            return Json(districts);
        }

        // Hàm helper để lưu ảnh
        private async Task<string> SavePhotoAsync(IFormFile photo, string userId, string type)
        {
            try
            {
                if (photo == null || photo.Length == 0)
                    return null;

                // Kiểm tra định dạng file
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                var fileExtension = Path.GetExtension(photo.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                    return null;

                // Tạo thư mục nếu chưa tồn tại
                var uploadsDir = Path.Combine(_environment.WebRootPath, "uploads", "profiles", userId);
                if (!Directory.Exists(uploadsDir))
                    Directory.CreateDirectory(uploadsDir);

                // Tạo tên file unique
                var fileName = $"{type}_{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid().ToString("N")[..8]}{fileExtension}";
                var filePath = Path.Combine(uploadsDir, fileName);

                // Lưu file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await photo.CopyToAsync(stream);
                }

                // Trả về relative path
                return $"/uploads/profiles/{userId}/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving photo for user {UserId}", userId);
                return null;
            }
        }
    }
}