import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  UserPlus,
  Users,
  BookOpen,
  Settings,
  Shield,
  MoreHorizontal,
  ClipboardList,
} from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AuthLayoutSkeleton } from "./AuthLayoutSkeleton";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { isLoading, user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (isLoading) return <AuthLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DesktopLayout setSidebarWidth={setSidebarWidth}>{children}</DesktopLayout>
    </SidebarProvider>
  );
}

function MobileLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const primaryItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: UserPlus, label: "Add Student", path: "/add-student" },
    { icon: Users, label: "Students", path: "/students" },
    { icon: UserPlus, label: "Staff Register", path: "/staff-register" },
  ];

  const overflowItems = [
    ...(isAdmin ? [
      { icon: BookOpen, label: "Programs & Courses", path: "/programs" },
      { icon: Shield, label: "Staff Management", path: "/staff" },
      { icon: ClipboardList, label: "Registrations", path: "/admin/registrations" },
    ] : []),
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const allItems = [...primaryItems, ...overflowItems];
  const activeItem = allItems.find((item) => item.path === location.pathname);
  const hasOverflow = overflowItems.length > 1;
  const activeInOverflow = overflowItems.find((item) => item.path === location.pathname);

  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 sticky top-0 z-40">
        <span className="tracking-tight font-medium">{activeItem?.label ?? "Menu"}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full hover:bg-accent/50 p-0.5">
              <Avatar className="h-8 w-8 border">
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /><span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /><span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <main className="flex-1 p-4 pb-20">{children}</main>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-50 flex items-center h-16">
        {!hasOverflow ? (
          allItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-1 py-1 px-2 min-w-0 flex-1">
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[10px] leading-tight ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>{item.label}</span>
              </button>
            );
          })
        ) : (
          <>
            {primaryItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-1 py-1 px-2 min-w-0 flex-1">
                  <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[10px] leading-tight ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>{item.label}</span>
                </button>
              );
            })}
            <Popover>
              <PopoverTrigger asChild>
                <button className={`flex flex-col items-center gap-1 py-1 px-2 min-w-0 flex-1 ${activeInOverflow ? "text-primary" : "text-muted-foreground"}`}>
                  <MoreHorizontal className="h-5 w-5" />
                  <span className={`text-[10px] leading-tight ${activeInOverflow ? "text-primary font-medium" : ""}`}>More</span>
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-48 mb-2 p-1">
                {overflowItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button key={item.path} onClick={() => navigate(item.path)} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm ${isActive ? "bg-accent text-primary font-medium" : "hover:bg-accent"}`}>
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    </div>
  );
}

function DesktopLayout({ children, setSidebarWidth }: { children: ReactNode; setSidebarWidth: (w: number) => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === "admin";

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: UserPlus, label: "Add Student", path: "/add-student" },
    { icon: Users, label: "Students", path: "/students" },
    { icon: UserPlus, label: "Staff Register", path: "/staff-register" },
    ...(isAdmin ? [
      { icon: BookOpen, label: "Programs & Courses", path: "/programs" },
      { icon: Shield, label: "Staff Management", path: "/staff" },
      { icon: ClipboardList, label: "Registrations", path: "/admin/registrations" },
    ] : []),
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) setIsResizing(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const w = e.clientX - left;
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) setSidebarWidth(w);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0">
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 w-full">
              <button onClick={() => { setIsResizing(false); toggleSidebar(); }} className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg shrink-0">
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <span className="font-semibold tracking-tight truncate text-sm">Admission System</span>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton isActive={isActive} onClick={() => navigate(item.path)} tooltip={item.label} className="h-10 font-normal">
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-3">
            <div className="px-2 py-1 mb-2">
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 w-full text-left group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate">{user?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email || "-"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /><span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }} style={{ zIndex: 50 }} />
      </div>
      <SidebarInset>
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">{children}</main>
      </SidebarInset>
    </>
  );
}
