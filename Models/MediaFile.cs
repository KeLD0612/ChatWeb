using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class MediaFile
    {
        public int MediaId { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        public string FileUrl { get; set; }

        public string MediaType { get; set; } = "Image"; // Image, Video, Avatar

        public DateTime UploadedAt { get; set; } = DateTime.Now;

        // Navigation property
        public ApplicationUser User { get; set; }
    }
}
