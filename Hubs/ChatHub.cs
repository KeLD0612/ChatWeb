using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using webchat.Models;

namespace webchat.Hubs
{
    public class CallSession
    {
        public string CallerId { get; set; }
        public string ReceiverId { get; set; }
        public string CallType { get; set; }
    }

    public class ChatHub : Hub
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ChatHub> _logger;
        private static readonly ConcurrentDictionary<string, CallSession> ActiveCalls = new ConcurrentDictionary<string, CallSession>();

        public ChatHub(UserManager<ApplicationUser> userManager, ApplicationDbContext context, ILogger<ChatHub> logger)
        {
            _userManager = userManager;
            _context = context;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var user = await _userManager.GetUserAsync(Context.User);
            if (user != null)
            {
                _logger.LogInformation($"User connected: {user.Id} ({user.GetDisplayName()})");
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{user.Id}");
            }
            else
            {
                _logger.LogWarning("No authenticated user found on connection");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var user = await _userManager.GetUserAsync(Context.User);
            if (user != null)
            {
                _logger.LogInformation($"User disconnected: {user.Id} ({user.GetDisplayName()})");
                var callsToRemove = ActiveCalls.Where(c => c.Value.CallerId == user.Id || c.Value.ReceiverId == user.Id).ToList();
                foreach (var call in callsToRemove)
                {
                    if (ActiveCalls.TryRemove(call.Key, out _))
                    {
                        await Clients.Group($"User_{call.Value.ReceiverId}").SendAsync("CallEnded", call.Key);
                        await Clients.Group($"User_{call.Value.CallerId}").SendAsync("CallEnded", call.Key);
                        _logger.LogInformation($"Cleaned up call {call.Key} due to user disconnection");
                    }
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendReplyMessage(string receiverId, string message, string messageType, int replyToMessageId)
        {
            _logger.LogInformation($"=== SendReplyMessage DEBUG START: receiverId={receiverId}, messageType={messageType}, replyToId={replyToMessageId}");

            if (string.IsNullOrEmpty(receiverId))
            {
                _logger.LogWarning("ReceiverId is null or empty in SendReplyMessage");
                return;
            }
            if (string.IsNullOrEmpty(message))
            {
                _logger.LogWarning("Message is null or empty in SendReplyMessage");
                return;
            }

            var sender = await _userManager.GetUserAsync(Context.User);
            if (sender == null)
            {
                _logger.LogWarning("Sender is not authenticated in SendReplyMessage");
                return;
            }

            // Lấy tin nhắn được reply
            var repliedMessage = await _context.Messages
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(m => m.Id == replyToMessageId);

            if (repliedMessage == null)
            {
                _logger.LogWarning($"Replied message not found: {replyToMessageId}");
                return;
            }

            var messageEntity = new Message
            {
                SenderId = sender.Id,
                ReceiverId = receiverId,
                Content = message,
                MessageType = messageType,
                SentAt = DateTime.UtcNow,
                IsRead = false,
                RepliedMessageId = replyToMessageId,
                RecalledFor = null
            };

            _context.Messages.Add(messageEntity);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Reply message saved with Id: {messageEntity.Id}");

            var senderName = sender.GetDisplayName();

            // Tạo object reply message info
            var replyInfo = new
            {
                id = repliedMessage.Id,
                senderName = repliedMessage.Sender?.GetDisplayName() ?? "Unknown",
                content = repliedMessage.Content
            };

            // Gửi tin nhắn với thông tin reply
            await Clients.Group($"User_{receiverId}").SendAsync("ReceiveReplyMessage",
                sender.Id, senderName, message, messageType, messageEntity.SentAt.ToString("o"),
                messageEntity.Id, replyToMessageId, replyInfo);

            await Clients.Caller.SendAsync("ReceiveReplyMessage",
                sender.Id, senderName, message, messageType, messageEntity.SentAt.ToString("o"),
                messageEntity.Id, replyToMessageId, replyInfo);

            _logger.LogInformation($"Reply message sent to User_{receiverId} and Caller with Id: {messageEntity.Id}");
        }

        public async Task JoinUserGroup(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("JoinUserGroup called with null or empty userId");
                return;
            }
            _logger.LogInformation($"Joining user {userId} to group User_{userId}");
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        }

        public async Task InitiateCall(string targetUserId, string callType)
        {
            _logger.LogInformation($"InitiateCall called with targetUserId: {targetUserId}, callType: {callType}");
            if (string.IsNullOrEmpty(targetUserId))
            {
                _logger.LogWarning("targetUserId is null or empty in InitiateCall");
                return;
            }
            if (string.IsNullOrEmpty(callType))
            {
                _logger.LogWarning("callType is null or empty in InitiateCall");
                return;
            }

            var caller = await _userManager.GetUserAsync(Context.User);
            if (caller == null)
            {
                _logger.LogWarning("Caller is not authenticated in InitiateCall");
                return;
            }

            var callId = Guid.NewGuid().ToString();
            var callSession = new CallSession
            {
                CallerId = caller.Id,
                ReceiverId = targetUserId,
                CallType = callType
            };

            if (ActiveCalls.TryAdd(callId, callSession))
            {
                _logger.LogInformation($"Call session created: {callId}, Caller: {caller.Id}, Receiver: {targetUserId}, Type: {callType}");
                var callerName = caller.GetDisplayName();
                await Clients.Group($"User_{targetUserId}").SendAsync("IncomingCall", callId, caller.Id, callerName, callType);
            }
            else
            {
                _logger.LogWarning($"Failed to add call session: {callId}");
            }
        }

        public async Task AcceptCall(string callId)
        {
            _logger.LogInformation($"AcceptCall called with callId: {callId}");
            if (string.IsNullOrEmpty(callId))
            {
                _logger.LogWarning("callId is null or empty in AcceptCall");
                return;
            }

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            var receiver = await _userManager.GetUserAsync(Context.User);
            if (receiver == null || receiver.Id != callSession.ReceiverId)
            {
                _logger.LogWarning($"Invalid receiver for call: {callId}, User: {receiver?.Id}");
                return;
            }

            _logger.LogInformation($"Call {callId} accepted by {receiver.Id}");
            await Clients.Group($"User_{callSession.CallerId}").SendAsync("CallAccepted", callId);
        }

        public async Task RejectCall(string callId)
        {
            _logger.LogInformation($"RejectCall called with callId: {callId}");
            if (string.IsNullOrEmpty(callId))
            {
                _logger.LogWarning("callId is null or empty in RejectCall");
                return;
            }

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            if (ActiveCalls.TryRemove(callId, out _))
            {
                _logger.LogInformation($"Call {callId} rejected and removed");
                await Clients.Group($"User_{callSession.CallerId}").SendAsync("CallRejected", callId);
            }
        }

        public async Task EndCall(string callId)
        {
            _logger.LogInformation($"EndCall called with callId: {callId}");
            if (string.IsNullOrEmpty(callId))
            {
                _logger.LogWarning("callId is null or empty in EndCall");
                return;
            }

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            if (ActiveCalls.TryRemove(callId, out _))
            {
                _logger.LogInformation($"Call {callId} ended and removed");
                await Clients.Group($"User_{callSession.CallerId}").SendAsync("CallEnded", callId);
                await Clients.Group($"User_{callSession.ReceiverId}").SendAsync("CallEnded", callId);
            }
        }

        public async Task SendOffer(string callId, string offer)
        {
            _logger.LogInformation($"SendOffer called with callId: {callId}, offer length: {offer?.Length}");
            if (string.IsNullOrEmpty(callId))
            {
                _logger.LogWarning("callId is null or empty in SendOffer");
                return;
            }
            if (string.IsNullOrEmpty(offer))
            {
                _logger.LogWarning("offer is null or empty in SendOffer");
                return;
            }

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            await Clients.Group($"User_{callSession.ReceiverId}").SendAsync("ReceiveOffer", callId, offer);
            _logger.LogInformation($"Offer sent for call: {callId} to User_{callSession.ReceiverId}");
        }

        public async Task SendAnswer(string callId, string answer)
        {
            _logger.LogInformation($"SendAnswer called with callId: {callId}, answer length: {answer?.Length}");
            if (string.IsNullOrEmpty(callId))
            {
                _logger.LogWarning("callId is null or empty in SendAnswer");
                return;
            }
            if (string.IsNullOrEmpty(answer))
            {
                _logger.LogWarning("answer is null or empty in SendAnswer");
                return;
            }

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            await Clients.Group($"User_{callSession.CallerId}").SendAsync("ReceiveAnswer", callId, answer);
            _logger.LogInformation($"Answer sent for call: {callId} to User_{callSession.CallerId}");
        }

        public async Task SendIceCandidate(string callId, string candidate)
        {
            _logger.LogInformation($"SendIceCandidate called with callId: {callId}, candidate length: {candidate?.Length}");
            if (string.IsNullOrEmpty(callId))
            {
                _logger.LogWarning("callId is null or empty in SendIceCandidate");
                return;
            }
            if (string.IsNullOrEmpty(candidate))
            {
                _logger.LogWarning("candidate is null or empty in SendIceCandidate");
                return;
            }

            if (!ActiveCalls.TryGetValue(callId, out var callSession))
            {
                _logger.LogWarning($"Call session not found: {callId}");
                return;
            }

            var sender = await _userManager.GetUserAsync(Context.User);
            var targetUserId = sender.Id == callSession.CallerId ? callSession.ReceiverId : callSession.CallerId;
            await Clients.Group($"User_{targetUserId}").SendAsync("ReceiveIceCandidate", callId, candidate);
            _logger.LogInformation($"ICE candidate sent for call: {callId} to User_{targetUserId}");
        }


        public async Task SendMessage(string receiverId, string message, string messageType)
        {
            _logger.LogInformation($"=== SendMessage DEBUG START: receiverId={receiverId}, messageType={messageType}', contentLength={message?.Length}");

            if (string.IsNullOrEmpty(receiverId))
            {
                _logger.LogWarning("ReceiverId is null or empty in SendMessage");
                return;
            }
            if (string.IsNullOrEmpty(message))
            {
                _logger.LogWarning("Message is null or empty in SendMessage");
                return;
            }
            if (string.IsNullOrEmpty(messageType))
            {
                _logger.LogWarning("MessageType is null or empty in SendMessage");
                return;
            }

            var sender = await _userManager.GetUserAsync(Context.User);
            if (sender == null)
            {
                _logger.LogWarning("Sender is not authenticated in SendMessage");
                return;
            }

            var messageEntity = new Message
            {
                SenderId = sender.Id,
                ReceiverId = receiverId,
                Content = message,
                MessageType = messageType,
                SentAt = DateTime.UtcNow,
                IsRead = false,
                RecalledFor = null
            };

            _context.Messages.Add(messageEntity);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Message saved with Id: {messageEntity.Id}");

            var senderName = sender.GetDisplayName();
            // Thêm messageEntity.Id vào sự kiện ReceiveMessage
            await Clients.Group($"User_{receiverId}").SendAsync("ReceiveMessage", sender.Id, senderName, message, messageType, messageEntity.SentAt.ToString("o"), messageEntity.Id);
            await Clients.Caller.SendAsync("ReceiveMessage", sender.Id, senderName, message, messageType, messageEntity.SentAt.ToString("o"), messageEntity.Id);
            _logger.LogInformation($"Message sent to User_{receiverId} and Caller with Id: {messageEntity.Id}");
        }

        public async Task SendVoiceMessage(string receiverId, string voiceUrl, int duration)
        {
            _logger.LogInformation($"=== SendVoiceMessage DEBUG START: receiverId={receiverId}, voiceUrl={voiceUrl}, duration={duration}");

            if (string.IsNullOrEmpty(receiverId))
            {
                _logger.LogWarning("ReceiverId is null or empty in SendVoiceMessage");
                return;
            }
            if (string.IsNullOrEmpty(voiceUrl))
            {
                _logger.LogWarning("VoiceUrl is null or empty in SendVoiceMessage");
                return;
            }

            var sender = await _userManager.GetUserAsync(Context.User);
            if (sender == null)
            {
                _logger.LogWarning("Sender is not authenticated in SendVoiceMessage");
                return;
            }

            var messageEntity = new Message
            {
                SenderId = sender.Id,
                ReceiverId = receiverId,
                Content = voiceUrl,
                MessageType = "voice",
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Messages.Add(messageEntity);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Voice message saved with Id: {messageEntity.Id}");

            var senderName = sender.GetDisplayName();
            // Thêm messageEntity.Id
            await Clients.Group($"User_{receiverId}").SendAsync("ReceiveVoiceMessage", sender.Id, senderName, voiceUrl, duration, messageEntity.SentAt.ToString("o"), messageEntity.Id);
            await Clients.Caller.SendAsync("ReceiveVoiceMessage", sender.Id, senderName, voiceUrl, duration, messageEntity.SentAt.ToString("o"), messageEntity.Id);
            _logger.LogInformation($"Voice message sent to User_{receiverId} and Caller with Id: {messageEntity.Id}");
        }
        public async Task SendMediaMessage(string receiverId, string fileUrl, string mediaType, string fileName, long fileSize)
        {
            _logger.LogInformation($"=== SendMediaMessage DEBUG START: receiverId={receiverId}, mediaType={mediaType}, fileUrl={fileUrl}");

            if (string.IsNullOrEmpty(receiverId))
            {
                _logger.LogWarning("ReceiverId is null or empty in SendMediaMessage");
                return;
            }
            if (string.IsNullOrEmpty(fileUrl))
            {
                _logger.LogWarning("FileUrl is null or empty in SendMediaMessage");
                return;
            }
            if (string.IsNullOrEmpty(mediaType))
            {
                _logger.LogWarning("MediaType is null or empty in SendMediaMessage");
                return;
            }

            var sender = await _userManager.GetUserAsync(Context.User);
            if (sender == null)
            {
                _logger.LogWarning("Sender is not authenticated in SendMediaMessage");
                return;
            }

            var messageEntity = new Message
            {
                SenderId = sender.Id,
                ReceiverId = receiverId,
                Content = fileUrl,
                MessageType = mediaType,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Messages.Add(messageEntity);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Media message saved with Id: {messageEntity.Id}");

            var senderName = sender.GetDisplayName();
            // Thêm messageEntity.Id
            await Clients.Group($"User_{receiverId}").SendAsync("ReceiveMediaMessage", sender.Id, senderName, fileUrl, mediaType, fileName, fileSize, messageEntity.SentAt.ToString("o"), messageEntity.Id);
            await Clients.Caller.SendAsync("ReceiveMediaMessage", sender.Id, senderName, fileUrl, mediaType, fileName, fileSize, messageEntity.SentAt.ToString("o"), messageEntity.Id);
            _logger.LogInformation($"Media message sent to User_{receiverId} and Caller with Id: {messageEntity.Id}");
        }
        // Thêm method này vào ChatHub.cs

        // Thêm method này vào ChatHub.cs

        public async Task SendReaction(int messageId, string reactionType)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId))
            {
                await Clients.Caller.SendAsync("Error", "User not authenticated");
                return;
            }

            try
            {
                // Kiểm tra tin nhắn tồn tại
                var message = await _context.Messages
                    .Include(m => m.Reactions)
                    .FirstOrDefaultAsync(m => m.Id == messageId);

                if (message == null)
                {
                    await Clients.Caller.SendAsync("Error", "Message not found");
                    return;
                }

                // Kiểm tra user có quyền react
                if (message.SenderId != userId && message.ReceiverId != userId)
                {
                    await Clients.Caller.SendAsync("Error", "Unauthorized to react to this message");
                    return;
                }

                // Validate reaction type
                var validReactions = new[] { "like", "love", "haha", "wow", "sad", "angry" };
                if (!validReactions.Contains(reactionType.ToLower()))
                {
                    await Clients.Caller.SendAsync("Error", "Invalid reaction type");
                    return;
                }

                // Kiểm tra reaction hiện tại
                var existingReaction = await _context.MessageReactions
                    .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId);

                if (existingReaction != null)
                {
                    // Toggle reaction
                    if (existingReaction.ReactionType == reactionType)
                    {
                        _context.MessageReactions.Remove(existingReaction);
                    }
                    else
                    {
                        existingReaction.ReactionType = reactionType;
                        existingReaction.CreatedAt = DateTime.Now;
                    }
                }
                else
                {
                    // Thêm reaction mới
                    var newReaction = new MessageReaction
                    {
                        MessageId = messageId,
                        UserId = userId,
                        ReactionType = reactionType,
                        CreatedAt = DateTime.Now
                    };
                    _context.MessageReactions.Add(newReaction);
                }

                await _context.SaveChangesAsync();

                // Load updated reactions
                var updatedReactions = await _context.MessageReactions
                    .Where(r => r.MessageId == messageId)
                    .Include(r => r.User)
                    .Select(r => new
                    {
                        reactionType = r.ReactionType,
                        userId = r.UserId,
                        userName = r.User != null ? r.User.GetDisplayName() : "Unknown"
                    })
                    .ToListAsync();

                // Notify both users
                var otherUserId = message.SenderId == userId ? message.ReceiverId : message.SenderId;

                await Clients.User(userId).SendAsync("UpdateReactions", messageId, updatedReactions);
                await Clients.User(otherUserId).SendAsync("UpdateReactions", messageId, updatedReactions);

                _logger.LogInformation($"Reaction updated for message {messageId} by user {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendReaction");
                await Clients.Caller.SendAsync("Error", "Failed to update reaction");
            }
        }

        // Thêm vào ChatHub.cs
        public async Task SendLocationMessage(string receiverId, double latitude, double longitude, string locationName)
        {
            var sender = await _userManager.GetUserAsync(Context.User);
            if (sender == null)
            {
                throw new HubException("User not authenticated");
            }

            var locationMessage = new LocationMessage
            {
                SenderId = sender.Id,
                ReceiverId = receiverId,
                Latitude = latitude,
                Longitude = longitude,
                LocationName = locationName,
                SentAt = DateTime.Now
            };

            _context.LocationMessages.Add(locationMessage);
            await _context.SaveChangesAsync();

            // Generate a static map image URL using Google Maps Static API
            string mapImageUrl = $"https://maps.googleapis.com/maps/api/staticmap?center={latitude},{longitude}&zoom=15&size=300x200&markers=color:red%7C{latitude},{longitude}&key=AIzaSyCQKMXgZ4vpzAW_TityXgmemWfy9vLvW44";
            locationMessage.MapImageUrl = mapImageUrl;
            await _context.SaveChangesAsync();

            // Send to the specific receiver
            await Clients.User(receiverId).SendAsync(
                "ReceiveLocationMessage",
                sender.Id,
                sender.GetDisplayName(),
                latitude,
                longitude,
                locationName,
                mapImageUrl,
                locationMessage.SentAt.ToString("o"),
                locationMessage.Id);

            // Send to the sender as well (for self-view)
            await Clients.Caller.SendAsync(
                "ReceiveLocationMessage",
                sender.Id,
                sender.GetDisplayName(),
                latitude,
                longitude,
                locationName,
                mapImageUrl,
                locationMessage.SentAt.ToString("o"),
                locationMessage.Id);
        }
    }
}