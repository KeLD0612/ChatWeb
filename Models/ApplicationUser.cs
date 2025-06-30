using Microsoft.AspNetCore.Identity;

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
