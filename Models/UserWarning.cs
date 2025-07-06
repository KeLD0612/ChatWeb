using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace webchat.Models
{
    public class UserWarning
    {
        [Key]
        public int WarningId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Warning { get; set; } = string.Empty;

        public int? RelatedReportId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public bool IsActive { get; set; } = true;

        public DateTime? AcknowledgedAt { get; set; }

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey("RelatedReportId")]
        public virtual Report? RelatedReport { get; set; }
    }
}