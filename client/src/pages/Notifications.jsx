import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Eye, EyeOff, Trash, Clock, Check, BellOff, Info, ArrowRight } from 'lucide-react';
import apiClient from '../api/apiClient';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/notifications/me');
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      // Update state locally
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 font-sans">Notifications</h1>
        <p className="text-xs text-slate-500 mt-1">Review alerts regarding listing matches, buyer connections, and approval reviews.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 text-xs shadow-sm">
          <BellOff className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold">No notifications yet.</p>
          <p className="text-slate-400 mt-1">Matched listings or trade requests will trigger notifications here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden animate-fade-in">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                n.isRead ? 'bg-white' : 'bg-blue-50/10 hover:bg-blue-50/20'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-sky-500 flex-shrink-0" />
                  )}
                  <h3 className={`text-xs font-bold ${n.isRead ? 'text-navy-900' : 'text-sky-600'}`}>
                    {n.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {n.message}
                </p>

                <div className="flex items-center space-x-4 text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(n.sentAt).toLocaleString()}</span>
                  </span>
                  
                  {n.listingId && (
                    <Link
                      to={`/listings/${n.listingId?._id || n.listingId}`}
                      className="text-sky-600 hover:underline flex items-center space-x-0.5"
                    >
                      <span>View Listing</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  className="p-1.5 border border-slate-200 text-slate-400 hover:text-navy-900 hover:bg-slate-50 rounded-lg transition-colors flex-shrink-0"
                  title="Mark as read"
                >
                  <Check className="h-4.5 w-4.5 text-sky-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
