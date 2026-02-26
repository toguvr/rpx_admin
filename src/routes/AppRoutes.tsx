import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/layouts/AppLayout';
import { CourseDetailsPage } from '@/pages/CourseDetailsPage';
import { CoursesPage } from '@/pages/CoursesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ForumPage } from '@/pages/ForumPage';
import { ImportsPage } from '@/pages/ImportsPage';
import { LoginPage } from '@/pages/LoginPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { PsychologistChatPage } from '@/pages/PsychologistChatPage';
import { PsychologistsPage } from '@/pages/PsychologistsPage';
import { QuizDetailsPage } from '@/pages/QuizDetailsPage';
import { RankingPage } from '@/pages/RankingPage';
import { TeachersPage } from '@/pages/TeachersPage';
import { useAuthStore } from '@/store/auth';
import { hasAccess, roleAccessMap, type Role } from '@/types/roles';

function Private({ children }: { children: JSX.Element }) {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function RoleRoute({ routeKey, children }: { routeKey: string; children: JSX.Element }) {
  const role = useAuthStore((state) => state.user?.role);
  if (!hasAccess(role, routeKey)) {
    const firstAllowed = role ? roleAccessMap[role as Role]?.[0] : undefined;
    return <Navigate to={firstAllowed ? `/${firstAllowed}` : '/'} replace />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route
        path="/*"
        element={
          <Private>
            <AppLayout>
              <Routes>
                <Route
                  path="dashboard"
                  element={
                    <RoleRoute routeKey="dashboard">
                      <DashboardPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="courses"
                  element={
                    <RoleRoute routeKey="courses">
                      <CoursesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="courses/:courseId"
                  element={
                    <RoleRoute routeKey="courses">
                      <CourseDetailsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="courses/:courseId/quizzes/:quizId"
                  element={
                    <RoleRoute routeKey="courses">
                      <QuizDetailsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="forum"
                  element={
                    <RoleRoute routeKey="forum">
                      <ForumPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="ranking"
                  element={
                    <RoleRoute routeKey="ranking">
                      <RankingPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="imports"
                  element={
                    <RoleRoute routeKey="imports">
                      <ImportsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="psychologist-chat"
                  element={
                    <RoleRoute routeKey="psychologist-chat">
                      <PsychologistChatPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="psychologists"
                  element={
                    <RoleRoute routeKey="psychologists">
                      <PsychologistsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="teachers"
                  element={
                    <RoleRoute routeKey="teachers">
                      <TeachersPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="*"
                  element={
                    <Navigate
                      to={`/${
                        roleAccessMap[(useAuthStore.getState().user?.role as Role) ?? 'ADMIN']?.[0] ?? 'dashboard'
                      }`}
                      replace
                    />
                  }
                />
              </Routes>
            </AppLayout>
          </Private>
        }
      />
    </Routes>
  );
}
