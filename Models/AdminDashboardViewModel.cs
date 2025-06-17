using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class AdminDashboardViewModel
    {
        [Display(Name = "Tổng số người dùng")]
        public int TotalUsers { get; set; }

        [Display(Name = "Tổng số tin nhắn")]
        public int TotalMessages { get; set; }

        [Display(Name = "Tổng số cặp đôi")]
        public int TotalMatches { get; set; }

        [Display(Name = "Tổng số báo cáo")]
        public int TotalReports { get; set; }

        [Display(Name = "Người dùng đang hoạt động")]
        public int ActiveUsers { get; set; }

        [Display(Name = "Người dùng mới hôm nay")]
        public int NewUsersToday { get; set; }

        [Display(Name = "Tin nhắn hôm nay")]
        public int MessagesToday { get; set; }

        [Display(Name = "Lượt thích hôm nay")]
        public int LikesToday { get; set; }

        [Display(Name = "Báo cáo chưa xử lý")]
        public int PendingReports { get; set; }

        // Additional properties for charts/statistics
        public List<DailyStats> DailyStats { get; set; } = new List<DailyStats>();
        public List<UserGrowthStats> UserGrowthStats { get; set; } = new List<UserGrowthStats>();
    }

    public class DailyStats
    {
        public DateTime Date { get; set; }
        public int NewUsers { get; set; }
        public int Messages { get; set; }
        public int Matches { get; set; }
        public int Likes { get; set; }
    }

    public class UserGrowthStats
    {
        public string Month { get; set; }
        public int UserCount { get; set; }
        public int ActiveUserCount { get; set; }
    }
}
