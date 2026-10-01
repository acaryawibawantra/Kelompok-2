import type {
  CreateInviteInput,
  CreateProjectInput,
  CreateSubjectInput,
  CreateTaskInput,
  Invite,
  LoginInput,
  Member,
  Project,
  ProjectScope,
  RegisterInput,
  StreakSummary,
  Subject,
  Task,
  UpdateMeInput,
  UpdateMemberRoleInput,
  UpdateProjectInput,
  UpdateSubjectInput,
  UpdateTaskInput,
  User,
} from "@/types";

export interface ProjectDetail {
  project: Project;
  subjects: Subject[];
  tasks: Task[];
  members: Member[];
}

export interface ArchivedTask extends Task {
  projectName: string;
  subjectName: string;
}

export interface DueTask extends Task {
  projectName: string;
  subjectName: string;
}

export interface TaskMutationResult {
  task: Task;
  streak: StreakSummary;
}

export interface TaskCanvasApi {
  auth: {
    register(input: RegisterInput): Promise<User>;
    login(input: LoginInput): Promise<User>;
    logout(): Promise<void>;
    me(): Promise<User | null>;
    updateMe(input: UpdateMeInput): Promise<User>;
  };
  projects: {
    list(params?: { scope?: ProjectScope; archived?: boolean }): Promise<Project[]>;
    create(input: CreateProjectInput): Promise<Project>;
    get(id: string): Promise<ProjectDetail>;
    update(id: string, input: UpdateProjectInput): Promise<Project>;
    remove(id: string): Promise<void>;
    setArchived(id: string, archived: boolean): Promise<Project>;
    setFavorite(id: string, value: boolean): Promise<Project>;
  };
  subjects: {
    create(projectId: string, input: CreateSubjectInput): Promise<Subject>;
    update(id: string, input: UpdateSubjectInput): Promise<Subject>;
    remove(id: string): Promise<void>;
    clearCompleted(id: string): Promise<{ deleted: number }>;
  };
  tasks: {
    create(subjectId: string, input: CreateTaskInput): Promise<Task>;
    update(id: string, input: UpdateTaskInput): Promise<TaskMutationResult>;
    remove(id: string): Promise<void>;
    listArchived(): Promise<ArchivedTask[]>;
    listDueToday(): Promise<DueTask[]>;
  };
  members: {
    list(projectId: string): Promise<Member[]>;
    updateRole(projectId: string, userId: string, input: UpdateMemberRoleInput): Promise<Member>;
    remove(projectId: string, userId: string): Promise<void>;
  };
  invites: {
    list(): Promise<Invite[]>;
    listForProject(projectId: string): Promise<Invite[]>;
    create(projectId: string, input: CreateInviteInput): Promise<Invite>;
    revoke(id: string): Promise<void>;
    accept(id: string): Promise<void>;
    decline(id: string): Promise<void>;
    join(token: string): Promise<{ projectId: string }>;
  };
  streak: {
    get(): Promise<StreakSummary>;
  };
}
