export type CompetitionStatus = 'draft' | 'live' | 'completed'

export interface Competition {
  id: string
  code: string
  title: string
  description: string | null
  status: CompetitionStatus
  host_id: string
  starts_at: string | null
  created_at: string
}

export interface Participant {
  id: string
  display_name: string
  score: number
  joined_at: string
}
