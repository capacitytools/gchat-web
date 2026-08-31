"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show if we are in the browser and OneSignal is loaded
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        // Check if OneSignal is initialized and permission is default
        if ((window as any).OneSignalDeferred) {
          (window as any).OneSignalDeferred.push(function (OneSignal: any) {
            OneSignal.User.PushSubscription.optedIn.then((isOptedIn: boolean) => {
              if (!isOptedIn) {
                setShowPrompt(true);
              }
            });
          });
        }
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const enableNotifications = async () => {
    setShowPrompt(false);
    if (typeof window !== "undefined" && (window as any).OneSignalDeferred) {
      (window as any).OneSignalDeferred.push(function (OneSignal: any) {
        OneSignal.Slidedown.promptPush();
      });
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-gradient-to-br from-cyan-600 to-purple-700 rounded-2xl p-4 shadow-2xl border border-white/10 relative">
        <button 
          onClick={() => setShowPrompt(false)}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-white/20 shrink-0">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">Never Miss a Message</h3>
            <p className="text-sm text-white/80 mb-3">
              Get notified instantly when you receive chats, money, or G-Rewards!
            </p>
            <button
              onClick={enableNotifications}
              className="w-full py-2.5 rounded-xl bg-white text-purple-700 font-bold text-sm hover:bg-white/90 transition-colors shadow-lg"
            >
              Enable Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}