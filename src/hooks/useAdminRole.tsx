import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setIsAdmin(user.role === 'admin');
    setLoading(false);
  }, [user]);

  return { isAdmin, loading };
};