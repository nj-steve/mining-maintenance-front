import { request } from '../request';

export interface ScheduledTask {
  name: string;
  enabled: boolean;
  schedule: string;
  interval_seconds: number;
  timeout_seconds: number;
  max_retries: number;
  run_on_start: boolean;
  status: string;
  next_run_at: string | null;
  last_started_at: string | null;
  last_finished_at: string | null;
  last_success_at: string | null;
  last_error: string;
  pending: boolean;
}

export type TaskSettings = Partial<
  Pick<ScheduledTask, 'enabled' | 'interval_seconds' | 'run_on_start' | 'timeout_seconds' | 'max_retries'>
>;

export interface TaskRun {
  id: number;
  name: string;
  status: string;
  trigger: string;
  started_at: string | null;
  finished_at: string | null;
  duration_ms?: number;
  attempt?: number;
  processed_count?: number | null;
  failed_count?: number | null;
  error: string;
}

interface TaskOverview {
  worker: { online: boolean; heartbeat_at: string | null; worker_id: string } | null;
  tasks: ScheduledTask[];
}

interface TaskRunPage {
  list: TaskRun[];
  pagination: { page: number; page_size: number; total: number; pages: number };
}

const tasksURL = '/api/admin/tasks';
const taskURL = (name: string) => `${tasksURL}/${encodeURIComponent(name)}`;
const timeout = 15000;

export function fetchTaskOverview() {
  return request<TaskOverview>({ url: tasksURL, method: 'get', timeout });
}

export function fetchTaskRuns(name: string, page: number, pageSize: number) {
  return request<TaskRunPage>({
    url: `${taskURL(name)}/runs`,
    method: 'get',
    params: { page, page_size: pageSize },
    timeout
  });
}

export function updateTaskSettings(name: string, data: TaskSettings) {
  return request({ url: taskURL(name), method: 'patch', data, timeout });
}

export function enqueueTask(name: string, action: 'run' | 'retry') {
  return request({ url: `${taskURL(name)}/${action}`, method: 'post', timeout });
}
