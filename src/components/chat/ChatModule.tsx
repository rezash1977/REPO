import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { triggerUnreadCountUpdate } from '@/hooks/useUnreadMessagesCount';

interface ChatModuleProps {
  user: any;
  toast: any;
  initialAdId?: string;
  initialReceiverId?: string;
  onClose?: () => void;
}

const ChatModule: React.FC<ChatModuleProps> = ({ user, toast, initialAdId, initialReceiverId, onClose }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ ad_id: string, user1: string, user2: string, adTitle?: string, otherUserName?: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Store userMap for nicknames
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [otherUserProfile, setOtherUserProfile] = useState<{ nickname?: string; full_name?: string } | null>(null);

  // Fetch conversations (aggregate by ad_id and both user IDs, sorted)
  useEffect(() => {
    // فقط یک بار هنگام ورود به صفحه (mount)
    const fetchConversations = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('messages')
        .select('ad_id, sender_id, receiver_id, content, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const convMap = new Map();
        data.forEach(msg => {
          const users = [msg.sender_id, msg.receiver_id].sort();
          const key = msg.ad_id + '-' + users[0] + '-' + users[1];
          if (!convMap.has(key)) {
            // نمایش نام کاربر مقابل
            const otherUserId = users[0] === user.id ? users[1] : users[0];
            convMap.set(key, {
              ad_id: msg.ad_id,
              user1: users[0],
              user2: users[1],
              lastMessage: msg.content,
              lastMessageDate: msg.created_at,
              otherUserName: otherUserId, // will be replaced with nickname/full_name
              adTitle: '',
            });
          }
        });
        // Fetch ad titles and user names
        const adIds = Array.from(new Set(Array.from(convMap.values()).map(c => c.ad_id)));
        const userIds = Array.from(new Set(Array.from(convMap.values()).map(c => [c.user1, c.user2]).flat()));
        // Fetch ad titles
        if (adIds.length > 0) {
          const { data: adsData } = await supabase
            .from('ads')
            .select('id, title')
            .in('id', adIds);
          if (adsData) {
            const adMap = new Map(adsData.map(ad => [ad.id, ad.title]));
            convMap.forEach(conv => {
              conv.adTitle = adMap.get(conv.ad_id) || conv.ad_id;
            });
          }
        }
        // Fetch user names
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('profiles')
            .select('id, full_name, nickname')
            .in('id', userIds);
          if (usersData && Array.isArray(usersData)) {
            const map: Record<string, string> = {};
            usersData.forEach((u: any) => {
              map[u.id] = u.nickname || u.full_name || u.id;
            });
            setUserMap(map);
            convMap.forEach(conv => {
              const otherUserId = conv.user1 === user.id ? conv.user2 : conv.user1;
              conv.otherUserName = map[otherUserId] || otherUserId;
            });
          }
        }
        setConversations(Array.from(convMap.values()));
      } else {
        setConversations([]);
      }
    };
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // باز شدن خودکار چت با آگهی‌دهنده (در صورت وجود prop)
  useEffect(() => {
    if (!user || !initialAdId || !initialReceiverId) return;
    // اگر گفتگو وجود دارد، آن را پیدا کن
    const conv = conversations.find(
      c => c.ad_id === initialAdId &&
        ([c.user1, c.user2].includes(user.id) && [c.user1, c.user2].includes(initialReceiverId))
    );
    if (conv) {
      setSelectedChat({
        ad_id: conv.ad_id,
        user1: conv.user1,
        user2: conv.user2,
        adTitle: conv.adTitle,
        otherUserName: conv.otherUserName,
      });
    } else {
      // اگر گفتگو وجود ندارد، یک گفتگو جدید با این دو کاربر و ad_id بساز
      const users = [user.id, initialReceiverId].sort();
      setSelectedChat({
        ad_id: initialAdId,
        user1: users[0],
        user2: users[1],
        adTitle: '',
        otherUserName: '',
      });
    }
    // فقط یک بار پس از mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialAdId, initialReceiverId, conversations.length]);

  // تابع واکشی پیام‌ها (برای استفاده مجدد)
  const fetchChatMessages = async () => {
    if (!user || !selectedChat) return;
    setChatLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*') // فقط پیام‌ها را بگیر، join نکن
      .eq('ad_id', selectedChat.ad_id)
      .in('sender_id', [selectedChat.user1, selectedChat.user2])
      .in('receiver_id', [selectedChat.user1, selectedChat.user2])
      .order('created_at', { ascending: true });
    if (!error && data) {
      setChatMessages(data);
      // پیام‌های دریافتی و خوانده نشده را خوانده شده کن
      const unreadIds = data
        .filter(msg => msg.receiver_id === user.id && !msg.is_read)
        .map(msg => msg.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadIds);
        triggerUnreadCountUpdate(); // فوراً هوک را به‌روزرسانی کن
      }
      // دریافت پروفایل مخاطب
      const otherUserId = selectedChat.user1 === user.id ? selectedChat.user2 : selectedChat.user1;
      if (otherUserId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nickname, full_name')
          .eq('id', otherUserId)
          .single();
        setOtherUserProfile(profileData || null);
      } else {
        setOtherUserProfile(null);
      }
    } else {
      setChatMessages([]);
      setOtherUserProfile(null);
    }
    setChatLoading(false);
    // اسکرول به آخرین پیام
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // استفاده از تابع جدید در useEffect
  useEffect(() => {
    // فقط هنگام باز شدن مودال فوکوس کن (رفرش پیام‌ها را اینجا انجام نده)
    setTimeout(() => {
      if (selectedChat && inputRef.current) inputRef.current.focus();
    }, 200);
  }, [selectedChat]);

  // واکشی پیام‌ها هنگام تغییر چت انتخاب‌شده
  useEffect(() => {
    if (selectedChat) {
      fetchChatMessages();
      // فوکوس روی input هنگام باز شدن چت جدید
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  // Auto-scroll to last message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Real-time new message
  useEffect(() => {
    if (!selectedChat) return;
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (
          (payload.new.sender_id === selectedChat.user1 && payload.new.receiver_id === selectedChat.user2) ||
          (payload.new.sender_id === selectedChat.user2 && payload.new.receiver_id === selectedChat.user1)
        ) {
          // پیام جدید دریافت شد، پیام‌ها را واکشی کن و اسکرول کن
          fetchChatMessages();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChat]);

  // Send reply (always include ad_id)
  const handleSendReply = async () => {
    if (!user || !selectedChat || !replyText.trim()) return;
    // تعیین گیرنده: کاربری که شما نیستید
    const receiverId = selectedChat.user1 === user.id ? selectedChat.user2 : selectedChat.user1;
    // Debug log
    console.log('SEND', {
      ad_id: selectedChat.ad_id,
      sender_id: user.id,
      receiver_id: receiverId,
      content: replyText.trim(),
    });
    if (!selectedChat.ad_id || !user.id || !receiverId || !replyText.trim()) {
      toast({ title: 'خطا: اطلاعات پیام ناقص است.' });
      setReplySending(false);
      return;
    }
    setReplySending(true);
    const { error } = await supabase
      .from('messages')
      .insert([{
        ad_id: selectedChat.ad_id,
        sender_id: user.id,
        receiver_id: receiverId,
        content: replyText.trim(),
      }]);
    setReplySending(false);
    if (!error) {
      setReplyText('');
      // پس از ارسال موفق، پیام‌ها را مجدداً واکشی کن و اسکرول کن
      fetchChatMessages();
      // فوکوس مجدد روی input
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    } else {
      toast({ title: 'خطا در ارسال پیام' });
    }
  };

  // Conversation list UI
  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg shadow-sm mb-4">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold">گفتگوهای من</h2>
        </div>
        {conversations.length === 0 ? (
          <div className="p-4 text-gray-400">گفتگویی وجود ندارد.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {conversations.map(conv => (
              <li
                key={conv.ad_id + '-' + conv.user1 + '-' + conv.user2}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedChat && selectedChat.ad_id === conv.ad_id && ((selectedChat.user1 === conv.user1 && selectedChat.user2 === conv.user2) || (selectedChat.user1 === conv.user2 && selectedChat.user2 === conv.user1)) ? 'bg-violet-50' : ''}`}
                onClick={() => {
                  const users = [conv.user1, conv.user2].sort();
                  setSelectedChat({ ad_id: conv.ad_id, user1: users[0], user2: users[1], adTitle: conv.adTitle, otherUserName: conv.otherUserName });
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="font-bold text-xs text-violet-700">{conv.adTitle}</div>
                  <div className="font-medium text-sm text-gray-700">{conv.otherUserName}</div>
                  <div className="text-xs text-gray-500">آخرین پیام: {conv.lastMessage}</div>
                  <div className="ml-auto text-xs text-gray-400">{new Date(conv.lastMessageDate).toLocaleDateString('fa-IR')}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* نمایش پیام‌های یک چت در مودال */}
      {selectedChat && (
        <>
          {/* Modal overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center"
            onClick={e => {
              // فقط اگر روی خود overlay کلیک شد (نه داخل مودال)
              if (e.target === e.currentTarget) {
                setSelectedChat(null);
                if (onClose) onClose();
              }
            }}
          >
            {/* Chat modal */}
            <div
              className="bg-white rounded-3xl shadow-2xl flex flex-col z-50 relative border border-gray-200"
              style={{ width: 420, height: '80vh', direction: 'rtl', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Conversation list at top of modal */}
              <div className="overflow-x-auto border-b border-gray-100 bg-gradient-to-l from-violet-100 to-white p-2 flex gap-2 sticky top-0 z-20 rounded-t-2xl" style={{ direction: 'rtl' }}>
                {conversations.map(conv => {
                  const users = [conv.user1, conv.user2].sort();
                  return (
                    <button
                      key={conv.ad_id + '-' + conv.user1 + '-' + conv.user2}
                      className={`px-3 py-2 rounded-lg flex flex-col items-center min-w-[100px] max-w-[140px] whitespace-nowrap text-xs font-medium transition-all ${selectedChat.ad_id === conv.ad_id && ((selectedChat.user1 === conv.user1 && selectedChat.user2 === conv.user2) || (selectedChat.user1 === conv.user2 && selectedChat.user2 === conv.user1)) ? 'bg-violet-100 text-violet-700' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setSelectedChat({ ad_id: conv.ad_id, user1: users[0], user2: users[1], adTitle: conv.adTitle, otherUserName: conv.otherUserName })}
                    >
                      <span className="font-bold truncate w-full">{conv.adTitle}</span>
                      <span className="truncate w-full">{conv.otherUserName}</span>
                    </button>
                  );
                })}
              </div>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-[48px] bg-white z-10 rounded-t-2xl shadow-sm">
                <div className="bg-violet-100 rounded-full p-2 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-violet-600" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-bold text-base text-gray-800">
                    {otherUserProfile?.nickname || otherUserProfile?.full_name || userMap[selectedChat.user1 === user.id ? selectedChat.user2 : selectedChat.user1] || 'کاربر ناشناس'}
                  </span>
                  <span className="text-xs text-violet-700 font-bold mt-1">{selectedChat.adTitle}</span>
                </div>
                <button className="ml-auto text-gray-400 hover:text-red-500 transition-colors" onClick={() => {
                  setSelectedChat(null);
                  if (onClose) onClose();
                }}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
                {chatLoading ? (
                  <div className="p-4 text-gray-500">در حال بارگذاری پیام‌ها...</div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {chatMessages.map(msg => (
                      <li key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative px-4 py-2 rounded-2xl max-w-[75%] shadow-sm ${msg.sender_id === user.id ? 'bg-gradient-to-l from-violet-400 to-violet-200 text-white self-end' : 'bg-white text-gray-800 border border-gray-200 self-start'}`} style={{ wordBreak: 'break-word' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-xs">
                              {msg.sender_id === user.id
                                ? (userMap[msg.sender_id] || 'شما')
                                : (otherUserProfile?.nickname || otherUserProfile?.full_name || userMap[msg.sender_id] || 'کاربر ناشناس')}
                            </span>
                          </div>
                          <div className="text-sm leading-relaxed">{msg.content}</div>
                          <div className="text-xs text-gray-400 mt-1 text-left">{new Date(msg.created_at).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </li>
                    ))}
                    <div ref={messagesEndRef} />
                  </ul>
                )}
              </div>
              <div className="p-4 border-t flex gap-2 sticky bottom-0 bg-white z-10 rounded-b-2xl">
                <input
                  type="text"
                  className="flex-1 border border-violet-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 text-base transition-all"
                  placeholder="پیام خود را بنویسید..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  disabled={replySending}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendReply(); }}
                  ref={inputRef}
                />
                <button
                  className="bg-gradient-to-l from-violet-500 to-violet-400 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:from-violet-600 hover:to-violet-500 transition-all disabled:opacity-50"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || replySending}
                >
                  ارسال
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatModule; 