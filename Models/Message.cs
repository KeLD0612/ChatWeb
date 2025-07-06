using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class Message
    {
        public int Id { get; set; }

        [Required]
        public string SenderId { get; set; }

        [Required]
        public string ReceiverId { get; set; }

        [Required]
        public string Content { get; set; }

        public string MessageType { get; set; } = "text";

        // THÊM CÁC FIELD NÀY:
        public string? FileName { get; set; }
        public string? FileUrl { get; set; }

        public DateTime SentAt { get; set; } = DateTime.Now;

        public bool IsRead { get; set; } = false;

        // Thuộc tính mới để hỗ trợ ghim và trả lời
        public bool IsPinned { get; set; } = false;
        public DateTime? PinnedAt { get; set; }
        public int? RepliedMessageId { get; set; } = null;

        // Thuộc tính mới để hỗ trợ thu hồi
        public bool IsRecalled { get; set; } = false;
        public string? RecallType { get; set; } = null; // "sender" hoặc "both"
        public DateTime? RecalledAt { get; set; }
        public string? RecalledFor { get; set; } = null;

        // THÊM CÁC FIELD DELETE:
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public string? DeletedBy { get; set; } // Admin ID who deleted

        // Navigation properties
        public virtual ApplicationUser? Sender { get; set; }
        public virtual ApplicationUser? Receiver { get; set; }
        public virtual Message? RepliedMessage { get; set; }
        public virtual ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();

        // THÊM NAVIGATION CHO REPORTS:
        public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
    }
}