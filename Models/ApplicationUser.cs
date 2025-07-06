using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FullName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? Bio { get; set; }
        public string? ProfilePicture { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public bool IsActive { get; set; } = true;

        // Navigation properties

        public DateTime? LastActive { get; set; }

        public UserProfile? UserProfile { get; set; }
        public ICollection<Message> SentMessages { get; set; } = new List<Message>();
        public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();

        public DateTime? BannedAt { get; set; }

        [MaxLength(1000)]
        public string BanReason { get; set; } = string.Empty;

        public DateTime? BanExpiresAt { get; set; }

        public bool IsPermanentlyBanned { get; set; } = false;

        // Navigation properties cho Reports
        public virtual ICollection<Report> ReportsSubmitted { get; set; } = new List<Report>();
        public virtual ICollection<Report> ReportsReceived { get; set; } = new List<Report>();
        public virtual ICollection<UserWarning> Warnings { get; set; } = new List<UserWarning>();

        // THÊM METHOD ĐỂ FIX AUTO-SELECT
        public string GetDisplayName()
        {
            return !string.IsNullOrEmpty(FullName)
                ? FullName
                : !string.IsNullOrEmpty(Email)
                    ? Email
                    : !string.IsNullOrEmpty(UserName)
                        ? UserName
                        : $"User_{Id?.Substring(0, 8) ?? "Unknown"}";
        }
    }
}
