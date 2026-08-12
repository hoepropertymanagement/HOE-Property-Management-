/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar, { useSidebarCollapse } from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { 
  MessageSquare, Search, Filter, MoreVertical, 
  Send, Phone, Video, Info, ArrowLeft, 
  CheckCheck, Clock, Paperclip, Smile, Loader2, User as UserIcon,
  Pin, PinOff, X, FileText, Calendar, Check, XCircle, ShieldCheck, Sparkles
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams, Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
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
  lastMessageAt: Date | null;
  propertyId: string;
  otherUser?: {
    id: string;
    name: string;
    photoURL?: string;
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

interface Attachment {
  file: File;
  dataUrl: string;
  name: string;
  type: string;
  isImage: boolean;
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

  const handleDecline = () => {
    if (!payload) return;
    onUpdate(message.id, { ...payload, status: 'declined' });
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
  const timeframe = payload.specificDate || 'This Week';

  const thisWeekSlots = [
    "Wednesday 27 May - 10:00 AM",
    "Wednesday 27 May - 2:00 PM",
    "Friday 29 May - 11:30 AM",
    "Saturday 30 May - 3:00 PM"
  ];

  const nextWeekSlots = [
    "Next Monday 1 June - 10:30 AM",
    "Next Wednesday 3 June - 2:30 PM",
    "Next Thursday 4 June - 9:00 AM",
    "Next Friday 5 June - 3:00 PM"
  ];

  return (
    <div className="w-full max-w-sm rounded-[2rem] border border-accent/20 overflow-hidden text-left bg-[#0B071E] text-white shadow-2xl relative">
      <div className="bg-gradient-to-r from-[#170E3A] to-[#0F0A2B] px-5 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
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
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-400 block mb-1">Confirmed Viewing Appointment</span>
              <span className="text-xs font-bold text-green-200 block p-2.5 bg-green-500/5 rounded-xl border border-green-500/15">
                {payload.confirmedDateTime}
              </span>
            </div>
          </div>
        ) : isDeclined ? (
          <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/30 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-[#ff4444] flex items-center justify-center mx-auto shadow-sm">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff4444] block">Request Rejected</span>
            </div>
          </div>
        ) : isPending && !choosingDate ? (
          <div className="space-y-4">
            <p className="text-xs text-white/70 leading-relaxed font-semibold">
              Automated booking verification for timeframe <span className="text-accent underline font-black">{timeframe}</span>.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button 
                onClick={() => setChoosingDate(true)}
                className="w-full bg-accent text-primary hover:bg-accent/90 font-black py-3 px-4 rounded-xl shadow-lg transition-all text-xs text-center uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Book / Verify
              </button>
              <button 
                onClick={handleDecline}
                className="w-full bg-white/5 hover:bg-white/10 text-white/50 font-bold py-2.5 px-4 rounded-xl border border-white/5 transition-all text-[10px] uppercase tracking-widest text-center"
              >
                Reject / Decline
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 block mb-2">1. Choose Week Option</span>
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
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 block mb-2">2. Select Your Slot</span>
              
              {selectedWeek === 'this_week' && (
                <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {thisWeekSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleSelectSlot(slot)}
                      className="w-full px-4 py-3 bg-white/5 hover:bg-accent hover:text-primary rounded-xl text-left text-xs font-bold transition-all border border-white/10 text-white flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{slot}</span>
                      <Calendar className="w-3.5 h-3.5 text-white/20 shrink-0" />
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
                      className="w-full px-4 py-3 bg-white/5 hover:bg-accent hover:text-primary rounded-xl text-left text-xs font-bold transition-all border border-white/10 text-white flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{slot}</span>
                      <Calendar className="w-3.5 h-3.5 text-white/20 shrink-0" />
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
                    className="w-full py-2.5 bg-accent disabled:opacity-55 text-primary rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors uppercase tracking-widest"
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
                className="w-full text-center text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-white"
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
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { role: urlRole } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isCollapsed = useSidebarCollapse();
  const conversationIdParam = searchParams.get('id');

  const navState = location.state as {
    recipientId?: string;
    recipientName?: string;
    propertyId?: string;
    propertyTitle?: string;
    initialMessage?: string;
  } | null;

  const resolvedRole = type || (urlRole === 'landlord' ? 'landlord' : urlRole === 'agent' ? 'agent' : 'tenant');

  const [selectedChatId, setSelectedChatId] = useState<string | null>(conversationIdParam);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [showAutoVerifyComposer, setShowAutoVerifyComposer] = useState(false);
  const [selectedComposeTimeframe, setSelectedComposeTimeframe] = useState<'This Week' | 'Next Week' | 'Any Time'>('This Week');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (navState?.initialMessage) {
      setInputText(navState.initialMessage);
    }
  }, [navState]);

  // Fetch conversations from Supabase
  useEffect(() => {
    const userId = user?.id || user?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .contains('participant_ids', [userId]);

        if (error) throw error;

        const formattedChats: Chat[] = (data || []).map((chatDoc: any) => ({
          id: chatDoc.id,
          participantIds: chatDoc.participant_ids || [],
          lastMessage: chatDoc.last_message || '',
          lastMessageAt: chatDoc.last_message_at ? new Date(chatDoc.last_message_at) : null,
          propertyId: chatDoc.property_id || ''
        }));

        setChats(formattedChats);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    const channel = supabase
      .channel('conversations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedChatId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const msgs: Message[] = (data || []).map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          text: msg.body || '',
          createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
          image: msg.image,
          document: msg.document,
          documentName: msg.document_name,
          documentType: msg.document_type
        }));

        setMessages(msgs);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${selectedChatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${selectedChatId}` 
      }, (payload) => {
        const msg = payload.new;
        const newMsg: Message = {
          id: msg.id,
          senderId: msg.sender_id,
          text: msg.body || '',
          createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
          image: msg.image,
          document: msg.document,
          documentName: msg.document_name,
          documentType: msg.document_type
        };
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(scrollToBottom, 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedAttachment({
        file,
        dataUrl: event.target?.result as string,
        name: file.name,
        type: file.type,
        isImage
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    const userId = user?.id || user?.uid;
    if ((!inputText.trim() && !selectedAttachment) || !selectedChatId || !userId || sending) return;

    setSending(true);
    try {
      const messagePayload: any = {
        conversation_id: selectedChatId,
        sender_id: userId,
        body: inputText,
        image: selectedAttachment?.isImage ? selectedAttachment.dataUrl : null,
        document: !selectedAttachment?.isImage ? selectedAttachment?.dataUrl : null,
        document_name: selectedAttachment?.name || null,
        document_type: selectedAttachment?.type || null
      };

      const { error: msgErr } = await supabase.from('messages').insert([messagePayload]);
      if (msgErr) throw msgErr;

      await supabase.from('conversations').update({
        last_message: inputText || (selectedAttachment?.isImage ? '📷 Image' : '📄 Attachment'),
        last_message_at: new Date().toISOString()
      }).eq('id', selectedChatId);

      setInputText('');
      setSelectedAttachment(null);
    } catch (err) {
      console.error("Error sending message:", err);
      showNotification('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateViewingPayload = async (msgId: string, newPayload: ViewingPayload) => {
    try {
      const formattedText = `[VIEWING_REQUEST]: ${JSON.stringify(newPayload)}`;
      const { error } = await supabase
        .from('messages')
        .update({ body: formattedText })
        .eq('id', msgId);

      if (error) throw error;
      showNotification('Viewing request status updated', 'success');
    } catch (err) {
      console.error("Error updating viewing payload:", err);
      showNotification('Failed to update request status', 'error');
    }
  };

  const handleSendAutoVerify = async () => {
    const userId = user?.id || user?.uid;
    if (!selectedChatId || !userId) return;

    const payload: ViewingPayload = {
      days: [],
      times: [],
      specificDate: selectedComposeTimeframe,
      status: 'pending'
    };

    const formattedText = `[VIEWING_REQUEST]: ${JSON.stringify(payload)}`;

    try {
      await supabase.from('messages').insert([{
        conversation_id: selectedChatId,
        sender_id: userId,
        body: formattedText
      }]);

      await supabase.from('conversations').update({
        last_message: `📅 Auto-Verify Viewing (${selectedComposeTimeframe})`,
        last_message_at: new Date().toISOString()
      }).eq('id', selectedChatId);

      setShowAutoVerifyComposer(false);
      showNotification('Auto-Verify Viewing request sent', 'success');
    } catch (err) {
      console.error("Error sending Auto-Verify request:", err);
      showNotification('Failed to send verification request', 'error');
    }
  };

  const currentChat = chats.find(c => c.id === selectedChatId);

  return (
    <div className="flex h-screen bg-[#070415] text-white overflow-hidden">
      <Sidebar role={resolvedRole} />
      
      <main className={cn(
        "flex-1 flex flex-col md:flex-row h-full transition-all duration-300 relative overflow-hidden",
        isCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        {/* Conversations List */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col h-full bg-[#0B071E]",
          selectedChatId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-white/10 space-y-3">
            <h1 className="text-xl font-black text-white tracking-wide">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full pl-9 pr-4 py-2 bg-white/5 rounded-xl text-xs font-semibold text-white placeholder-white/40 outline-none border border-white/10 focus:border-accent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-xs font-semibold">
                No conversations yet
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={cn(
                    "w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 border",
                    selectedChatId === chat.id 
                      ? "bg-accent/15 border-accent/30 text-white" 
                      : "bg-transparent border-transparent hover:bg-white/5 text-white/70"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                    <UserIcon className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        Chat ({chat.id.slice(0, 6)}...)
                      </span>
                      {chat.lastMessageAt && (
                        <span className="text-[10px] text-white/40 font-medium">
                          {chat.lastMessageAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/50 truncate mt-0.5 font-medium">
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Thread Panel */}
        <div className={cn(
          "flex-1 flex flex-col h-full bg-[#070415]",
          !selectedChatId ? "hidden md:flex" : "flex"
        )}>
          {selectedChatId && currentChat ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0B071E]">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedChatId(null)}
                    className="md:hidden p-2 rounded-xl bg-white/5 text-white/70 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                    <UserIcon className="w-4 h-4 text-white/50" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">Active Conversation</h2>
                    <span className="text-[10px] text-accent font-semibold block">Realtime Thread</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAutoVerifyComposer(true)}
                    className="px-3 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent rounded-xl text-[10px] font-black uppercase tracking-wider border border-accent/30 flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Verify
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.map((msg) => {
                  const currentUserId = user?.id || user?.uid;
                  const isCurrentUser = msg.senderId === currentUserId;
                  const isViewingReq = msg.text.startsWith('[VIEWING_REQUEST]:');

                  return (
                    <div 
                      key={msg.id} 
                      className={cn("flex flex-col", isCurrentUser ? "items-end" : "items-start")}
                    >
                      {isViewingReq ? (
                        <ViewingRequestWidget 
                          message={msg} 
                          isCurrentUser={isCurrentUser} 
                          onUpdate={handleUpdateViewingPayload} 
                        />
                      ) : (
                        <div className={cn(
                          "max-w-md p-3.5 rounded-2xl text-xs font-medium space-y-2 leading-relaxed shadow-md",
                          isCurrentUser 
                            ? "bg-accent text-primary font-semibold rounded-br-none" 
                            : "bg-[#140E36] text-white border border-white/10 rounded-bl-none"
                        )}>
                          {msg.image && (
                            <img src={msg.image} alt="attachment" className="rounded-xl max-h-60 w-full object-cover" />
                          )}
                          {msg.document && (
                            <a 
                              href={msg.document} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="flex items-center gap-2 p-2 rounded-xl bg-black/20 text-white hover:underline text-[11px]"
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="truncate">{msg.documentName || 'Document'}</span>
                            </a>
                          )}
                          {msg.text && <p>{msg.text}</p>}
                        </div>
                      )}
                      <span className="text-[9px] text-white/30 mt-1 px-1 font-semibold">
                        {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-white/10 bg-[#0B071E] space-y-3">
                {selectedAttachment && (
                  <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/10 w-fit">
                    <FileText className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">{selectedAttachment.name}</span>
                    <button onClick={() => setSelectedAttachment(null)} className="p-1 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl transition-all border border-white/10"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-white/5 text-white placeholder-white/30 text-xs font-semibold px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-accent transition-all"
                  />

                  <button 
                    onClick={handleSendMessage}
                    disabled={sending || (!inputText.trim() && !selectedAttachment)}
                    className="p-3 bg-accent disabled:opacity-40 text-primary font-bold rounded-xl shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/40">
              <MessageSquare className="w-12 h-12 mb-3 text-white/20" />
              <h3 className="text-sm font-bold text-white/60">Select a Conversation</h3>
              <p className="text-xs text-white/40 max-w-xs mt-1">Choose a chat from the sidebar to view messages or schedule viewings.</p>
            </div>
          )}
        </div>
      </main>

      {/* Auto-Verify Modal */}
      <AnimatePresence>
        {showAutoVerifyComposer && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0B071E] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h3 className="text-sm font-black uppercase tracking-wider">Send Eden Auto-Verify</h3>
                </div>
                <button onClick={() => setShowAutoVerifyComposer(false)} className="p-1 hover:text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-white/70 block">Select Preferred Timeframe</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['This Week', 'Next Week', 'Any Time'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedComposeTimeframe(t)}
                      className={cn(
                        "py-3 px-2 rounded-xl text-xs font-bold transition-all border",
                        selectedComposeTimeframe === t 
                          ? "bg-accent text-primary border-accent" 
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button 
                  onClick={() => setShowAutoVerifyComposer(false)}
                  className="w-1/2 py-3 bg-white/5 hover:bg-white/10 text-white/60 font-bold rounded-xl text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendAutoVerify}
                  className="w-1/2 py-3 bg-accent text-primary font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-accent/20 hover:bg-accent/90"
                >
                  Send Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav role={resolvedRole} />
    </div>
  );
}