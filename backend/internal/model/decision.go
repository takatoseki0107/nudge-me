package model

import "time"

type Decision struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Question  string    `json:"question"`
	Options   []string  `json:"options"`
	AIChoice  string    `json:"ai_choice"`
	AIReason  string    `json:"ai_reason"`
	IsRandom  bool      `json:"is_random"`
	Regret    *bool     `json:"regret"`
	CreatedAt time.Time `json:"created_at"`
}
