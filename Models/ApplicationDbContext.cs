using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace webchat.Models
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSets cho tất cả models
        public DbSet<Message> Messages { get; set; }
        public DbSet<Match> Matches { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Like> Likes { get; set; }
        public DbSet<MediaFile> MediaFiles { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<CallRecord> CallRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Message
            builder.Entity<Message>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(m => m.Sender)
                    .WithMany(u => u.SentMessages)
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Receiver)
                    .WithMany(u => u.ReceivedMessages)
                    .HasForeignKey(m => m.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(m => m.MessageType)
                    .HasMaxLength(20)
                    .HasDefaultValue("text");
            });

            // Configure Match
            builder.Entity<Match>(entity =>
            {
                entity.HasKey(m => m.MatchId);

                entity.HasOne(m => m.User1)
                    .WithMany()
                    .HasForeignKey(m => m.UserId1)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.User2)
                    .WithMany()
                    .HasForeignKey(m => m.UserId2)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(m => new { m.UserId1, m.UserId2 })
                    .IsUnique();

                entity.Property(m => m.Status)
                    .HasMaxLength(20)
                    .HasDefaultValue("Active");
            });

            // Configure Report
            builder.Entity<Report>(entity =>
            {
                entity.HasKey(r => r.ReportId);

                entity.HasOne(r => r.Reporter)
                    .WithMany()
                    .HasForeignKey(r => r.ReporterId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.ReportedUser)
                    .WithMany()
                    .HasForeignKey(r => r.ReportedUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.ReportedMessage)
                    .WithMany()
                    .HasForeignKey(r => r.ReportedMessageId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure Like
            builder.Entity<Like>(entity =>
            {
                entity.HasKey(l => l.LikeId);

                entity.HasOne(l => l.Liker)
                    .WithMany()
                    .HasForeignKey(l => l.LikerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(l => l.LikedUser)
                    .WithMany()
                    .HasForeignKey(l => l.LikedUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(l => new { l.LikerId, l.LikedUserId })
                    .IsUnique();
            });

            // Configure MediaFile
            builder.Entity<MediaFile>(entity =>
            {
                entity.HasKey(mf => mf.MediaId);

                entity.HasOne(mf => mf.User)
                    .WithMany()
                    .HasForeignKey(mf => mf.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure UserProfile
            builder.Entity<UserProfile>(entity =>
            {
                entity.HasKey(up => up.Id);

                entity.HasOne(up => up.User)
                    .WithOne(u => u.UserProfile)
                    .HasForeignKey<UserProfile>(up => up.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure CallRecord
            builder.Entity<CallRecord>(entity =>
            {
                entity.HasKey(c => c.Id);

                entity.HasOne(c => c.Caller)
                    .WithMany()
                    .HasForeignKey(c => c.CallerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.Receiver)
                    .WithMany()
                    .HasForeignKey(c => c.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(c => c.CallType)
                    .HasMaxLength(10)
                    .HasDefaultValue("audio");

                entity.Property(c => c.Status)
                    .HasMaxLength(20)
                    .HasDefaultValue("completed");
            });
        }
    }
}
