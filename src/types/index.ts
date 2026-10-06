export type { ApiError } from "@/lib/schemas/common";
export type {
  TitleFont,
  ThemeMode,
  UserSettings,
  User,
  RegisterInput,
  LoginInput,
  UpdateMeInput,
} from "@/lib/schemas/user";
export type {
  ProjectScope,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/schemas/project";
export type { Subject, CreateSubjectInput, UpdateSubjectInput } from "@/lib/schemas/subject";
export type {
  Priority,
  TaskFilter,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ArchivedTask,
  DueTask,
  ScheduledTask,
} from "@/lib/schemas/task";
export type { Role, Member, UpdateMemberRoleInput } from "@/lib/schemas/member";
export type {
  InviteStatus,
  Invite,
  CreateInviteInput,
  JoinInviteInput,
} from "@/lib/schemas/invite";
export type { StreakDay, StreakSummary } from "@/lib/schemas/streak";
export type {
  ClassSchedule,
  CreateClassScheduleInput,
  UpdateClassScheduleInput,
  BulkCreateClassSchedulesInput,
} from "@/lib/schemas/schedule";
export type {
  AttendanceStatus,
  AttendanceRecord,
  CreateAttendanceInput,
  UpdateAttendanceInput,
  AttendanceSummary,
  AttendanceWeekDay,
  AttendanceShareCourse,
} from "@/lib/schemas/attendance";
