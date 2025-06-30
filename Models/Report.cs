using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class Report
    {
        public int ReportId { get; set; }

        [Required]
        public string ReporterId { get; set; }

        [Required]
        public string ReportedUserId { get; set; }

        public int? ReportedMessageId { get; set; }

        [Required]
        [StringLength(200)]
        public string Reason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public string Status { get; set; } = "Pending";

        // Navigation properties
        public virtual ApplicationUser Reporter { get; set; }
        public virtual ApplicationUser ReportedUser { get; set; }
        public virtual Message ReportedMessage { get; set; }
    }
}
