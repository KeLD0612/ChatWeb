using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class Match
    {
        public int MatchId { get; set; }

        [Required]
        public string UserId1 { get; set; }

        [Required]
        public string UserId2 { get; set; }

        public DateTime MatchedAt { get; set; } = DateTime.Now;

        public string Status { get; set; } = "Active";

        public virtual ApplicationUser User1 { get; set; }
        public virtual ApplicationUser User2 { get; set; }
    }
}
