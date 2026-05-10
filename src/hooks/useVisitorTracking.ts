import { useEffect, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "@/lib/api";

const generateSessionId = () => {
  const stored = sessionStorage.getItem("visitor_session_id");
  if (stored) return stored;
  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem("visitor_session_id", newId);
  return newId;
};

const detectDeviceType = () => {
  const ua = navigator.userAgent;
  if (/iPad|Android(?!.*Mobile)/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))) return "tablet";
  if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry/i.test(ua)) return "mobile";
  return "desktop";
};

const detectCountry = async (): Promise<string> => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) throw new Error("Failed");
    const data = await response.json();
    return data.country_name || "Unknown";
  } catch {
    try {
      const response = await fetch("https://ip-api.com/json/");
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      return data.country || "Unknown";
    } catch {
      return "Unknown";
    }
  }
};

export const useVisitorTracking = () => {
  const location = useLocation();

  const trackVisit = useCallback(async (path: string) => {
    try {
      const sessionId = generateSessionId();
      const deviceType = detectDeviceType();
      const country = await detectCountry();

      await api.post('/api/admin/analytics/track', {
        session_id: sessionId,
        page_path: path,
        device_type: deviceType,
        country,
        referrer: document.referrer || null,
      });
    } catch (error) {
      // Silently fail — tracking should never break the app
    }
  }, []);

  useEffect(() => {
    trackVisit(location.pathname);
  }, [location.pathname, trackVisit]);
};
export const useRealtimeVisitors = () => {
  const [currentVisitors, setCurrentVisitors] = useState(0);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const { data } = await api.get('/api/admin/analytics/realtime-visitors');
        setCurrentVisitors(data?.count || 0);
      } catch {
        setCurrentVisitors(0);
      }
    };

    fetchVisitors();
    const interval = setInterval(fetchVisitors, 30000);
    return () => clearInterval(interval);
  }, []);

  return { currentVisitors };
};