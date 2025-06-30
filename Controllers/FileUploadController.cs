using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using webchat.Models;

namespace webchat.Controllers
{
    [Authorize]
    public class FileUploadController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileUploadController> _logger;

        public FileUploadController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            IWebHostEnvironment environment,
            ILogger<FileUploadController> logger)
        {
            _context = context;
            _userManager = userManager;
            _environment = environment;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> UploadChatMedia(IFormFile file, string receiverId)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { error = "No file uploaded" });
                }

                var allowedImageTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp" };
                var allowedVideoTypes = new[] { "video/mp4", "video/webm", "video/avi", "video/mov", "video/wmv" };
                var allowedDocTypes = new[] { "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain" };

                var allAllowedTypes = allowedImageTypes.Concat(allowedVideoTypes).Concat(allowedDocTypes).ToArray();

                if (!allAllowedTypes.Contains(file.ContentType.ToLower()))
                {
                    return BadRequest(new { error = $"File type not supported: {file.ContentType}" });
                }

                if (file.Length > 20 * 1024 * 1024)
                {
                    return BadRequest(new { error = "File too large (max 20MB)" });
                }

                var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "chat");
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                string mediaType;
                if (allowedImageTypes.Contains(file.ContentType.ToLower()))
                {
                    mediaType = "image";
                }
                else if (allowedVideoTypes.Contains(file.ContentType.ToLower()))
                {
                    mediaType = "video";
                }
                else
                {
                    mediaType = "document";
                }

                var mediaFile = new MediaFile
                {
                    UserId = currentUser.Id,
                    FileUrl = $"/uploads/chat/{fileName}",
                    MediaType = mediaType,
                    UploadedAt = DateTime.Now
                };

                _context.MediaFiles.Add(mediaFile);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    fileUrl = mediaFile.FileUrl,
                    mediaType = mediaType,
                    fileName = file.FileName,
                    fileSize = file.Length
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file");
                return StatusCode(500, new { error = "Upload failed: " + ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UploadVoiceMessage(IFormFile file, string receiverId)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { error = "No voice file uploaded" });
                }

                var allowedTypes = new[] { "audio/webm", "audio/wav", "audio/mp3", "audio/ogg", "audio/m4a" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                {
                    return BadRequest(new { error = "Invalid audio file type" });
                }

                if (file.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new { error = "Voice file too large (max 5MB)" });
                }

                var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "voice");
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var mediaFile = new MediaFile
                {
                    UserId = currentUser.Id,
                    FileUrl = $"/uploads/voice/{fileName}",
                    MediaType = "voice",
                    UploadedAt = DateTime.Now
                };

                _context.MediaFiles.Add(mediaFile);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    voiceUrl = mediaFile.FileUrl,
                    duration = 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading voice message");
                return StatusCode(500, new { error = "Upload failed: " + ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UploadProfilePicture(IFormFile file)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { error = "No file uploaded" });
                }

                var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                {
                    return BadRequest(new { error = "Only image files are allowed" });
                }

                if (file.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new { error = "File too large (max 5MB)" });
                }

                var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "profiles");
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                if (!string.IsNullOrEmpty(currentUser.ProfilePicture))
                {
                    var oldFilePath = Path.Combine(_environment.WebRootPath, currentUser.ProfilePicture.TrimStart('/'));
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        System.IO.File.Delete(oldFilePath);
                    }
                }

                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{currentUser.Id}_{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                currentUser.ProfilePicture = $"/uploads/profiles/{fileName}";
                await _userManager.UpdateAsync(currentUser);

                return Json(new
                {
                    success = true,
                    profilePictureUrl = currentUser.ProfilePicture
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading profile picture");
                return StatusCode(500, new { error = "Upload failed: " + ex.Message });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteFile(int mediaId)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                var mediaFile = await _context.MediaFiles.FindAsync(mediaId);
                if (mediaFile == null)
                {
                    return NotFound(new { error = "File not found" });
                }

                if (mediaFile.UserId != currentUser.Id && !User.IsInRole("Admin"))
                {
                    return Forbid();
                }

                var filePath = Path.Combine(_environment.WebRootPath, mediaFile.FileUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                _context.MediaFiles.Remove(mediaFile);
                await _context.SaveChangesAsync();

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file");
                return StatusCode(500, new { error = "Delete failed: " + ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUserFiles()
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                var userFiles = await _context.MediaFiles
                    .Where(m => m.UserId == currentUser.Id)
                    .OrderByDescending(m => m.UploadedAt)
                    .Select(m => new
                    {
                        m.MediaId,
                        m.FileUrl,
                        m.MediaType,
                        m.UploadedAt
                    })
                    .ToListAsync();

                return Json(userFiles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user files");
                return StatusCode(500, new { error = "Failed to get files" });
            }
        }
    }
}
