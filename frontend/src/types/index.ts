export type PersonalityType = "analytical" | "spontaneous" | "empathetic" | "competitive";
export type AICharacter = "harsh" | "kind" | "sporty";

export interface User {
  id: number;
  email: string;
  personality_type: PersonalityType | null;
  ai_character: AICharacter;
  created_at: string;
}

export interface Decision {
  id: number;
  user_id: number;
  question: string;
  options: string[];
  ai_choice: string;
  ai_reason: string;
  is_random: boolean;
  regret: boolean | null;
  created_at: string;
}

export interface PersonalityQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DecisionRequest {
  question: string;
  options: string[];
  character?: AICharacter;
}

export interface DecisionResponse {
  decision: Decision;
}
