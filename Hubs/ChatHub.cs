using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
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
            if (string.IsNullOrEmpty(receiverId))
            {
                _logger.LogWarning("receiverId is null or empty in SendMessage");
                return;
            }
            if (string.IsNullOrEmpty(message))
            {
                _logger.LogWarning("message is null or empty in SendMessage");
                return;
            }
            if (string.IsNullOrEmpty(messageType))
            {
                _logger.LogWarning("messageType is null or empty in SendMessage");
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
                IsRead = false
            };

            _context.Messages.Add(messageEntity);
            await _context.SaveChangesAsync();

            var senderName = sender.GetDisplayName();
            await Clients.Group($"User_{receiverId}").SendAsync("ReceiveMessage", sender.Id, senderName, message, messageType, messageEntity.SentAt.ToString("o"));
            await Clients.Caller.SendAsync("ReceiveMessage", sender.Id, senderName, message, messageType, messageEntity.SentAt.ToString("o"));
        }


        public async Task SendVoiceMessage(string receiverId, string voiceUrl, int duration)
        {
            if (string.IsNullOrEmpty(receiverId))
            {
                _logger.LogWarning("receiverId is null or empty in SendVoiceMessage");
                return;
            }
            if (string.IsNullOrEmpty(voiceUrl))
            {
                _logger.LogWarning("voiceUrl is null or empty in SendVoiceMessage");
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

            var senderName = sender.GetDisplayName();
            await Clients.Group($"User_{receiverId}").SendAsync("ReceiveVoiceMessage", sender.Id, senderName, voiceUrl, duration, messageEntity.SentAt.ToString("o"));
            await Clients.Caller.SendAsync("ReceiveVoiceMessage", sender.Id, senderName, voiceUrl, duration, messageEntity.SentAt.ToString("o"));
        }

        public async Task SendMediaMessage(string receiverId, string fileUrl, string mediaType, string fileName, long fileSize)
        {
            if (string.IsNullOrEmpty(receiverId))
            {
                _logger.LogWarning("receiverId is null or empty in SendMediaMessage");
                return;
            }
            if (string.IsNullOrEmpty(fileUrl))
            {
                _logger.LogWarning("fileUrl is null or empty in SendMediaMessage");
                return;
            }
            if (string.IsNullOrEmpty(mediaType))
            {
                _logger.LogWarning("mediaType is null or empty in SendMediaMessage");
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
                MessageType = mediaType, // "image", "video", or "document"
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Messages.Add(messageEntity);
            await _context.SaveChangesAsync();

            var senderName = sender.GetDisplayName();
            await Clients.Group($"User_{receiverId}").SendAsync("ReceiveMediaMessage", sender.Id, senderName, fileUrl, mediaType, fileName, fileSize, messageEntity.SentAt.ToString("o"));
            await Clients.Caller.SendAsync("ReceiveMediaMessage", sender.Id, senderName, fileUrl, mediaType, fileName, fileSize, messageEntity.SentAt.ToString("o"));
        }
    }
}