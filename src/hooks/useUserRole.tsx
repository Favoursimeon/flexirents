import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'user' | 'service_provider' | 'admin' | 'landlord' | 'tenant';

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setRoles(user.role ? [user.role as UserRole] : []);
    setLoading(false);
  }, [user]);

  return { roles, loading };
};