export interface ProblemStats {
  title: string
  difficulty: string
  language: string
  runtime: string
  memory: string
  submissionId: string
}
export interface Stats {
  version: string
  problems: Record<string, ProblemStats>
}
