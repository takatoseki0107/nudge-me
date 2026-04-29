import api from "./api";
import type { PersonalityQuestion, PersonalityType } from "@/types";

export async function getQuestions(): Promise<PersonalityQuestion[]> {
  const res = await api.get<PersonalityQuestion[]>("/personality/questions");
  return res.data;
}

export async function saveResult(
  answers: PersonalityType[]
): Promise<{ personality_type: PersonalityType }> {
  const res = await api.post<{ personality_type: PersonalityType }>(
    "/personality/result",
    { answers }
  );
  return res.data;
}
