import api from "./api";
import type { Decision, AICharacter } from "@/types";

export interface CreateDecisionParams {
  question: string;
  options: string[];
  character?: AICharacter;
}

export async function createDecision(params: CreateDecisionParams): Promise<Decision> {
  const res = await api.post<Decision>("/decisions", params);
  return res.data;
}

export async function createRandomDecision(params: Omit<CreateDecisionParams, "character">): Promise<Decision> {
  const res = await api.post<Decision>("/decisions/random", params);
  return res.data;
}

export async function getDecisions(): Promise<Decision[]> {
  const res = await api.get<Decision[]>("/decisions");
  return res.data;
}

export async function getDecision(id: number): Promise<Decision> {
  const res = await api.get<Decision>(`/decisions/${id}`);
  return res.data;
}

export async function updateRegret(id: number, regret: boolean): Promise<Decision> {
  const res = await api.patch<Decision>(`/decisions/${id}/regret`, { regret });
  return res.data;
}

export async function updateCharacter(character: AICharacter): Promise<void> {
  await api.patch("/users/me/character", { character });
}

export interface OptionStat {
  option: string;
  count: number;
  percent: number;
}

export interface OptionStatsResponse {
  total: number;
  stats: OptionStat[];
}

export async function getOptionStats(question: string, options: string[]): Promise<OptionStatsResponse> {
  const params = new URLSearchParams();
  params.append("question", question);
  options.forEach((o) => params.append("options[]", o));
  const res = await api.get<OptionStatsResponse>(`/stats/options?${params.toString()}`);
  return res.data;
}
