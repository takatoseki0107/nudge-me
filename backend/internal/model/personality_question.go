package model

type PersonalityQuestion struct {
	ID       string   `json:"id" dynamodbav:"id"`
	Question string   `json:"question" dynamodbav:"question"`
	Options  []string `json:"options" dynamodbav:"options"`
}
