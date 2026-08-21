import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Trophy, Calendar, User, ShieldAlert, Activity, Globe, Bell, Send, CheckCircle2, MessageSquare, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VisitorEntry {
  id: string;
  userAgent: string;
  path: string;
  timestamp: string;
}

interface MessageEntry {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function ControlPanel() {
  const [activeTab, setActiveTab] = useState<'messages' | 'visitors' | 'push'>('messages');
  const [visitors, setVisitors] = useState<VisitorEntry[]>([]);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // SECURITY CHECK: Ensure only admin can view data 
    const savedUser = localStorage.getItem('auth_user');
    let useEmail = '';
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        useEmail = parsedUser.email || '';
      } catch (e) {
        // Ignore
      }
    }

    if (useEmail.toLowerCase() !== 'syaswanthkumar2006@gmail.com') {
      setError("Access Denied. You must be signed in as the administrator (syaswanthkumar2006@gmail.com) to view this page.");
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: () => void;

    if (activeTab === 'visitors') {
      const q = query(collection(db, 'visitors'), orderBy('timestamp', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const newVisitors = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VisitorEntry[];
        setVisitors(newVisitors);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.error("Error fetching visitors:", err);
        setError("Failed to load visitors. Please try again later.");
        setLoading(false);
      });
    } else if (activeTab === 'messages') {
      const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MessageEntry[];
        setMessages(newMessages);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages. Please try again later.");
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab]);

  const markMessageAsRead = async (id: string, readStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: !readStatus });
    } catch (e) {
      console.error("Error updating message status:", e);
    }
  };

  return (
    <div className="min-h-screen bg-sage text-white font-sans">
      {/* Header */}
      <header className="bg-sage/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-white/50" />
              Control Panel
            </h1>
          </div>
          <div className="text-sm font-medium text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            Admin Mode
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${
              activeTab === 'messages' ? 'bg-olive text-pistachio' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Contact Messages
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${
              activeTab === 'visitors' ? 'bg-olive text-pistachio' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <Activity className="w-5 h-5" />
            Website Visitors
          </button>
          <button
            onClick={() => setActiveTab('push')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${
              activeTab === 'push' ? 'bg-olive text-pistachio' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <Bell className="w-5 h-5" />
            Push Notifications
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-olive"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex flex-col items-center text-center">
              <ShieldAlert className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-red-400 mb-2">Access Restricted</h3>
              <p className="text-white/70">{error}</p>
            </div>
          ) : activeTab === 'messages' ? (
            messages.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No contact messages yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((entry) => (
                  <div key={entry.id} className={`p-5 rounded-2xl border transition-colors ${entry.read ? 'bg-white/5 border-white/10 opacity-70' : 'bg-olive/10 border-olive/30'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{entry.name}</h4>
                          <a href={`mailto:${entry.email}`} className="text-sm text-white/50 hover:text-white flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {entry.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs font-mono text-white/40">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <button
                          onClick={() => markMessageAsRead(entry.id, entry.read)}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${entry.read ? 'border-white/20 text-white/50 hover:bg-white/10' : 'border-olive/50 bg-olive/20 text-olive hover:bg-olive hover:text-pistachio'}`}
                        >
                          {entry.read ? 'Mark Unread' : 'Mark Read'}
                        </button>
                      </div>
                    </div>
                    <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{entry.message}</p>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'visitors' ? (
            visitors.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No visitors recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/60 text-sm">
                      <th className="pb-3 font-medium">Path</th>
                      <th className="pb-3 font-medium">User Agent</th>
                      <th className="pb-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((entry) => (
                      <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 font-medium flex items-center gap-2">
                          <Globe className="w-4 h-4 text-white/50" />
                          {entry.path}
                        </td>
                        <td className="py-4 text-sm text-white/60 max-w-xs truncate" title={entry.userAgent}>
                          {entry.userAgent}
                        </td>
                        <td className="py-4 text-sm text-white/60">
                          {new Date(entry.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === 'push' ? (
            <PushPanel />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function PushPanel() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const sendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setStatusMessage('Fetching subscriptions...');

    try {
      const { getDocs, query, collection } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const subsRef = collection(db, 'push_subscriptions');
      const snapshot = await getDocs(query(subsRef));
      
      if (snapshot.empty) {
        setStatus('error');
        setStatusMessage('No subscribers found.');
        return;
      }

      setStatusMessage(`Found ${snapshot.size} subscribers. Broadcasting...`);

      let successCount = 0;
      let failCount = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.subscription) {
          try {
            const subData = JSON.parse(data.subscription);
            await fetch('/api/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: subData,
                title: title || 'Message from YK Yash',
                body: body || '',
                url: url || '/'
              }),
            });
            successCount++;
          } catch (e) {
            console.error('Failed to parse or send to subscriber', doc.id, e);
            failCount++;
          }
        }
      }

      setStatus('success');
      setStatusMessage(`Complete. Sent to ${successCount} users.`);
      setTimeout(() => setStatus('idle'), 5000);
      setTitle('');
      setBody('');
      setUrl('');
      
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setStatusMessage(err.message || 'Error occurred while broadcasting.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-olive/10 border border-olive/20 rounded-xl p-6 text-center">
        <Bell className="w-10 h-10 mx-auto text-white mb-3" />
        <h2 className="text-xl font-bold font-display text-white">Broadcast an Update</h2>
        <p className="text-white/60 text-sm mt-1">Send a web push notification directly to users who allowed notifications.</p>
      </div>

      <form onSubmit={sendPush} className="space-y-4 bg-white/5 border border-white/10 p-6 rounded-xl">
        <div>
          <label className="block text-sm font-bold text-white/70 mb-2">Notification Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. New Project Published!" 
            required
            className="w-full bg-white/10 border border-white/20 rounded py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-olive transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white/70 mb-2">Message Body</label>
          <textarea 
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="e.g. Check out my latest work on..." 
            required
            rows={3}
            className="w-full bg-white/10 border border-white/20 rounded py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-olive transition-all resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white/70 mb-2">Target URL (Optional)</label>
          <input 
            type="text" 
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="e.g. /#projects or https://..." 
            className="w-full bg-white/10 border border-white/20 rounded py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-olive transition-all"
          />
        </div>

        {statusMessage && (
          <div className={`p-3 rounded text-sm font-medium ${
            status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
            status === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
            'bg-olive/20 text-olive border border-olive/30'
          }`}>
            {statusMessage}
          </div>
        )}

        <button 
          type="submit"
          disabled={status === 'sending'}
          className="w-full flex items-center justify-center space-x-2 bg-olive text-pistachio px-6 py-3 rounded font-bold hover:bg-olive-dark transition-colors disabled:opacity-70 mt-4"
        >
          <Send className="w-5 h-5" />
          <span>{status === 'sending' ? 'Sending Broadcast...' : 'Fire Broadcast'}</span>
        </button>
      </form>
    </div>
  );
}
