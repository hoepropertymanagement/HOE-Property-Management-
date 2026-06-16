/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar, { useSidebarCollapse } from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { 
  MessageSquare, Search, Filter, MoreVertical, 
  Send, Phone, Video, Info, ArrowLeft, 
  CheckCheck, Clock, Paperclip, Smile, Loader2, User as UserIcon,
  Pin, PinOff, X, FileText, Calendar, Check, XCircle, ShieldCheck, Sparkles
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../lib/firebase';
import { 
  collection, query as fireQuery, where as fireWhere, onSnapshot, orderBy, 
  addDoc, serverTimestamp, doc, getDoc, updateDoc, 
  setDoc, limit, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firebase-utils';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  status?: 'sent' | 'delivered' | 'read';
  image?: string;
  document?: string;
  documentName?: string;
  documentType?: string;
}

interface Chat {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: any;
  propertyId: string;
  pinnedByUsers?: string[];
  pinnedMessage?: {
    id: string;
    text: string;
    senderName: string;
  } | null;
  otherUser?: {
    uid: string;
    name: string;
    photoURL: string;
    isPublicContact: boolean;
    showPhoneNumber: boolean;
    contactNumber?: string;
  };
}

interface ViewingPayload {
  days: string[];
  times: string[];
  specificDate: string;
  status: 'pending' | 'confirmed' | 'declined';
  confirmedDateTime?: string;
  isEdited?: boolean;
}

const ViewingRequestWidget = ({ 
  message, 
  isCurrentUser, 
  onUpdate 
}: { 
  message: Message, 
  isCurrentUser: boolean,
  onUpdate: (msgId: string, newPayload: ViewingPayload) => void
}) => {
  const [choosingDate, setChoosingDate] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<'this_week' | 'next_week' | 'any_time'>('this_week');
  const [customDateTime, setCustomDateTime] = useState('');

  let payload: ViewingPayload | null = null;
  try {
    const jsonStr = message.text.replace('[VIEWING_REQUEST]:', '').trim();
    payload = JSON.parse(jsonStr);
  } catch (e) {
    return <p>{message.text}</p>;
  }

  if (!payload) return <p>{message.text}</p>;

  const handleBookVerifyClick = () => {
    setChoosingDate(true);
  };

  const handleDecline = () => {
    if (!payload) return;
    onUpdate(message.id, { 
      ...payload, 
      status: 'declined' 
    });
  };

  const handleSelectSlot = (slotText: string) => {
    if (!payload) return;
    onUpdate(message.id, { 
      ...payload, 
      status: 'confirmed', 
      confirmedDateTime: slotText,
      isEdited: !isCurrentUser
    });
    setChoosingDate(false);
  };

  const handleConfirmCustom = () => {
    if (!payload || !customDateTime) return;
    const formatted = new Date(customDateTime).toLocaleString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    onUpdate(message.id, { 
      ...payload, 
      status: 'confirmed', 
      confirmedDateTime: formatted,
      isEdited: !isCurrentUser
    });
    setChoosingDate(false);
  };

  const isPending = payload.status === 'pending';
  const isConfirmed = payload.status === 'confirmed';
  const isDeclined = payload.status === 'declined';

  // Extract selected timeframe option
  const timeframe = payload.specificDate || 'This Week';

  // Predefined slots for This Week
  const thisWeekSlots = [
    "Wednesday 27 May - 10:00 AM",
    "Wednesday 27 May - 2:00 PM",
    "Friday 29 May - 11:30 AM",
    "Saturday 30 May - 3:00 PM"
  ];

  // Predefined slots for Next Week
  const nextWeekSlots = [
    "Next Monday 1 June - 10:30 AM",
    "Next Wednesday 3 June - 2:30 PM",
    "Next Thursday 4 June - 9:00 AM",
    "Next Friday 5 June - 3:00 PM"
  ];

  return (
    <div className="w-full max-w-sm rounded-[2rem] border border-accent/20 overflow-hidden text-left bg-[#0B071E] text-white shadow-2xl relative">
      <div className="bg-gradient-to-r from-[#170E3A] to-[#0F0A2B] px-5 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3 bg-transparent">
          <div className="p-2 bg-accent/25 rounded-xl text-accent shadow-md shadow-accent/5">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-accent leading-tight">Eden Auto-Verify</h4>
            <span className="text-[10px] uppercase font-bold text-white/55 block mt-0.5">
              {isConfirmed ? 'Booking Confirmed' : isDeclined ? 'Viewing Declined' : `Timeframe: ${timeframe}`}
            </span>
          </div>
        </div>
        {isPending && !choosingDate && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
          </span>
        )}
      </div>
      
      <div className="p-5 space-y-4 bg-[#0B071E]">
        {isConfirmed ? (
          <div className="p-5 bg-green-500/10 rounded-2xl border border-green-500/30 text-center space-y-3">
             <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto shadow-sm animate-fadeIn">
               <Check className="w-6 h-6" />
             </div>
             <div>
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-400 block mb-1">Confirmed Viewing Appointment</span>
               <span className="text-xs font-bold text-green-200 block p-2.5 bg-green-500/5 rounded-xl border border-green-500/15">
                 {payload.confirmedDateTime}
               </span>
               <p className="text-[10px] text-green-400/60 font-bold uppercase tracking-wider mt-2">Verified secure by HOE Property Management</p>
             </div>
          </div>
        ) : isDeclined ? (
          <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/30 text-center space-y-2">
             <div className="w-12 h-12 rounded-full bg-red-500/20 text-[#ff4444] flex items-center justify-center mx-auto shadow-sm animate-fadeIn">
               <XCircle className="w-6 h-6" />
             </div>
             <div>
               <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff4444] block">Request Rejected</span>
               <p className="text-xs text-red-300/70 mt-1">This viewing verification has been declined.</p>
             </div>
          </div>
        ) : isPending && !choosingDate ? (
          <div className="space-y-4">
            <p className="text-xs text-white/70 leading-relaxed font-semibold">
               An automated booking verification card has been generated for timeframe <span className="text-accent underline font-black">{timeframe}</span>. Press **Book / Verify** to accept and select a specific viewing slot.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button 
                onClick={handleBookVerifyClick}
                className="w-full bg-accent text-primary hover:bg-accent/90 font-black py-3 px-4 rounded-xl shadow-lg shadow-accent/15 transition-all text-xs text-center uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] duration-100"
              >
                <Check className="w-4 h-4" />
                Book / Verify
              </button>
              <button 
                onClick={handleDecline}
                className="w-full bg-white/5 hover:bg-white/10 text-white/50 font-bold py-2.5 px-4 rounded-xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest text-center"
              >
                Reject / Decline Request
              </button>
            </div>
          </div>
        ) : (
          /* choosingDate state and selecting a slot */
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 block mb-2 cursor-default">1. Choose Week Option</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                {(['this_week', 'next_week', 'any_time'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    className={`py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all truncate ${selectedWeek === w ? 'bg-accent text-primary' : 'text-white/60 hover:bg-white/5'}`}
                  >
                    {w === 'this_week' ? 'This Week' : w === 'next_week' ? 'Next Week' : 'Any Time'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 block mb-2 cursor-default">2. Select Your Viewing Slot</span>
              
              {selectedWeek === 'this_week' && (
                <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {thisWeekSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleSelectSlot(slot)}
                      className="w-full px-4 py-3 bg-white/5 hover:bg-accent hover:text-primary rounded-xl text-left text-xs font-bold transition-all border border-white/10 hover:border-accent flex items-center justify-between group active:scale-[0.99] duration-100 text-white"
                    >
                      <span className="truncate pr-2">{slot}</span>
                      <Calendar className="w-3.5 h-3.5 text-white/20 group-hover:text-primary/70 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {selectedWeek === 'next_week' && (
                <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {nextWeekSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleSelectSlot(slot)}
                      className="w-full px-4 py-3 bg-white/5 hover:bg-accent hover:text-primary rounded-xl text-left text-xs font-bold transition-all border border-white/10 hover:border-accent flex items-center justify-between group active:scale-[0.99] duration-100 text-white"
                    >
                      <span className="truncate pr-2">{slot}</span>
                      <Calendar className="w-3.5 h-3.5 text-white/20 group-hover:text-primary/70 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {selectedWeek === 'any_time' && (
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-3">
                  <input 
                    type="datetime-local" 
                    value={customDateTime}
                    onChange={(e) => setCustomDateTime(e.target.value)}
                    className="w-full bg-[#110C35] text-white border border-white/20 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-accent"
                  />
                  <button 
                    onClick={handleConfirmCustom}
                    disabled={!customDateTime}
                    className="w-full py-2.5 bg-accent disabled:opacity-55 text-primary rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors uppercase tracking-widest text-center"
                  >
                    Confirm Custom Time
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10">
              <button 
                type="button"
                onClick={() => setChoosingDate(false)}
                className="w-full text-center text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-white transition-colors py-1"
              >
                Back to Options
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Messages({ type }: { type?: 'tenant' | 'landlord' | 'agent' }) {
  const { user, profile } = useAuth();
  const { showNotification } = useNotification();
  const { role: urlRole } = useParams();
  const [searchParams] = useSearchParams();
  const isCollapsed = useSidebarCollapse();
  const conversationIdParam = searchParams.get('id');

  const resolvedRole = type || (urlRole === 'landlord' ? 'landlord' : urlRole === 'agent' ? 'agent' : 'tenant');

  const allowedAgentEmails = ['ann.imaginator@gmail.com', 'twighlightani113@gmail.com', 'twiglightani113@gmail.com'];
  const isUserAgent = (email?: string, role?: string) => {
    return role === 'agent' || (email && allowedAgentEmails.includes(email.toLowerCase()));
  };

  const [selectedChatId, setSelectedChatId] = useState<string | null>(conversationIdParam);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [showAutoVerifyComposer, setShowAutoVerifyComposer] = useState(false);
  const [selectedComposeTimeframe, setSelectedComposeTimeframe] = useState<'This Week' | 'Next Week' | 'Any Time'>('This Week');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    dataUrl: string;
    file: File;
    name: string;
    type: string;
    isImage: boolean;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedAttachment({
        dataUrl: event.target?.result as string,
        file: file,
        name: file.name,
        type: file.type,
        isImage: isImg
      });
    };
    reader.readAsDataURL(file);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    let unsubscribe: () => void;

    const setupConversationsListener = () => {
      try {
        const q = fireQuery(collection(db, 'conversations'), fireWhere('participant_ids', 'array-contains', user.uid));
        unsubscribe = onSnapshot(q, async (snapshot) => {
          const formattedChats = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const chatDoc = docSnap.data();
            const participantIds = chatDoc.participant_ids || [];
            const otherUserId = participantIds.find((id: string) => id !== user.uid);
            
            let otherUser = null;
            if (otherUserId) {
              try {
                const userDoc = await getDoc(doc(db, 'users', otherUserId));
                if (userDoc.exists()) {
                  otherUser = userDoc.data();
                }
              } catch (err) {
                console.error("Error fetching other user profile:", err);
              }
            }

            let parsedPinnedMessage = null;
            if (chatDoc.pinned_message) {
              try {
                parsedPinnedMessage = typeof chatDoc.pinned_message === 'string' ? JSON.parse(chatDoc.pinned_message) : chatDoc.pinned_message;
              } catch (e) {
                parsedPinnedMessage = chatDoc.pinned_message;
              }
            }

            return {
              id: docSnap.id,
              propertyId: chatDoc.property_id || '',
              participantIds,
              lastMessage: chatDoc.last_message || '',
              lastMessageAt: chatDoc.last_message_at?.toDate() || null,
              pinnedByUsers: chatDoc.pinned_by_users || [],
              pinnedMessage: parsedPinnedMessage,
              otherUser
            } as Chat;
          }));

          setChats(formattedChats);
          setLoading(false);
        }, (err) => {
          console.error("Failed to load conversations:", err);
          setLoading(false);
        });
      } catch (err) {
        console.error("Error setting up conversation listener", err);
        setLoading(false);
      }
    };

    setupConversationsListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!selectedChatId || !user) {
      setMessages([]);
      return;
    }

    let unsubscribe: () => void;

    const setupMessagesListener = () => {
      try {
        const q = fireQuery(
          collection(db, 'messages'), 
          fireWhere('conversation_id', '==', selectedChatId),
          orderBy('created_at', 'asc'),
          limit(100)
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(docSnap => {
            const msg = docSnap.data();
            return {
              id: docSnap.id,
              senderId: msg.sender_id,
              text: msg.body || '',
              createdAt: msg.created_at?.toDate() || new Date(),
              image: msg.image,
              document: msg.document,
              documentName: msg.document_name,
              documentType: msg.document_type
            };
          });
          
          setMessages(msgs);
          setTimeout(scrollToBottom, 100);
        }, (err) => {
          console.error("Error fetching messages", err);
        });
      } catch (err) {
        console.error("Error in message listener", err);
      }
    };

    setupMessagesListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedChatId, user]);

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedAttachment) || !selectedChatId || !user || sending) return;

    setSending(true);
    try {
      const messageData: any = {
        conversation_id: selectedChatId,
        sender_id: user.uid,
        body: inputText,
      };

      if (selectedAttachment) {
        let downloadUrl = '';
        try {
          // Upload to Firebase Storage
          const fileExt = selectedAttachment.name.split('.').pop() || '';
          const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `chat_attachments/${user.uid}/${uniqueFileName}`;
          const fileRef = ref(storage, filePath);
          
          await uploadBytes(fileRef, selectedAttachment.file);
          downloadUrl = await getDownloadURL(fileRef);
        } catch (storageErr) {
          console.warn("Firebase Storage attachment upload failed, falling back to local base64 reader:", storageErr);
          // Standard base64 fallback so chat still functions perfectly
          downloadUrl = await new Promise<string>((resolveBase64) => {
            const r = new FileReader();
            r.onloadend = () => {
              resolveBase64(r.result as string || '');
            };
            r.onerror = () => {
              resolveBase64('');
            };
            r.readAsDataURL(selectedAttachment.file);
          });
        }

        if (downloadUrl) {
          if (selectedAttachment.isImage) {
            messageData.image = downloadUrl;
          } else {
            messageData.document = downloadUrl;
            messageData.document_name = selectedAttachment.name;
            messageData.document_type = selectedAttachment.type;
          }
        }
      }

      await addDoc(collection(db, 'messages'), {
        ...messageData,
        created_at: serverTimestamp()
      });
      
      const displayLastMsg = selectedAttachment 
        ? (selectedAttachment.isImage ? '📷 Image' : `📄 ${selectedAttachment.name}`) 
        : inputText;

      // Update last message in conversation
      await updateDoc(doc(db, 'conversations', selectedChatId), {
        last_message: displayLastMsg,
        last_message_at: serverTimestamp()
      });

      setInputText('');
      setSelectedAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleSendAutoVerifyCard = async () => {
    if (!selectedChatId || !user || sending) return;
    setSending(true);
    try {
      const payloadObj: ViewingPayload = {
        days: [selectedComposeTimeframe],
        times: [],
        specificDate: selectedComposeTimeframe,
        status: 'pending'
      };

      const msgText = `[VIEWING_REQUEST]: ${JSON.stringify(payloadObj)}`;

      await addDoc(collection(db, 'messages'), {
        conversation_id: selectedChatId,
        sender_id: user.uid,
        body: msgText,
        created_at: serverTimestamp()
      });

      // Update last message in conversation
      await updateDoc(doc(db, 'conversations', selectedChatId), {
        last_message: '📅 Viewing Request',
        last_message_at: serverTimestamp()
      });

      setShowAutoVerifyComposer(false);
      showNotification?.("Interactive Viewing Verification Card sent successfully!", "gold");
    } catch (err) {
      console.error("Failed to send verification card:", err);
      showNotification?.("Failed to send verification card", "red");
    } finally {
      setSending(false);
    }
  };

  const handleTogglePinChat = async (e: React.MouseEvent, chatId: string, currentPinned: string[] = []) => {
    e.stopPropagation();
    if (!user) return;
    const isPinned = currentPinned.includes(user.uid);
    const updatedPinned = isPinned 
      ? currentPinned.filter(uid => uid !== user.uid)
      : [...currentPinned, user.uid];
      
    try {
      await updateDoc(doc(db, 'conversations', chatId), {
        pinned_by_users: isPinned ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (err) {
      console.error("Failed to pin/unpin chat thread:", err);
    }
  };

  const handlePinMessage = async (msgId: string, text: string, senderId: string) => {
    if (!selectedChatId || !user) return;
    const senderName = senderId === user.uid 
      ? (profile?.name || user.displayName || 'You')
      : (currentChat?.otherUser?.name || 'User');
      
    try {
      await updateDoc(doc(db, 'conversations', selectedChatId), {
        pinned_message: { id: msgId, text, senderName }
      });
    } catch (err) {
      console.error("Failed to pin message:", err);
    }
  };

  const handleUnpinMessage = async () => {
    if (!selectedChatId) return;
    try {
      await updateDoc(doc(db, 'conversations', selectedChatId), {
        pinned_message: null
      });
    } catch (err) {
      console.error("Failed to unpin message:", err);
    }
  };

  const currentChat = chats.find(c => c.id === selectedChatId);

  const sortedChats = [...chats].sort((a, b) => {
    const aPinned = a.pinnedByUsers?.includes(user?.uid || '') ? 1 : 0;
    const bPinned = b.pinnedByUsers?.includes(user?.uid || '') ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned;
    }
    const aTime = a.lastMessageAt?.toDate?.() || a.lastMessageAt || 0;
    const bTime = b.lastMessageAt?.toDate?.() || b.lastMessageAt || 0;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center text-white p-8">
        <h2 className="text-3xl font-serif mb-4 italic">Sign In Required</h2>
        <p className="text-accent uppercase tracking-widest text-xs mb-8">Please log in to access your secure inbox.</p>
        <button onClick={() => window.location.href = '/auth'} className="px-8 py-3 bg-accent text-primary font-bold uppercase tracking-widest rounded-full">Sign In</button>
      </div>
    );
  }

  return (
    <div className="bg-secondary min-h-screen flex">
      <Sidebar type={resolvedRole} />
      
      <div className={cn(
        "flex-grow flex flex-col h-screen overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isCollapsed ? "md:pl-24" : "md:pl-24 lg:pl-72"
      )}>
        <div className="flex-grow flex overflow-hidden">
          {/* Chat List */}
          <div className={cn(
            "w-full md:w-96 bg-white border-r border-primary/5 flex flex-col transition-all duration-500",
            selectedChatId && "hidden md:flex"
          )}>
            <div className="p-8 border-b border-primary/5">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary/30 hover:text-accent transition-all mb-6 group w-fit"
              >
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
              </Link>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-serif italic text-primary">Inquiry Inbox</h1>
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Filter className="w-4 h-4 text-primary/40" />
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  className="w-full bg-secondary pl-12 pr-4 py-3 rounded-2xl outline-none focus:ring-1 ring-accent transition-all font-medium text-xs text-primary"
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <p className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em]">No conversations yet</p>
                </div>
              ) : (
                sortedChats.map((chat) => (
                  <div
                    key={chat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedChatId(chat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedChatId(chat.id);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-3xl transition-all duration-300 flex gap-4 group hover:bg-secondary/50 relative border cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-accent",
                      selectedChatId === chat.id 
                        ? "bg-primary text-secondary shadow-xl shadow-primary/20 border-accent/20" 
                        : chat.pinnedByUsers?.includes(user?.uid || '')
                          ? "bg-accent/5 border-accent/20"
                          : "bg-transparent border-transparent"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      {chat.otherUser?.photoURL ? (
                        <div className={cn(
                          "relative rounded-2xl",
                          isUserAgent(chat.otherUser?.email, chat.otherUser?.role) && "ring-2 ring-blue-500 ring-offset-2 ring-offset-secondary shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                        )}>
                          <img src={chat.otherUser?.photoURL} alt={chat.otherUser?.name} className="w-14 h-14 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent font-bold">
                          {chat.otherUser?.name?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className={cn("font-bold text-sm truncate", selectedChatId === chat.id ? "text-secondary" : "text-primary")}>
                            {chat.otherUser?.name || 'User'}
                          </h4>
                          {(chat.pinnedByUsers?.includes(user?.uid || '')) && (
                            <Pin className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37] flex-shrink-0 rotate-[30deg]" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleTogglePinChat(e, chat.id, chat.pinnedByUsers)}
                            className={cn(
                              "p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all",
                              chat.pinnedByUsers?.includes(user?.uid || '') && "opacity-100 text-accent"
                            )}
                          >
                            <Pin className={cn("w-3.5 h-3.5", chat.pinnedByUsers?.includes(user?.uid || '') ? "text-[#D4AF37] fill-[#D4AF37]" : "text-primary/20 hover:text-accent")} />
                          </button>
                          <span className={cn("text-[9px] font-bold uppercase tracking-widest flex-shrink-0", selectedChatId === chat.id ? "text-accent" : "text-primary/30")}>
                            {chat.lastMessageAt ? new Date(chat.lastMessageAt?.toDate?.() || chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 truncate", selectedChatId === chat.id ? "text-accent/60" : "text-accent")}>{chat.propertyId}</p>
                      <p className={cn("text-xs truncate", selectedChatId === chat.id ? "text-secondary/60" : "text-primary/40")}>{chat.lastMessage || 'No messages yet'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={cn(
            "flex-grow flex flex-col bg-secondary relative transition-all duration-500",
            !selectedChatId && "hidden md:flex items-center justify-center"
          )}>
            {selectedChatId ? (
              <>
                {/* Chat Header */}
                <div className="flex justify-between items-center px-6 h-20 border-b border-primary/5">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedChatId(null)}
                      className="p-2 hover:bg-secondary rounded-xl transition-all flex items-center gap-2 text-primary/40 group"
                    >
                      <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Back to List</span>
                    </button>
                    <div className="w-[1px] h-6 bg-primary/5 mx-2 hidden sm:block" />
                    {currentChat?.otherUser?.photoURL ? (
                       <div className={cn(
                         "relative rounded-2xl",
                         isUserAgent(currentChat?.otherUser?.email, currentChat?.otherUser?.role) && "ring-2 ring-blue-500 ring-offset-2 ring-offset-secondary shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                       )}>
                         <img src={currentChat?.otherUser?.photoURL} alt={currentChat?.otherUser?.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                       </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent font-bold">
                        {currentChat?.otherUser?.name?.[0] || 'U'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-serif italic text-primary leading-tight">{currentChat?.otherUser?.name || 'User'}</h3>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Active Conversation</span>
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Property Context Banner */}
                {currentChat?.propertyId && (
                  <div className="px-6 py-3 bg-accent/5 border-b border-accent/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <MessageSquare className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Inquiring about: <span className="text-accent">{currentChat.propertyId}</span></span>
                    </div>
                    <Link to={`/property/${currentChat.propertyId}`} className="text-[10px] font-black uppercase text-accent hover:underline">View Listing</Link>
                  </div>
                )}

                {/* Pinned Message Billboard */}
                {currentChat?.pinnedMessage && (
                  <div className="px-6 py-3.5 bg-accent/5 border-b border-accent/20 flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
                        <Pin className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-wider text-accent leading-none mb-1">Pinned by {currentChat.pinnedMessage.senderName}</span>
                        <p className="text-xs text-primary font-medium line-clamp-1 italic">"{currentChat.pinnedMessage.text}"</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleUnpinMessage}
                      className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#ff4444] bg-[#ff4444]/15 rounded-full hover:bg-[#ff4444] hover:text-white transition-all"
                    >
                      Unpin
                    </button>
                  </div>
                )}

                {/* Messages List */}
                <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar pb-32">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[85%] md:max-w-md group/msg relative",
                        msg.senderId === user.uid ? "ml-auto items-end" : "items-start"
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        {msg.senderId !== user.uid && (
                          <button 
                            onClick={() => handlePinMessage(msg.id, msg.text, msg.senderId)}
                            className="opacity-0 group-hover/msg:opacity-100 p-2 hover:bg-white rounded-xl transition-all text-primary/20 hover:text-accent flex-shrink-0 border border-transparent hover:border-accent/10"
                            title="Pin message to top"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className={cn(
                          "p-5 rounded-3xl text-sm leading-relaxed shadow-sm flex-grow",
                          msg.senderId === user.uid 
                            ? "bg-primary text-secondary rounded-tr-none shadow-primary/5" 
                            : "bg-white text-primary rounded-tl-none border border-primary/5 shadow-primary/5"
                        )}>
                          {msg.image && (
                            <div className="mb-3 rounded-2xl overflow-hidden max-w-full border border-black/10 shadow-sm bg-black/5">
                              <img src={msg.image} alt="Attached snapshot" className="w-full h-auto object-cover max-h-60" />
                            </div>
                          )}
                          {msg.document && (
                            <a 
                              href={msg.document} 
                              download={msg.documentName || 'Attachment'}
                              className={cn(
                                "mb-3 p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all group/doc",
                                msg.senderId === user.uid
                                  ? "bg-white/10 hover:bg-white/20 text-secondary"
                                  : "bg-secondary hover:bg-accent/15 text-primary"
                              )}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="w-5 h-5 text-accent shrink-0" />
                                <span className="text-xs font-bold truncate max-w-[150px]">{msg.documentName || 'Document'}</span>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-accent shrink-0">Download</span>
                            </a>
                          )}
                          {msg.text && msg.text.startsWith('[VIEWING_REQUEST]:') ? (
                            <ViewingRequestWidget 
                              message={msg} 
                              isCurrentUser={msg.senderId === user.uid} 
                              onUpdate={async (msgId, newPayload) => {
                                try {
                                  // Update state locally immediately for anti-lag (Satisfies Performance constraint)
                                  setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: `[VIEWING_REQUEST]: ${JSON.stringify(newPayload)}` } : m));
                                  
                                  await updateDoc(doc(db, 'messages', msgId), {
                                    body: `[VIEWING_REQUEST]: ${JSON.stringify(newPayload)}`
                                  });
                                } catch (e) {
                                  console.error("Failed to update viewing request", e);
                                }
                              }} 
                            />
                          ) : (
                            msg.text && <p>{msg.text}</p>
                          )}
                        </div>
                        {msg.senderId === user.uid && (
                          <button 
                            onClick={() => handlePinMessage(msg.id, msg.text, msg.senderId)}
                            className="opacity-0 group-hover/msg:opacity-100 p-2 hover:bg-white rounded-xl transition-all text-primary/20 hover:text-accent flex-shrink-0 border border-transparent hover:border-accent/10"
                            title="Pin message to top"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 px-1">
                        <span className="text-[10px] font-bold text-primary/30">
                          {msg.createdAt ? new Date(msg.createdAt?.toDate?.() || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {msg.senderId === user.uid && <CheckCheck className="w-3 h-3 text-accent" />}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-transparent pointer-events-none">
                  <div className="max-w-4xl mx-auto flex flex-col gap-2 pointer-events-auto">
                    {selectedAttachment && (
                      <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-xl border border-primary/5 flex items-center justify-between gap-4 animate-slideUp animate-duration-305">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {selectedAttachment.isImage ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-primary/10 shrink-0">
                              <img src={selectedAttachment.dataUrl} className="w-full h-full object-cover" alt="Selected thumbnail" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold text-primary truncate max-w-[200px]">{selectedAttachment.name}</span>
                            <span className="text-[10px] text-primary/40 uppercase tracking-widest font-semibold font-mono">
                              {selectedAttachment.isImage ? 'Image Attachment' : 'Document'}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedAttachment(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="w-8 h-8 rounded-full bg-primary/5 hover:bg-[#ff4444]/15 hover:text-[#ff4444] text-primary/40 flex items-center justify-center transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <AnimatePresence>
                      {showAutoVerifyComposer && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15, scale: 0.95 }} 
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          className="bg-[#0B071E] border border-accent/30 rounded-[2.5rem] p-6 shadow-2xl relative mb-2 text-white max-w-sm ml-auto select-none overflow-hidden"
                        >
                          {/* Decorative subtle ambient lights */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[30px] pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#170E3A]/40 rounded-full blur-[40px] pointer-events-none" />

                          <button 
                            type="button" 
                            onClick={() => setShowAutoVerifyComposer(false)}
                            className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-2 mb-4 bg-transparent">
                            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-accent leading-none">House of Eden Auto-Verify</span>
                          </div>

                          <h4 className="text-base font-serif italic text-white mb-2 cursor-default">Book and Reject Chat Verification</h4>
                          <p className="text-xs text-white/60 mb-5 leading-relaxed cursor-default">
                            Compose and send an interactive viewing card directly to the listing owner. Select a preferred timeframe option:
                          </p>

                          <div className="grid grid-cols-3 gap-2 mb-5">
                            {(['This Week', 'Next Week', 'Any Time'] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setSelectedComposeTimeframe(opt)}
                                className={cn(
                                  "py-3.5 px-1 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border duration-150",
                                  selectedComposeTimeframe === opt
                                    ? "bg-accent text-primary border-accent shadow-lg shadow-accent/15 font-black scale-[1.03]"
                                    : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={handleSendAutoVerifyCard}
                            disabled={sending}
                            className="w-full bg-accent text-primary hover:bg-accent/90 transition-all font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-lg shadow-accent/15 flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            Confirm & Send Chat Card
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl border border-primary/5 flex items-center gap-4 shadow-primary/10 w-full">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                        className="p-3 hover:bg-secondary rounded-2xl transition-all text-primary/40 disabled:opacity-50"
                        title="Attach Photo or Document"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowAutoVerifyComposer(!showAutoVerifyComposer)}
                        disabled={sending}
                        className={cn(
                          "p-3 rounded-2xl transition-all border shrink-0 flex items-center justify-center",
                          showAutoVerifyComposer 
                            ? "bg-[#110C35] text-accent border-accent/20 shadow-md shadow-accent/10" 
                            : "hover:bg-secondary text-primary/40 border-transparent"
                        )}
                        title="House of Eden Auto-Verify"
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </button>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <input 
                        id="message-input"
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={selectedAttachment ? "Add a caption, or press send..." : "Type your message here..."} 
                        className="flex-grow bg-transparent py-2 outline-none font-medium text-primary text-sm"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('message-input');
                          if (input) {
                            input.focus();
                          }
                        }}
                        className="p-3 hover:bg-secondary rounded-2xl transition-all text-primary/40 disabled:opacity-50"
                        title="Insert native emoji"
                        disabled={sending}
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleSendMessage}
                        disabled={sending}
                        className="w-12 h-12 bg-primary text-secondary flex items-center justify-center rounded-2xl hover:bg-accent hover:text-primary transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center px-12">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/5">
                  <MessageSquare className="w-10 h-10 text-accent opacity-20" />
                </div>
                <h3 className="text-3xl font-serif italic text-primary/80 mb-2">No selected conversation</h3>
                <p className="text-sm text-primary/30 max-w-xs mx-auto">Select a chat from the left sidebar to start messaging and managing your property inquiries.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav type={resolvedRole} />
    </div>
  );
}
