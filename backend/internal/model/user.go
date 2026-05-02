package model

import "time"

type User struct {
	ID              string    `json:"id" dynamodbav:"id"`
	Email           string    `json:"email" dynamodbav:"email"`
	PasswordHash    string    `json:"-" dynamodbav:"password_hash"`
	PersonalityType string    `json:"personality_type" dynamodbav:"personality_type"`
	AICharacter     string    `json:"ai_character" dynamodbav:"ai_character"`
	CreatedAt       time.Time `json:"created_at" dynamodbav:"created_at"`
}
