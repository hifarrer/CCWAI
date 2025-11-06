export type CancerType = 
  | 'breast'
  | 'lung'
  | 'colorectal'
  | 'prostate'
  | 'pancreatic'
  | 'liver'
  | 'stomach'
  | 'esophageal'
  | 'bladder'
  | 'kidney'
  | 'cervical'
  | 'ovarian'
  | 'leukemia'
  | 'lymphoma'
  | 'melanoma'
  | 'brain'
  | 'other'

export type TreatmentType =
  | 'chemotherapy'
  | 'immunotherapy'
  | 'radiation'
  | 'surgery'
  | 'targeted-therapy'
  | 'hormone-therapy'
  | 'stem-cell-transplant'
  | 'other'

export type ExplanationLevel = 'layperson' | 'clinical'

export type Severity = 'common' | 'concerning' | 'emergency'

export interface PaperFilters {
  cancerType?: CancerType
  treatmentType?: TreatmentType
  days?: number
  limit?: number
  offset?: number
}

export type TrialStatus = 
  | 'RECRUITING'
  | 'NOT_YET_RECRUITING'
  | 'ENROLLING_BY_INVITATION'
  | 'ACTIVE_NOT_RECRUITING'
  | 'COMPLETED'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'WITHDRAWN'
  | 'UNKNOWN'

export interface TrialMatchCriteria {
  age?: number
  cancerType?: CancerType
  mutations?: string[]
  priorTreatments?: string[]
  zipCode?: string
  status?: TrialStatus[]
}

export interface DailyCheckInInput {
  date: string
  symptoms: Record<string, number>
  notes?: string
}

export interface ChatMessage {
  question: string
  explanationLevel: ExplanationLevel
  cancerType?: CancerType
}

