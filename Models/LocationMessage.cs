// LocationMessage.cs - Tạo file mới trong thư mục Models
using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class LocationMessage
    {
        public int Id { get; set; }

        [Required]
        public string SenderId { get; set; }

        [Required]
        public string ReceiverId { get; set; }

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        public string LocationName { get; set; }

        public string MapImageUrl { get; set; }

        public DateTime SentAt { get; set; } = DateTime.Now;

        // Navigation properties
        public virtual ApplicationUser Sender { get; set; }
        public virtual ApplicationUser Receiver { get; set; }
    }
}