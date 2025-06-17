using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using webchat.Models;

namespace webchat.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ChatHub> _logger;

        private static readonly Dictionary<string, CallSession> ActiveCalls = new();

        public ChatHub(ApplicationDbContext context, UserManager<ApplicationUser> userManager, ILogger<ChatHub> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task JoinUserGroup(string userId)
        {
            _logger.LogInformation($"JoinUserGroup called for userId: {userId}");

            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
                _logger.LogInformation($"✅ User {userId} joined group with connection {Context.ConnectionId}");
            }
            else
            {
                _logger.LogWarning("JoinUserGroup called with null or empty userId");
            }
        }

        public async Task SendMessage(string receiverId, string message)
        {
            _logger.LogInformation($"SendMessage called: from {Context.UserIdentifier} to {receiverId}, message: {message}");

            var currentUser = await _userManager.GetUserAsync(Context.User);
            if (currentUser == null)
            {
                _logger.LogError("Current user is null in SendMessage");
                await Clients.Caller.SendAsync("Error", "User not authenticated");
                return;
            }

            if (string.IsNullOrEmpty(receiverId) || string.IsNullOrEmpty(message))
            {
                _logger.LogWarning($"Invalid data in SendMessage: receiverId={receiverId}, message={message}");
                await Clients.Caller.SendAsync("Error", "Invalid message data");
                return;
            }

            _logger.LogInformation($"✅ Current user: {currentUser.Email} (ID: {currentUser.Id})");

            try
            {
                var chatMessage = new Message
                {
                    SenderId = currentUser.Id,
                    ReceiverId = receiverId,
                    Content = message,
                    SentAt = DateTime.Now,
                    MessageType = "text",
                    IsRead = false
                };

                _context.Messages.Add(chatMessage);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Message saved to database with ID: {chatMessage.Id}");

                var timestamp = DateTime.Now.ToString("HH:mm");
                var senderName = currentUser.FullName ?? currentUser.Email ?? "Unknown User";

                await Clients.Group($"User_{receiverId}")
                    .SendAsync("ReceiveMessage", currentUser.Id, senderName, message, timestamp);

                await Clients.Group($"User_{currentUser.Id}")
                    .SendAsync("ReceiveMessage", currentUser.Id, senderName, message, timestamp);

                _logger.LogInformation($"✅ Message broadcasted to groups User_{receiverId} and User_{currentUser.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessage");
                await Clients.Caller.SendAsync("Error", "Failed to send message: " + ex.Message);
            }
        }

        public async Task SendMediaMessage(string receiverId, string fileUrl, string mediaType, string fileName, long fileSize)
        {
            _logger.LogInformation($"SendMediaMessage called: from {Context.UserIdentifier} to {receiverId}");

            var currentUser = await _userManager.GetUserAsync(Context.User);
            if (currentUser == null)
            {
                _logger.LogError("Current user is null in SendMediaMessage");
                await Clients.Caller.SendAsync("Error", "User not authenticated");
                return;
            }

            if (string.IsNullOrEmpty(receiverId) || string.IsNullOrEmpty(fileUrl))
            {
                _logger.LogWarning($"Invalid data in SendMediaMessage: receiverId={receiverId}, fileUrl={fileUrl}");
                await Clients.Caller.SendAsync("Error", "Invalid media data");
                return;
            }

            try
            {
                var chatMessage = new Message
                {
                    SenderId = currentUser.Id,
                    ReceiverId = receiverId,
                    Content = fileUrl,
                    SentAt = DateTime.Now,
                    MessageType = mediaType.ToLower(),
                    IsRead = false
                };

                _context.Messages.Add(chatMessage);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Media message saved to database with ID: {chatMessage.Id}");

                var timestamp = DateTime.Now.ToString("HH:mm");
                var senderName = currentUser.FullName ?? currentUser.Email ?? "Unknown User";

                await Clients.Group($"User_{receiverId}")
                    .SendAsync("ReceiveMediaMessage", currentUser.Id, senderName, fileUrl, mediaType, fileName, fileSize, timestamp);

                await Clients.Group($"User_{currentUser.Id}")
                    .SendAsync("ReceiveMediaMessage", currentUser.Id, senderName, fileUrl, mediaType, fileName, fileSize, timestamp);

                _logger.LogInformation($"✅ Media message broadcasted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMediaMessage");
                await Clients.Caller.SendAsync("Error", "Failed to send media: " + ex.Message);
            }
        }

        public async Task SendVoiceMessage(string receiverId, string voiceUrl, int duration)
        {
            _logger.LogInformation($"SendVoiceMessage called: from {Context.UserIdentifier} to {receiverId}");

            var currentUser = await _userManager.GetUserAsync(Context.User);
            if (currentUser == null)
            {
                _logger.LogError("Current user is null in SendVoiceMessage");
                await Clients.Caller.SendAsync("Error", "User not authenticated");
                return;
            }

            if (string.IsNullOrEmpty(receiverId) || string.IsNullOrEmpty(voiceUrl))
            {
                _logger.LogWarning($"Invalid data in SendVoiceMessage: receiverId={receiverId}, voiceUrl={voiceUrl}");
                await Clients.Caller.SendAsync("Error", "Invalid voice data");
                return;
            }

            try
            {
                var chatMessage = new Message
                {
                    SenderId = currentUser.Id,
                    ReceiverId = receiverId,
                    Content = voiceUrl,
                    SentAt = DateTime.Now,
                    MessageType = "voice",
                    IsRead = false
                };

                _context.Messages.Add(chatMessage);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Voice message saved to database with ID: {chatMessage.Id}");

                var timestamp = DateTime.Now.ToString("HH:mm");
                var senderName = currentUser.FullName ?? currentUser.Email ?? "Unknown User";

                await Clients.Group($"User_{receiverId}")
                    .SendAsync("ReceiveVoiceMessage", currentUser.Id, senderName, voiceUrl, duration, timestamp);

                await Clients.Group($"User_{currentUser.Id}")
                    .SendAsync("ReceiveVoiceMessage", currentUser.Id, senderName, voiceUrl, duration, timestamp);

                _logger.LogInformation($"✅ Voice message broadcasted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendVoiceMessage");
                await Clients.Caller.SendAsync("Error", "Failed to send voice message: " + ex.Message);
            }
        }

        public async Task InitiateCall(string receiverId, string callType)
        {
            _logger.LogInformation($"InitiateCall called: from {Context.UserIdentifier} to {receiverId}, type: {callType}");

            var currentUser = await _userManager.GetUserAsync(Context.User);
            if (currentUser == null)
            {
                _logger.LogError("Current user is null in InitiateCall");
                await Clients.Caller.SendAsync("Error", "User not authenticated");
                return;
            }

            var callId = Guid.NewGuid().ToString();
            var callSession = new CallSession
            {
                CallId = callId,
                CallerId = currentUser.Id,
                ReceiverId = receiverId,
                CallType = callType,
                StartTime = DateTime.Now,
                Status = "ringing"
            };

            ActiveCalls[callId] = callSession;

            var senderName = currentUser.FullName ?? currentUser.Email ?? "Unknown User";

            await Clients.Group($"User_{receiverId}")
                .SendAsync("IncomingCall", callId, currentUser.Id, senderName, callType);

            _logger.LogInformation($"✅ Call initiated: {callType} from {currentUser.Id} to {receiverId}");
        }

        public async Task AcceptCall(string callId)
        {
            _logger.LogInformation($"AcceptCall called for callId: {callId}");

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            callSession.Status = "active";
            callSession.AcceptTime = DateTime.Now;

            await Clients.Group($"User_{callSession.CallerId}")
                .SendAsync("CallAccepted", callId);

            await Clients.Group($"User_{callSession.ReceiverId}")
                .SendAsync("CallAccepted", callId);

            _logger.LogInformation($"✅ Call accepted: {callId}");
        }

        public async Task RejectCall(string callId)
        {
            _logger.LogInformation($"RejectCall called for callId: {callId}");

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            callSession.Status = "rejected";
            callSession.EndTime = DateTime.Now;

            await Clients.Group($"User_{callSession.CallerId}")
                .SendAsync("CallRejected", callId);

            ActiveCalls.Remove(callId);

            _logger.LogInformation($"✅ Call rejected: {callId}");
        }

        public async Task EndCall(string callId)
        {
            _logger.LogInformation($"EndCall called for callId: {callId}");

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            callSession.Status = "ended";
            callSession.EndTime = DateTime.Now;

            await Clients.Group($"User_{callSession.CallerId}")
                .SendAsync("CallEnded", callId);

            await Clients.Group($"User_{callSession.ReceiverId}")
                .SendAsync("CallEnded", callId);

            try
            {
                var callRecord = new CallRecord
                {
                    CallerId = callSession.CallerId,
                    ReceiverId = callSession.ReceiverId,
                    CallType = callSession.CallType,
                    StartTime = callSession.StartTime,
                    EndTime = callSession.EndTime,
                    Duration = callSession.EndTime.HasValue ?
                        (int)(callSession.EndTime.Value - callSession.StartTime).TotalSeconds : 0,
                    Status = callSession.Status
                };

                _context.CallRecords.Add(callRecord);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Call record saved to database");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving call record");
            }

            ActiveCalls.Remove(callId);

            _logger.LogInformation($"✅ Call ended: {callId}");
        }

        public async Task SendOffer(string callId, string offer)
        {
            _logger.LogInformation($"SendOffer called for callId: {callId}");

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            await Clients.Group($"User_{callSession.ReceiverId}")
                .SendAsync("ReceiveOffer", callId, offer);

            _logger.LogInformation($"✅ Offer sent for call: {callId}");
        }

        public async Task SendAnswer(string callId, string answer)
        {
            _logger.LogInformation($"SendAnswer called for callId: {callId}");

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            await Clients.Group($"User_{callSession.CallerId}")
                .SendAsync("ReceiveAnswer", callId, answer);

            _logger.LogInformation($"✅ Answer sent for call: {callId}");
        }

        public async Task SendIceCandidate(string callId, string candidate)
        {
            _logger.LogInformation($"SendIceCandidate called for callId: {callId}");

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            var currentUserId = Context.UserIdentifier;
            var targetUserId = currentUserId == callSession.CallerId ?
                callSession.ReceiverId : callSession.CallerId;

            await Clients.Group($"User_{targetUserId}")
                .SendAsync("ReceiveIceCandidate", callId, candidate);

            _logger.LogInformation($"✅ ICE candidate sent for call: {callId}");
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"🔌 User connected: {Context.UserIdentifier} with connection {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            _logger.LogInformation($"🔌 User disconnected: {Context.UserIdentifier} with connection {Context.ConnectionId}");

            var userCalls = ActiveCalls.Values.Where(c =>
                c.CallerId == Context.UserIdentifier || c.ReceiverId == Context.UserIdentifier).ToList();

            foreach (var call in userCalls)
            {
                await EndCall(call.CallId);
            }

            if (exception != null)
            {
                _logger.LogError(exception, "Disconnection due to exception");
            }
            await base.OnDisconnectedAsync(exception);
        }
    }

    public class CallSession
    {
        public string CallId { get; set; }
        public string CallerId { get; set; }
        public string ReceiverId { get; set; }
        public string CallType { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? AcceptTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string Status { get; set; }
    }
}
