import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Home,
  Briefcase,
  Store,
  Calendar,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  LogOut,
  DollarSign,
  CheckCircle,
  CalendarCheck,
  FileText,
  FileBarChart,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Properties", url: "/admin/properties", icon: Home },
  { title: "Bookings", url: "/admin/bookings", icon: Calendar },
  { title: "Payment Approval", url: "/admin/payment-approval", icon: CheckCircle },
  { title: "Financial Reports", url: "/admin/financial-reports", icon: FileBarChart },
  { title: "Viewing Schedules", url: "/admin/viewing-schedules", icon: CalendarCheck },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Verification", url: "/admin/verification", icon: ShieldCheck },
  { title: "Service Providers", url: "/admin/service-providers", icon: Briefcase },
  { title: "Vendors", url: "/admin/vendors", icon: Store },
  { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Currency Rates", url: "/admin/currency-rates", icon: DollarSign },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"}>
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "text-center" : ""}>
            {isCollapsed ? "Admin" : "Admin Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 hover:bg-accent transition-all duration-200 active:scale-95 hover:scale-[1.02] ${
                          isActive ? "bg-primary/10 text-primary font-medium" : ""
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 transition-transform duration-200 group-active:scale-110" />
                      {!isCollapsed && <span className="transition-colors duration-200">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/"
                className="flex items-center gap-3 hover:bg-accent transition-all duration-200"
              >
                <Home className="h-4 w-4" />
                {!isCollapsed && <span>Home</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-2 px-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
