import api from "./api";
import type { User } from "@/types";

export async function getMe(): Promise<User> {
  const res = await api.get<User>("/users/me");
  return res.data;
}
