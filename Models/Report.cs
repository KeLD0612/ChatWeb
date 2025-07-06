using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace webchat.Models
{
    public class Report
    {
        [Key]
        public int ReportId { get; set; }

        [Required]
        public string ReporterId { get; set; } = string.Empty;

        [Required]
        public string ReportedUserId { get; set; } = string.Empty;

        public int? ReportedMessageId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Resolved, Rejected

        [MaxLength(20)]
        public string ReportType { get; set; } = "Message"; // Message, User, Other

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? ProcessedAt { get; set; }

        public string? ProcessedBy { get; set; } // Admin ID

        [MaxLength(1000)]
        public string AdminNote { get; set; } = string.Empty;

        // Navigation properties
        [ForeignKey("ReporterId")]
        public virtual ApplicationUser? Reporter { get; set; }

        [ForeignKey("ReportedUserId")]
        public virtual ApplicationUser? ReportedUser { get; set; }

        [ForeignKey("ReportedMessageId")]
        public virtual Message? ReportedMessage { get; set; }

        [ForeignKey("ProcessedBy")]
        public virtual ApplicationUser? ProcessedByAdmin { get; set; }
    }
}