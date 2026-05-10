import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import api from "@/lib/api";

interface UpcomingPayment {
  id: string;
  amount: number;
  due_date: string;
  property_id: string | null;
  property?: {
    title: string;
    location: string;
  };
}

export const usePaymentReminders = () => {
  const { user } = useAuth();
  const hasShownReminders = useRef(false);
  const notificationPermission = useRef<NotificationPermission>("default");

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") {
      notificationPermission.current = "granted";
      return true;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      notificationPermission.current = permission;
      return permission === "granted";
    }
    return false;
  }, []);

  const showReminder = useCallback((payment: UpcomingPayment, daysUntilDue: number) => {
    const title = payment.property?.title || "your rental";
    const message = daysUntilDue === 0
      ? `Payment of ₵${payment.amount.toLocaleString()} for ${title} is due today!`
      : `Payment of ₵${payment.amount.toLocaleString()} for ${title} is due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}.`;

    toast.warning(message, {
      description: `Due date: ${format(new Date(payment.due_date), "MMM d, yyyy")}`,
      duration: 8000,
    });

    if (notificationPermission.current === "granted") {
      new Notification("Payment Reminder - FlexiRents", {
        body: message,
        icon: "/favicon.ico",
      });
    }
  }, []);

  useEffect(() => {
    if (!user || hasShownReminders.current) return;

    const checkPayments = async () => {
      try {
        await requestNotificationPermission();
        const { data: payments } = await api.get('/api/payments/upcoming');
        if (!payments || payments.length === 0) return;

        hasShownReminders.current = true;
        payments.forEach((payment: UpcomingPayment) => {
          const daysUntilDue = differenceInDays(new Date(payment.due_date), new Date());
          if (daysUntilDue <= 7 && daysUntilDue >= 0) {
            showReminder(payment, daysUntilDue);
          }
        });
      } catch (error) {
        // Silently fail
      }
    };

    checkPayments();
  }, [user, requestNotificationPermission, showReminder]);
};