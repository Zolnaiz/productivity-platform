import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Loading from "./components/common/Loading";

// Every page but the first two a visitor sees is its own chunk, loaded
// when it is first opened.
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ZonePage = lazy(() => import("./pages/ZonePage"));
const OperationsDashboardPage = lazy(() => import("./pages/OperationsDashboardPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const WorkLogsPage = lazy(() => import("./pages/WorkLogsPage"));
const FiveSSetupPage = lazy(() => import("./pages/FiveSSetupPage"));
const IdeasPage = lazy(() => import("./pages/IdeasPage"));
const HuddlePage = lazy(() => import("./pages/HuddlePage"));
const AuditInsightsPage = lazy(() => import("./pages/AuditInsightsPage"));
const SetupPage = lazy(() => import("./pages/SetupPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const GembaPage = lazy(() => import("./pages/GembaPage"));
const WeeklyCheckinPage = lazy(() => import("./pages/WeeklyCheckinPage"));
const AuditTemplatesPage = lazy(() => import("./pages/AuditTemplatesPage"));
const MonthlyReportPage = lazy(() => import("./pages/MonthlyReportPage"));
const PeriodReportPage = lazy(() => import("./pages/PeriodReportPage"));
const ProgressBoardPage = lazy(() => import("./pages/ProgressBoardPage"));
const MonthPlanPage = lazy(() => import("./pages/MonthPlanPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const DailyGoalsPage = lazy(() => import("./pages/DailyGoalsPage"));
const PomodoroPage = lazy(() => import("./pages/PomodoroPage"));
const BadgesPage = lazy(() => import("./pages/BadgesPage"));
const TeamUsersPage = lazy(() => import("./pages/TeamUsersPage"));
const DepartmentsPage = lazy(() => import("./pages/DepartmentsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AcceptInvitationPage = lazy(() => import("./pages/AcceptInvitationPage"));
const OrganizationsPage = lazy(() => import("./pages/OrganizationsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AuditLogPage = lazy(() => import("./pages/AuditLogPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const QuestionnairesPage = lazy(() => import("./pages/QuestionnairesPage"));
const ResponsesPage = lazy(() => import("./pages/ResponsesPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));

const adminRoles = ["admin", "super_admin"];
// Whoever runs other people's work.
const managerRoles = ["manager", "admin", "organization_admin", "super_admin"];

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
            <Toaster position="top-right" />
            <Suspense fallback={<Loading fullscreen />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

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
                <Route path="account" element={<AccountPage />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
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
                  path="gemba"
                  element={
                    <ProtectedRoute roles={managerRoles}>
                      <GembaPage />
                    </ProtectedRoute>
                  }
                />
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
            </Suspense>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
