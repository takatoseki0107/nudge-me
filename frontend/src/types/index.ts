export type PersonalityType = "analytical" | "spontaneous" | "empathetic" | "competitive";
export type AICharacter = "sarcastic" | "kind" | "sporty";

export interface User {
  id: string;
  email: string;
  personality_type: PersonalityType | null;
  ai_character: AICharacter;
  created_at: string;
}

export interface Decision {
  id: string;
  user_id: string;
  question: string;
  options: string[];
  ai_choice: string;
  ai_reason: string;
  is_random: boolean;
  regret: boolean | null;
  created_at: string;
}

export interface PersonalityQuestion {
  id: string;
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
