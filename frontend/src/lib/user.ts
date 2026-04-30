import api from "./api";
import type { User, PersonalityType } from "@/types";

export async function getMe(): Promise<User> {
  const res = await api.get<User>("/users/me");
  return res.data;
}

export async function updatePersonality(personalityType: PersonalityType): Promise<User> {
  const res = await api.patch<User>("/users/me/personality", { personality_type: personalityType });
  return res.data;
}
