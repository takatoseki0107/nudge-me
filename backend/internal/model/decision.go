package model

import "time"

type Decision struct {
	ID        string    `json:"id" dynamodbav:"id"`
	UserID    string    `json:"user_id" dynamodbav:"user_id"`
	Question  string    `json:"question" dynamodbav:"question"`
	Options   []string  `json:"options" dynamodbav:"options"`
	AIChoice  string    `json:"ai_choice" dynamodbav:"ai_choice"`
	AIReason  string    `json:"ai_reason" dynamodbav:"ai_reason"`
	IsRandom  bool      `json:"is_random" dynamodbav:"is_random"`
	Regret    *bool     `json:"regret" dynamodbav:"regret"`
	CreatedAt time.Time `json:"created_at" dynamodbav:"created_at"`
}
