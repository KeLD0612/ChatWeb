using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class UserProfile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        public string Bio { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Location { get; set; }
        public string Interests { get; set; }
        public string ProfilePictureUrl { get; set; }

        public virtual ApplicationUser User { get; set; }
    }
}
