package model

import "time"

type User struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Email           string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash    string    `gorm:"not null" json:"-"`
	PersonalityType string    `json:"personality_type"`
	AICharacter     string    `gorm:"default:'kind'" json:"ai_character"`
	CreatedAt       time.Time `json:"created_at"`
}
