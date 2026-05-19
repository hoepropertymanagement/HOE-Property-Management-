/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { 
  MessageSquare, Search, Filter, MoreVertical, 
  Send, Phone, Video, Info, ArrowLeft, 
  CheckCheck, Clock, Paperclip, Smile, Loader2, User as UserIcon
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
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
}

interface Chat {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: any;
  propertyId: string;
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
  const conversationIdParam = searchParams.get('id');

  const resolvedRole = type || (urlRole === 'landlord' ? 'landlord' : 'tenant');

  const [selectedChatId, setSelectedChatId] = useState<string | null>(conversationIdParam);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    // Listen to conversations where user is a participant
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const chatsData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data();
          const otherUserId = data.participantIds.find((id: string = '') => id !== user.uid);
          
          // Fetch other user profile
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

          return {
            id: chatDoc.id,
            ...data,
            otherUser
          } as Chat;
        }));
        setChats(chatsData);
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'conversations');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'conversations');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedChatId || !user) {
      setMessages([]);
      return;
    }

    // Listen to messages for selected conversation
    const q = query(
      collection(db, 'conversations', selectedChatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `conversations/${selectedChatId}/messages`);
    });

    return () => unsubscribe();
  }, [selectedChatId, user]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChatId || !user || sending) return;

    setSending(true);
    try {
      const messageData = {
        senderId: user.uid,
        text: inputText,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'conversations', selectedChatId, 'messages'), messageData);
      
      // Update last message in conversation
      await updateDoc(doc(db, 'conversations', selectedChatId), {
        lastMessage: inputText,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setInputText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `conversations/${selectedChatId}/messages`);
    } finally {
      setSending(false);
    }
  };

  const currentChat = chats.find(c => c.id === selectedChatId);

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
      
      <div className="md:pl-24 lg:pl-72 flex-grow flex flex-col h-screen overflow-hidden">
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
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-3xl transition-all duration-300 flex gap-4 group hover:bg-secondary/50",
                      selectedChatId === chat.id ? "bg-primary text-secondary shadow-xl shadow-primary/20" : "bg-transparent"
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
                        <h4 className={cn("font-bold text-sm truncate", selectedChatId === chat.id ? "text-secondary" : "text-primary")}>
                          {chat.otherUser?.name || 'User'}
                        </h4>
                        <span className={cn("text-[9px] font-bold uppercase tracking-widest", selectedChatId === chat.id ? "text-accent" : "text-primary/30")}>
                          {chat.lastMessageAt ? new Date(chat.lastMessageAt?.toDate?.() || chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 truncate", selectedChatId === chat.id ? "text-accent/60" : "text-accent")}>{chat.propertyId}</p>
                      <p className={cn("text-xs truncate", selectedChatId === chat.id ? "text-secondary/60" : "text-primary/40")}>{chat.lastMessage || 'No messages yet'}</p>
                    </div>
                  </button>
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

                {/* Messages List */}
                <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar pb-32">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[80%] md:max-w-md",
                        msg.senderId === user.uid ? "ml-auto items-end" : "items-start"
                      )}
                    >
                      <div className={cn(
                        "p-5 rounded-3xl text-sm leading-relaxed shadow-sm",
                        msg.senderId === user.uid 
                          ? "bg-primary text-secondary rounded-tr-none shadow-primary/5" 
                          : "bg-white text-primary rounded-tl-none border border-primary/5 shadow-primary/5"
                      )}>
                        {msg.text}
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
                  <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl border border-primary/5 flex items-center gap-4 pointer-events-auto shadow-primary/10">
                    <button className="p-3 hover:bg-secondary rounded-2xl transition-all text-primary/40">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message here..." 
                      className="flex-grow bg-transparent py-2 outline-none font-medium text-primary text-sm"
                    />
                    <button className="p-3 hover:bg-secondary rounded-2xl transition-all text-primary/40">
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
