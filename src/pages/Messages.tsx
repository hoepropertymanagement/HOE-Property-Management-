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
  Pin, PinOff, X, FileText
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { db } from '../lib/firebase';
import { 
  collection, query, where, onSnapshot, orderBy, 
  addDoc, serverTimestamp, doc, getDoc, updateDoc, 
  setDoc, limit 
} from 'firebase/firestore';
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

export default function Messages({ type }: { type?: 'tenant' | 'landlord' }) {
  const { user, profile } = useAuth();
  const { role: urlRole } = useParams();
  const [searchParams] = useSearchParams();
  const isCollapsed = useSidebarCollapse();
  const conversationIdParam = searchParams.get('id');

  const resolvedRole = type || (urlRole === 'landlord' ? 'landlord' : 'tenant');

  const [selectedChatId, setSelectedChatId] = useState<string | null>(conversationIdParam);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    dataUrl: string;
    name: string;
    type: string;
    isImage: boolean;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    
    if (isImg) {
      setIsCompressing(true);
      try {
        const compressedBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDimen = 800;
              if (width > maxDimen || height > maxDimen) {
                if (width > height) {
                  height = Math.round((height * maxDimen) / width);
                  width = maxDimen;
                } else {
                  width = Math.round((width * maxDimen) / height);
                  height = maxDimen;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressed);
              } else {
                resolve(event.target?.result as string);
              }
            };
            img.src = event.target?.result as string;
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        setSelectedAttachment({
          dataUrl: compressedBase64,
          name: file.name,
          type: 'image/jpeg',
          isImage: true
        });
      } catch (err) {
        console.error("Compression error:", err);
      } finally {
        setIsCompressing(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedAttachment({
          dataUrl: event.target?.result as string,
          name: file.name,
          type: file.type,
          isImage: false
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;

    const fetchConversations = async () => {
      try {
        const { data: chatsData, error } = await supabase
          .from('conversations')
          .select('id, property_id, last_message, last_message_at, updated_at, pinned_by_users, pinned_message');

        if (error) throw error;
        
        const { data: participantsData, error: partError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id');

        if (partError) throw partError;
        
        const participantsByChat: Record<string, string[]> = participantsData.reduce((acc: any, row: any) => {
          if (!acc[row.conversation_id]) acc[row.conversation_id] = [];
          acc[row.conversation_id].push(row.user_id);
          return acc;
        }, {});

        const formattedChats = await Promise.all((chatsData || []).map(async (chatDoc) => {
          const participantIds = participantsByChat[chatDoc.id] || [];
          const otherUserId = participantIds.find(id => id !== user.uid);
          
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
            id: chatDoc.id,
            propertyId: chatDoc.property_id || '',
            participantIds,
            lastMessage: chatDoc.last_message || '',
            lastMessageAt: chatDoc.last_message_at ? new Date(chatDoc.last_message_at) : null,
            pinnedByUsers: chatDoc.pinned_by_users || [],
            pinnedMessage: parsedPinnedMessage,
            otherUser
          } as Chat;
        }));

        if (isSubscribed) {
          setChats(formattedChats);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
        if (isSubscribed) setLoading(false);
      }
    };

    fetchConversations();

    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedChatId || !user) {
      setMessages([]);
      return;
    }

    let isSubscribed = true;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, sender_id, body, created_at, image, document, document_name, document_type')
          .eq('conversation_id', selectedChatId)
          .order('created_at', { ascending: true })
          .limit(100);
        
        if (error) throw error;
        
        const msgs = (data || []).map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          text: msg.body || '',
          createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
          image: msg.image,
          document: msg.document,
          documentName: msg.document_name,
          documentType: msg.document_type
        }));
        
        if (isSubscribed) {
          setMessages(msgs);
          setTimeout(scrollToBottom, 100);
        }
      } catch (err) {
        console.error("Error fetching messages", err);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`public:messages:conversation_id=eq.${selectedChatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedChatId}` }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
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
        if (selectedAttachment.isImage) {
          messageData.image = selectedAttachment.dataUrl;
        } else {
          messageData.document = selectedAttachment.dataUrl;
          messageData.document_name = selectedAttachment.name;
          messageData.document_type = selectedAttachment.type;
        }
      }

      const { error: insertError } = await supabase.from('messages').insert(messageData);
      if (insertError) throw insertError;
      
      const displayLastMsg = selectedAttachment 
        ? (selectedAttachment.isImage ? '📷 Image' : `📄 ${selectedAttachment.name}`) 
        : inputText;

      // Update last message in conversation
      const { error: updateError } = await supabase.from('conversations').update({
        last_message: displayLastMsg,
        last_message_at: new Date().toISOString()
      }).eq('id', selectedChatId);

      if (updateError) throw updateError;

      setInputText('');
      setSelectedAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Failed to send message:", error);
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
      const { error } = await supabase.from('conversations').update({
        pinned_by_users: updatedPinned
      }).eq('id', chatId);
      if (error) throw error;
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
      const { error } = await supabase.from('conversations').update({
        pinned_message: { id: msgId, text, senderName }
      }).eq('id', selectedChatId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to pin message:", err);
    }
  };

  const handleUnpinMessage = async () => {
    if (!selectedChatId) return;
    try {
      const { error } = await supabase.from('conversations').update({
        pinned_message: null
      }).eq('id', selectedChatId);
      if (error) throw error;
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
                        <img src={chat.otherUser?.photoURL} alt={chat.otherUser?.name} className="w-14 h-14 rounded-2xl object-cover" referrerPolicy="no-referrer" />
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
                       <img src={currentChat?.otherUser?.photoURL} alt={currentChat?.otherUser?.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" referrerPolicy="no-referrer" />
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
                          {msg.text && <p>{msg.text}</p>}
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
                              {selectedAttachment.isImage ? 'Compressed Image' : 'Document'}
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
                    
                    <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl border border-primary/5 flex items-center gap-4 shadow-primary/10 w-full">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending || isCompressing}
                        className="p-3 hover:bg-secondary rounded-2xl transition-all text-primary/40 disabled:opacity-50"
                        title="Attach Photo or Document"
                      >
                        {isCompressing ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : <Paperclip className="w-5 h-5" />}
                      </button>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={selectedAttachment ? "Add a caption, or press send..." : "Type your message here..."} 
                        className="flex-grow bg-transparent py-2 outline-none font-medium text-primary text-sm"
                      />
                      <button className="p-3 hover:bg-secondary rounded-2xl transition-all text-primary/40">
                        <Smile className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleSendMessage}
                        disabled={sending || isCompressing}
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
