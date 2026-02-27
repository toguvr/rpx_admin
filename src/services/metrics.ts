import { api } from '@/services/api';

export type DatePreset = '7d' | '30d' | '90d';

export type MetricsFilters = {
  from: string;
  to: string;
  courseId?: string;
  groupId?: string;
};

export type OverviewResponse = {
  summary: {
    activeStudents: number;
    newStudents: number;
    lessonsCompleted: number;
    quizzesDone: number;
    avgEfficiency: number;
    completionRate: number;
    engagementRate: number;
    openForumQuestions: number;
  };
  distributions: {
    efficiencyByCourse: Array<{ courseId: string; title: string; efficiency: number }>;
    completionByCourse: Array<{ courseId: string; title: string; completionRate: number }>;
    statusDistribution: Array<{ status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; label: string; value: number }>;
  };
  tables: {
    topCourses: Array<{
      courseId: string;
      title: string;
      completionRate: number;
      efficiency: number;
      engagement: number;
      quizAttempts: number;
    }>;
    topStudents: Array<{
      userId: string;
      name: string;
      completedLessons: number;
      initialQuizScore: number;
      finalQuizScore: number;
      quizImprovement: number;
      efficiency: number;
    }>;
    riskStudents: Array<{
      userId: string;
      name: string;
      completedLessons: number;
      initialQuizScore: number;
      finalQuizScore: number;
      quizImprovement: number;
      efficiency: number;
    }>;
  };
};

export type TimeseriesMetric = 'quizzes' | 'lessons' | 'signups';

export type TimeseriesResponse = Array<{ label: string; value: number }>;

export type TopCoursesBy = 'completion' | 'efficiency' | 'engagement';

export type RiskStudent = {
  userId: string;
  name: string;
  completedLessons: number;
  initialQuizScore: number;
  finalQuizScore: number;
  quizImprovement: number;
  inactivityDays: number;
  riskScore: number;
  lastActivityAt: string | null;
};

function cleanFilters(filters: MetricsFilters) {
  return {
    from: filters.from,
    to: filters.to,
    ...(filters.courseId ? { courseId: filters.courseId } : {}),
    ...(filters.groupId ? { groupId: filters.groupId } : {}),
  };
}

export async function getMetricsFilters() {
  const { data } = await api.get<{
    courses: Array<{ id: string; title: string }>;
    groups: Array<{ id: string; name: string }>;
    presets: Array<{ label: string; value: DatePreset }>;
  }>('/admin/metrics/filters');
  return data;
}

export async function getMetricsOverview(filters: MetricsFilters) {
  const { data } = await api.get<OverviewResponse>('/admin/metrics/overview', {
    params: cleanFilters(filters),
  });
  return data;
}

export async function getMetricsTimeseries(
  filters: MetricsFilters,
  metric: TimeseriesMetric,
  groupBy: 'day' | 'week',
) {
  const { data } = await api.get<TimeseriesResponse>('/admin/metrics/timeseries', {
    params: {
      ...cleanFilters(filters),
      metric,
      groupBy,
    },
  });
  return data;
}

export async function getMetricsTopCourses(filters: MetricsFilters, by: TopCoursesBy) {
  const { data } = await api.get<OverviewResponse['tables']['topCourses']>('/admin/metrics/top-courses', {
    params: {
      ...cleanFilters(filters),
      by,
    },
  });
  return data;
}

export async function getMetricsRiskStudents(filters: MetricsFilters, threshold = 14) {
  const { data } = await api.get<RiskStudent[]>('/admin/metrics/risk-students', {
    params: {
      ...cleanFilters(filters),
      threshold,
    },
  });
  return data;
}
