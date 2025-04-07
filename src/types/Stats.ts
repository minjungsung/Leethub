export interface Stats {
  version?: string
  branches?: any
  submission?: any
  problems?: {
    [key: string]: Problem
  }
}

export interface Problem {
  id: number
  title: string
  difficulty: string
  tags: string[]
}
