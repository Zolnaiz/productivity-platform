import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PlatformModulePage from "./pages/PlatformModulePage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import OperationsDashboardPage from "./pages/OperationsDashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import TasksPage from "./pages/TasksPage";
import WorkLogsPage from "./pages/WorkLogsPage";
import FiveSSetupPage from "./pages/FiveSSetupPage";
import AuditTemplatesPage from "./pages/AuditTemplatesPage";
import MonthlyReportPage from "./pages/MonthlyReportPage";
import NotificationsPage from "./pages/NotificationsPage";
import CalendarPage from "./pages/CalendarPage";
import NotesPage from "./pages/NotesPage";
import DailyGoalsPage from "./pages/DailyGoalsPage";
import PomodoroPage from "./pages/PomodoroPage";
import BadgesPage from "./pages/BadgesPage";
import TeamUsersPage from "./pages/TeamUsersPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import ProfilePage from "./pages/ProfilePage";
import OrganizationsPage from "./pages/OrganizationsPage";
import SettingsPage from "./pages/SettingsPage";
import AuditLogPage from "./pages/AuditLogPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import QuestionnairesPage from "./pages/QuestionnairesPage";
import ResponsesPage from "./pages/ResponsesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ExpensesPage from "./pages/ExpensesPage";

const adminRoles = ["admin", "super_admin"];
const ownerRoles = ["super_admin"];

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <LoadingProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/forgot-password"
                element={
                  <PlatformModulePage
                    titleKey="auth.forgotPasswordTitle"
                    descriptionKey="auth.forgotPasswordDescription"
                    items={[
                      "Email request",
                      "Reset token",
                      "Security audit log",
                    ]}
                  />
                }
              />
              <Route
                path="/reset-password/:token"
                element={
                  <PlatformModulePage
                    titleKey="auth.newPasswordTitle"
                    descriptionKey="auth.newPasswordDescription"
                    items={[
                      "Token validation",
                      "New password form",
                      "Session cleanup",
                    ]}
                  />
                }
              />

              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<OperationsDashboardPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="kanban" element={<TasksPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="work-logs" element={<WorkLogsPage />} />
                <Route path="time" element={<WorkLogsPage />} />
                <Route path="fives" element={<FiveSSetupPage />} />
                <Route
                  path="audit-templates"
                  element={<AuditTemplatesPage />}
                />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="reports" element={<MonthlyReportPage />} />
                <Route path="export" element={<MonthlyReportPage />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="goals" element={<DailyGoalsPage />} />
                <Route path="pomodoro" element={<PomodoroPage />} />
                <Route path="badges" element={<BadgesPage />} />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute roles={adminRoles}>
                      <TeamUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="departments"
                  element={
                    <ProtectedRoute roles={adminRoles}>
                      <DepartmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="profile" element={<ProfilePage />} />
                <Route
                  path="organizations"
                  element={
                    <ProtectedRoute roles={adminRoles}>
                      <OrganizationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute roles={adminRoles}>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="audit"
                  element={
                    <ProtectedRoute roles={ownerRoles}>
                      <AuditLogPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute roles={adminRoles}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="assessments" element={<QuestionnairesPage />} />
                <Route
                  path="questionnaires"
                  element={<Navigate to="/assessments" replace />}
                />
                <Route path="responses" element={<ResponsesPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </LoadingProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
