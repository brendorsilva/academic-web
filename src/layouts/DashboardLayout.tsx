import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  GraduationCap,
  LogOut,
  Menu,
  BookOpen,
  CalendarDays,
  Library,
  Presentation,
  BookOpenCheck,
  UserCheck,
  BookOpenText,
  FileBadge,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// Novas importações para o Perfil e Logout
import { AuthService } from "@/services/auth.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  // Menus Administrativos
  {
    title: "Início",
    url: "/dashboard",
    icon: Home,
    allowedRoles: ["ADMIN", "COORDINATOR"],
  },
  {
    title: "Alunos",
    url: "/students",
    icon: Users,
    allowedRoles: ["ADMIN", "COORDINATOR"],
  },
  {
    title: "Professores",
    url: "/teachers",
    icon: GraduationCap,
    allowedRoles: ["ADMIN", "COORDINATOR"],
  },
  {
    title: "Cursos",
    url: "/courses",
    icon: BookOpen,
    allowedRoles: ["ADMIN", "COORDINATOR"],
  },
  {
    title: "Períodos Letivos",
    url: "/academic-periods",
    icon: CalendarDays,
    allowedRoles: ["ADMIN"],
  },
  {
    title: "Disciplinas",
    url: "/subjects",
    icon: Library,
    allowedRoles: ["ADMIN", "COORDINATOR"],
  },
  {
    title: "Turmas",
    url: "/class-groups",
    icon: Presentation,
    allowedRoles: ["ADMIN", "COORDINATOR"],
  },
  {
    title: "Ofertas (Aulas)",
    url: "/class-subjects",
    icon: BookOpenCheck,
    allowedRoles: ["ADMIN", "COORDINATOR"],
  },
  {
    title: "Matrículas",
    url: "/enrollments",
    icon: UserCheck,
    allowedRoles: ["ADMIN"],
  },
  {
    title: "Equipa de Gestão",
    url: "/coordinators",
    icon: ShieldAlert,
    allowedRoles: ["ADMIN"],
  },

  // Menus do Professor
  {
    title: "Meu Painel",
    url: "/teacher/dashboard",
    icon: Home,
    allowedRoles: ["TEACHER"],
  },
  {
    title: "Meus Diários",
    url: "/teacher/diaries",
    icon: BookOpenText,
    allowedRoles: ["TEACHER"],
  },
  {
    title: "Lançamento de Notas",
    url: "/teacher/grades",
    icon: FileBadge,
    allowedRoles: ["TEACHER"],
  },

  // Menus do Aluno
  {
    title: "Meu Painel",
    url: "/student/dashboard",
    icon: Home,
    allowedRoles: ["STUDENT"],
  },
  {
    title: "Meu Boletim",
    url: "/student/grades",
    icon: BookOpenCheck,
    allowedRoles: ["STUDENT"],
  },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const user = AuthService.getUser();
  const userRole = user?.role || "ADMIN";

  const filteredNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(userRole),
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <div className={`px-4 py-5 ${collapsed ? "px-2" : ""}`}>
          <h1
            className={`font-bold text-foreground ${collapsed ? "text-center text-sm" : "text-lg"}`}
          >
            {collapsed ? "GA" : "Gestão Acadêmica"}
          </h1>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function Topbar() {
  const navigate = useNavigate();

  // Lógica do Utilizador Logado
  const user = AuthService.getUser();
  const userName =
    user?.name || user?.fullName || user?.email || "Administrador";
  const userEmail = user?.email || "admin@sistema.com";
  const userInitials = userName.substring(0, 2).toUpperCase();

  const handleLogout = () => {
    AuthService.logout(); // Limpa o token do LocalStorage
    navigate("/login"); // Redireciona para o login
  };

  return (
    <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger>
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair do Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
