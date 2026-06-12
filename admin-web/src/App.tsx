import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoadingProvider } from './contexts/LoadingContext';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PlatformModulePage from './pages/PlatformModulePage';
import ProtectedRoute from './components/common/ProtectedRoute';
import OperationsDashboardPage from './pages/OperationsDashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import WorkLogsPage from './pages/WorkLogsPage';
import AuditTemplatesPage from './pages/AuditTemplatesPage';
import MonthlyReportPage from './pages/MonthlyReportPage';
import NotificationsPage from './pages/NotificationsPage';
import CalendarPage from './pages/CalendarPage';
import NotesPage from './pages/NotesPage';
import DailyGoalsPage from './pages/DailyGoalsPage';
import PomodoroPage from './pages/PomodoroPage';
import BadgesPage from './pages/BadgesPage';
import TeamUsersPage from './pages/TeamUsersPage';
import DepartmentsPage from './pages/DepartmentsPage';
import ProfilePage from './pages/ProfilePage';
import OrganizationsPage from './pages/OrganizationsPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogPage from './pages/AuditLogPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import QuestionnairesPage from './pages/QuestionnairesPage';
import ResponsesPage from './pages/ResponsesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ExpensesPage from './pages/ExpensesPage';

const moduleRoutes = [
  {
    path: 'dashboard',
    title: 'Dashboard',
    description: 'Байгууллага, төсөл, ажилтан, ажил, audit, сарын тайлангийн нэгдсэн самбар.',
    items: ['Project progress', 'Employee workload', 'Monthly productivity', 'Audit score'],
  },
  {
    path: 'projects',
    title: 'Төслүүд',
    description: 'Төсөл бүрийн явц, deadline, баг, ажлын биелэлтийг нэг дор харуулна.',
    items: ['Project progress', 'Team ownership', 'Milestones', 'Budget and deadline'],
  },
  {
    path: 'tasks',
    title: 'Ажлууд',
    description: 'Ирээдүйд хийх ажил, шинээр гарсан ажил, өдөр тутмын гүйцэтгэлийг бүртгэнэ.',
    items: ['Assignee and priority', 'Status workflow', 'Due dates', 'Estimated and actual hours'],
  },
  {
    path: 'kanban',
    title: 'Kanban',
    description: 'Backlog, хийх, хийж байгаа, review, дууссан гэсэн ажлын урсгал.',
    items: ['Drag and drop board', 'Sprint view', 'Blocked work', 'Quick updates'],
  },
  {
    path: 'calendar',
    title: 'Календар',
    description: 'Ажил, төсөл, audit, тайлангийн хугацааг календар дээр төлөвлөнө.',
    items: ['Task deadlines', 'Audit schedules', 'Monthly reports', 'Team workload'],
  },
  {
    path: 'work-logs',
    title: 'Өдрийн ажлын бүртгэл',
    description: 'Ажилтан бүр хийсэн ажил, зарцуулсан цаг, blocker, дараагийн алхмаа тэмдэглэнэ.',
    items: ['Daily summary', 'Project/task link', 'Blockers', 'Next actions'],
  },
  {
    path: 'time',
    title: 'Цаг бүртгэл',
    description: 'Ажил дээр байсан цаг, task дээр зарцуулсан цаг, сарын нийлбэрийг бүртгэнэ.',
    items: ['Clock in/out', 'Task timer', 'Monthly totals', 'Timesheet approval'],
  },
  {
    path: 'fives',
    title: '5S Audit',
    description: '5S checklist бөглөх, оноо тооцох, сайжруулалтын action үүсгэх module.',
    items: ['Sort', 'Set in order', 'Shine', 'Standardize', 'Sustain'],
  },
  {
    path: 'audit-templates',
    title: 'Audit Templates',
    description: 'Manufacturing, construction, retail, logistics зэрэг салбарын checklist загварууд.',
    items: ['Safety', 'Quality', 'Compliance', 'Risk', 'Operational excellence'],
  },
  {
    path: 'organizations',
    title: 'Organizations',
    description: 'Байгууллага, салбар, workspace тохиргоо, subscription, үндсэн мэдээлэл.',
    items: ['Workspace profile', 'Industry', 'Branches', 'Organization reports'],
  },
  {
    path: 'users',
    title: 'Users',
    description: 'Owner, admin, manager, employee эрхтэй хэрэглэгчдийн удирдлага.',
    items: ['Roles', 'Departments', 'Permissions', 'Employee profile'],
  },
  {
    path: 'departments',
    title: 'Хэлтсүүд',
    description: 'Байгууллагын хэлтэс, баг, manager, ажилтнуудын бүтэц.',
    items: ['Department tree', 'Managers', 'Members', 'Department reports'],
  },
  {
    path: 'questionnaires',
    title: 'Questionnaires',
    description: 'Checklist болон assessment form үүсгэх үндсэн builder.',
    items: ['Questions', 'Scoring', 'Template library', 'Response collection'],
  },
  {
    path: 'responses',
    title: 'Responses',
    description: 'Асуулга, checklist, audit бөглөсөн хариултуудын нэгтгэл.',
    items: ['Submissions', 'Scores', 'Review', 'Corrective actions'],
  },
  {
    path: 'expenses',
    title: 'Expenses',
    description: 'Төсөл болон байгууллагын зардлын бүртгэл, тайлантай холбох хэсэг.',
    items: ['Expense log', 'Project budget', 'Approval', 'Forecast'],
  },
  {
    path: 'reports',
    title: 'Reports',
    description: 'Ажилтан, төсөл, хэлтэс, байгууллагын сарын болон нэгдсэн тайлан.',
    items: ['Monthly employee report', 'Project report', 'Audit report', 'PDF/CSV/Excel'],
  },
  {
    path: 'analytics',
    title: 'Analytics',
    description: 'Бүтээмж, workload, completion rate, overdue task, audit score-г харуулна.',
    items: ['Employee productivity', 'Project completion', 'Audit trends', 'Department comparison'],
  },
  {
    path: 'notifications',
    title: 'Мэдэгдэл',
    description: 'Ажил оноох, хугацаа дөхөх, approve хийх, тайлан гарах мэдэгдлүүд.',
    items: ['Assignments', 'Due dates', 'Approvals', 'Monthly report ready'],
  },
  {
    path: 'profile',
    title: 'Профайл',
    description: 'Ажилтны хувийн мэдээлэл, role, productivity summary, сарын үзүүлэлт.',
    items: ['Personal info', 'Role and department', 'Monthly work summary', 'Badges'],
  },
  {
    path: 'pomodoro',
    title: 'Pomodoro',
    description: 'Focus session бүртгэж task болон work log-той холбох productivity хэрэгсэл.',
    items: ['Focus timer', 'Breaks', 'Task link', 'Daily focus total'],
  },
  {
    path: 'notes',
    title: 'Тэмдэглэл',
    description: 'Ажилтан өөрийн тэмдэглэл, meeting note, project note хадгална.',
    items: ['Personal notes', 'Project notes', 'Meeting notes', 'Search'],
  },
  {
    path: 'goals',
    title: 'Өдрийн зорилго',
    description: 'Өдрийн зорилго, биелэлт, дараагийн ажилтай холбосон tracking.',
    items: ['Daily goals', 'Completion', 'Carry-over', 'Review'],
  },
  {
    path: 'badges',
    title: 'Badges',
    description: 'Гүйцэтгэл, чанар, тогтмол байдлаар ажилтны recognition өгөх хэсэг.',
    items: ['Completion streaks', 'Quality score', 'Team recognition', 'Monthly awards'],
  },
  {
    path: 'export',
    title: 'Export Reports',
    description: 'PDF, CSV, Excel тайлан экспортлох, сарын тайлан татах хэсэг.',
    items: ['PDF', 'CSV', 'Excel', 'Scheduled exports'],
  },
  {
    path: 'admin',
    title: 'Admin Dashboard',
    description: 'Байгууллага, хэрэглэгч, module, template, тайлангийн удирдлагын төв.',
    items: ['Workspace overview', 'Users', 'Templates', 'Reports', 'Settings'],
  },
  {
    path: 'audit',
    title: 'Audit Log',
    description: 'Owner-д зориулсан системийн өөрчлөлт, login, permission, report үйлдлийн мөр.',
    items: ['User activity', 'Permission changes', 'Report generation', 'Security events'],
  },
  {
    path: 'settings',
    title: 'Settings',
    description: 'Workspace, profile, security, notification, report тохиргоо.',
    items: ['Workspace settings', 'Security', 'Notifications', 'Report automation'],
  },
];

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
              <Route
                path="/register"
                element={
                  <PlatformModulePage
                    title="Бүртгүүлэх"
                    description="Шинэ байгууллага, owner, admin бүртгэлийн урсгал энд хөгжүүлэгдэнэ."
                    items={['Organization signup', 'Owner account', 'Workspace setup']}
                  />
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PlatformModulePage
                    title="Нууц үг сэргээх"
                    description="И-мэйлээр token илгээж нууц үг сэргээх public урсгал."
                    items={['Email request', 'Reset token', 'Security audit log']}
                  />
                }
              />
              <Route
                path="/reset-password/:token"
                element={
                  <PlatformModulePage
                    title="Шинэ нууц үг"
                    description="Token баталгаажуулж шинэ нууц үг хадгалах дэлгэц."
                    items={['Token validation', 'New password form', 'Session cleanup']}
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
                <Route path="fives" element={<AuditTemplatesPage />} />
                <Route path="audit-templates" element={<AuditTemplatesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="reports" element={<MonthlyReportPage />} />
                <Route path="export" element={<MonthlyReportPage />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="goals" element={<DailyGoalsPage />} />
                <Route path="pomodoro" element={<PomodoroPage />} />
                <Route path="badges" element={<BadgesPage />} />
                <Route path="users" element={<TeamUsersPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="organizations" element={<OrganizationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="audit" element={<AuditLogPage />} />
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route path="questionnaires" element={<QuestionnairesPage />} />
                <Route path="responses" element={<ResponsesPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                {moduleRoutes
                  .filter(
                    (route) =>
                      ![
                        'dashboard',
                        'projects',
                        'tasks',
                        'kanban',
                        'calendar',
                        'work-logs',
                        'time',
                        'fives',
                        'audit-templates',
                        'notifications',
                        'reports',
                        'export',
                        'notes',
                        'goals',
                        'pomodoro',
                        'badges',
                        'users',
                        'departments',
                        'profile',
                        'organizations',
                        'settings',
                        'audit',
                        'admin',
                        'questionnaires',
                        'responses',
                        'analytics',
                        'expenses',
                      ].includes(route.path),
                  )
                  .map((route) => (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={
                        <PlatformModulePage
                          title={route.title}
                          description={route.description}
                          items={route.items}
                        />
                      }
                    />
                  ))}
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
