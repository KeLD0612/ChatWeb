using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class CallRecord
    {
        public int Id { get; set; }

        [Required]
        public string CallerId { get; set; }

        [Required]
        public string ReceiverId { get; set; }

        [Required]
        public string CallType { get; set; } // "audio" or "video"

        public DateTime StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        public int Duration { get; set; } // in seconds

        public string Status { get; set; } // "completed", "missed", "rejected"

        // Navigation properties
        public virtual ApplicationUser Caller { get; set; }
        public virtual ApplicationUser Receiver { get; set; }
    }
}
