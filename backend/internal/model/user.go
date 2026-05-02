package model

import "time"

type User struct {
	ID              string    `json:"id"`
	Email           string    `json:"email"`
	PasswordHash    string    `json:"-"`
	PersonalityType string    `json:"personality_type"`
	AICharacter     string    `json:"ai_character"`
	CreatedAt       time.Time `json:"created_at"`
}
