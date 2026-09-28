import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PlatformModulePage from "./pages/PlatformModulePage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ZonePage from "./pages/ZonePage";
import OperationsDashboardPage from "./pages/OperationsDashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import TasksPage from "./pages/TasksPage";
import WorkLogsPage from "./pages/WorkLogsPage";
import FiveSSetupPage from "./pages/FiveSSetupPage";
import IdeasPage from "./pages/IdeasPage";
import HuddlePage from "./pages/HuddlePage";
import AuditInsightsPage from "./pages/AuditInsightsPage";
import SetupPage from "./pages/SetupPage";
import HistoryPage from "./pages/HistoryPage";
import WeeklyCheckinPage from "./pages/WeeklyCheckinPage";
import AuditTemplatesPage from "./pages/AuditTemplatesPage";
import MonthlyReportPage from "./pages/MonthlyReportPage";
import PeriodReportPage from "./pages/PeriodReportPage";
import ProgressBoardPage from "./pages/ProgressBoardPage";
import MonthPlanPage from "./pages/MonthPlanPage";
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

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
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
                <Route path="progress" element={<ProgressBoardPage />} />
                <Route path="plan" element={<MonthPlanPage />} />
                <Route path="kanban" element={<Navigate to="/tasks" replace />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="work-logs" element={<WorkLogsPage />} />
                <Route path="time" element={<WorkLogsPage />} />
                <Route path="fives" element={<FiveSSetupPage />} />
                {/*
                  What a zone's label on the wall opens. Inside the protected
                  layout: an area's standard, its owner and what is still
                  red-tagged are the organization's, not the public's.
                */}
                <Route path="zone/:planId/:zoneId" element={<ZonePage />} />
                <Route
                  path="audit-templates"
                  element={<AuditTemplatesPage />}
                />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="reports" element={<MonthlyReportPage />} />
                <Route path="reports/period" element={<PeriodReportPage />} />
                <Route path="export" element={<Navigate to="/reports" replace />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="goals" element={<DailyGoalsPage />} />
                <Route path="pomodoro" element={<PomodoroPage />} />
                <Route path="badges" element={<BadgesPage />} />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute permission="users:read">
                      <TeamUsersPage />
                    </ProtectedRoute>
                  }
                />
                {/* Departments are browser-local still, so there is no server
                    permission to name for this one. */}
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
                    <ProtectedRoute permission="organization:update">
                      <OrganizationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute permission="organization:update">
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="audit"
                  element={
                    <ProtectedRoute permission="auditlog:read">
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
                <Route path="ideas" element={<IdeasPage />} />
                <Route path="weekly" element={<WeeklyCheckinPage />} />
                <Route path="huddle" element={<HuddlePage />} />
                <Route path="audit-insights" element={<AuditInsightsPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route
                  path="setup"
                  element={
                    <ProtectedRoute roles={adminRoles}>
                      <SetupPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
