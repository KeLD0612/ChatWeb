using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace webchat.Models
{
    /// Model cho cài đặt discovery
    public class DiscoverySettings
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        public int MinAge { get; set; } = 18;
        public int MaxAge { get; set; } = 99;
        public int MaxDistance { get; set; } = 50; // km
        public bool ShowOnlyOnline { get; set; } = false;
        //public string PreferredGender { get; set; } = "All"; // Male, Female, All

        //public bool ShowVerifiedOnly { get; set; } = false;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey(nameof(UserId))]
        public virtual ApplicationUser User { get; set; }
    }
}
