import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

const generateSessionId = () => {
  const stored = sessionStorage.getItem("visitor_session_id");
  if (stored) return stored;
  
  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem("visitor_session_id", newId);
  return newId;
};

const detectDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent)) {
    return "mobile";
  }
  if (/tablet|ipad/.test(userAgent)) {
    return "tablet";
  }
  return "desktop";
};

const getSource = () => {
  const referrer = document.referrer;
  if (!referrer) return "direct";
  
  const referrerUrl = new URL(referrer);
  const hostname = referrerUrl.hostname.toLowerCase();
  
  if (hostname.includes("google")) return "google";
  if (hostname.includes("facebook") || hostname.includes("fb")) return "facebook";
  if (hostname.includes("twitter") || hostname.includes("x.com")) return "twitter";
  if (hostname.includes("linkedin")) return "linkedin";
  if (hostname.includes("instagram")) return "instagram";
  
  return "referral";
};

export const useVisitorTracking = () => {
  const location = useLocation();
  const [visitId, setVisitId] = useState<string | null>(null);

  useEffect(() => {
    const trackVisit = async () => {
      const sessionId = generateSessionId();
      const deviceType = detectDeviceType();
      const source = getSource();

      try {
        const { data, error } = await supabase
          .from("page_visits")
          .insert({
            session_id: sessionId,
            page_path: location.pathname,
            device_type: deviceType,
            source: source,
          })
          .select("id")
          .single();

        if (!error && data) {
          setVisitId(data.id);
        }
      } catch (err) {
        console.error("Error tracking visit:", err);
      }
    };

    trackVisit();

    return () => {
      // Mark visit as ended when leaving
      if (visitId) {
        supabase
          .from("page_visits")
          .update({ ended_at: new Date().toISOString() })
          .eq("id", visitId)
          .then(() => {});
      }
    };
  }, [location.pathname]);

  return { visitId };
};

export const useRealtimeVisitors = () => {
  const [currentVisitors, setCurrentVisitors] = useState(0);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);

  const fetchCurrentVisitors = useCallback(async () => {
    // Count visitors in the last 5 minutes who haven't ended their session
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("page_visits")
      .select("*")
      .gte("created_at", fiveMinutesAgo)
      .is("ended_at", null);

    if (!error && data) {
      // Count unique sessions
      const uniqueSessions = new Set(data.map(v => v.session_id));
      setCurrentVisitors(uniqueSessions.size);
      setRecentVisits(data);
    }
  }, []);

  useEffect(() => {
    fetchCurrentVisitors();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("page_visits_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "page_visits",
        },
        () => {
          fetchCurrentVisitors();
        }
      )
      .subscribe();

    // Also poll every 30 seconds as backup
    const interval = setInterval(fetchCurrentVisitors, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchCurrentVisitors]);

  return { currentVisitors, recentVisits, refetch: fetchCurrentVisitors };
};
