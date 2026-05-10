import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, isSameMonth, addMonths, subMonths, isToday } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PaymentRecord {
  id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
}

interface PaymentCalendarProps {
  payments: PaymentRecord[];
}

export function PaymentCalendar({ payments }: PaymentCalendarProps) {
  const { formatPrice } = useCurrency();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Create a map of dates to payments
  const paymentsByDate = useMemo(() => {
    const map = new Map<string, PaymentRecord[]>();
    payments.forEach((payment) => {
      const dateKey = format(new Date(payment.due_date), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, payment]);
    });
    return map;
  }, [payments]);

  // Get payments for the selected date
  const selectedDatePayments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return paymentsByDate.get(dateKey) || [];
  }, [selectedDate, paymentsByDate]);

  // Get monthly summary
  const monthlySummary = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    let paid = 0;
    let pending = 0;
    let overdue = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    payments.forEach((payment) => {
      const dueDate = new Date(payment.due_date);
      if (dueDate >= start && dueDate <= end) {
        if (payment.status === "paid" || payment.status === "verified") {
          paid++;
          paidAmount += payment.amount;
        } else if (payment.status === "overdue") {
          overdue++;
          overdueAmount += payment.amount;
        } else if (payment.status === "pending") {
          pending++;
          pendingAmount += payment.amount;
        }
      }
    });

    return { paid, pending, overdue, paidAmount, pendingAmount, overdueAmount };
  }, [payments, currentMonth]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
      case "verified":
        return { color: "bg-green-500", textColor: "text-green-600", label: "Paid", Icon: CheckCircle2 };
      case "pending":
        return { color: "bg-yellow-500", textColor: "text-yellow-600", label: "Pending", Icon: Clock };
      case "overdue":
        return { color: "bg-red-500", textColor: "text-red-600", label: "Overdue", Icon: AlertCircle };
      case "cancelled":
        return { color: "bg-muted", textColor: "text-muted-foreground", label: "Cancelled", Icon: XCircle };
      default:
        return { color: "bg-muted", textColor: "text-muted-foreground", label: status, Icon: Clock };
    }
  };

  // Custom day content for the calendar
  const modifiers = useMemo(() => {
    const paidDays: Date[] = [];
    const pendingDays: Date[] = [];
    const overdueDays: Date[] = [];

    payments.forEach((payment) => {
      const date = new Date(payment.due_date);
      if (payment.status === "paid" || payment.status === "verified") {
        paidDays.push(date);
      } else if (payment.status === "overdue") {
        overdueDays.push(date);
      } else if (payment.status === "pending") {
        pendingDays.push(date);
      }
    });

    return { paid: paidDays, pending: pendingDays, overdue: overdueDays };
  }, [payments]);

  const modifiersStyles = {
    paid: {
      backgroundColor: "hsl(var(--chart-2) / 0.2)",
      borderRadius: "50%",
      border: "2px solid hsl(var(--chart-2))"
    },
    pending: {
      backgroundColor: "hsl(var(--chart-4) / 0.2)",
      borderRadius: "50%",
      border: "2px solid hsl(var(--chart-4))"
    },
    overdue: {
      backgroundColor: "hsl(var(--destructive) / 0.2)",
      borderRadius: "50%",
      border: "2px solid hsl(var(--destructive))"
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Payment Calendar
            </CardTitle>
            <CardDescription>
              Visual overview of your payment schedule
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border w-full"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                month: "space-y-4 w-full",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
                row: "flex w-full mt-2",
                cell: "flex-1 h-12 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md flex items-center justify-center",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
              }}
            />

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-[hsl(var(--chart-2))] opacity-70 border-2 border-[hsl(var(--chart-2))]" />
                <span className="text-sm text-muted-foreground">Paid</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-[hsl(var(--chart-4))] opacity-70 border-2 border-[hsl(var(--chart-4))]" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-destructive opacity-70 border-2 border-destructive" />
                <span className="text-sm text-muted-foreground">Overdue</span>
              </div>
            </div>
          </div>

          {/* Sidebar - Monthly Summary & Selected Date */}
          <div className="space-y-4">
            {/* Monthly Summary */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium text-sm">Monthly Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Paid</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-green-600">{monthlySummary.paid}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({formatPrice(monthlySummary.paidAmount)})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-yellow-600">{monthlySummary.pending}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({formatPrice(monthlySummary.pendingAmount)})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Overdue</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-red-600">{monthlySummary.overdue}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({formatPrice(monthlySummary.overdueAmount)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium text-sm flex items-center justify-between">
                  <span>{format(selectedDate, "MMMM d, yyyy")}</span>
                  {isToday(selectedDate) && (
                    <Badge variant="secondary">Today</Badge>
                  )}
                </h4>
                {selectedDatePayments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDatePayments.map((payment) => {
                      const config = getStatusConfig(payment.status);
                      const StatusIcon = config.Icon;
                      return (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${config.textColor}`} />
                            <div>
                              <p className="text-sm font-medium">{formatPrice(payment.amount)}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {config.label}
                              </Badge>
                            </div>
                          </div>
                          {payment.payment_date && (
                            <span className="text-xs text-muted-foreground">
                              Paid: {format(new Date(payment.payment_date), "MMM d")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No payments scheduled for this date.
                  </p>
                )}
              </div>
            )}

            {!selectedDate && (
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Click on a date to see payment details
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
