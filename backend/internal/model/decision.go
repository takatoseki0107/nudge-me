package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// JSONStringSlice stores []string as TEXT in SQLite
type JSONStringSlice []string

func (j JSONStringSlice) Value() (driver.Value, error) {
	b, err := json.Marshal(j)
	return string(b), err
}

func (j *JSONStringSlice) Scan(value interface{}) error {
	return json.Unmarshal([]byte(value.(string)), j)
}

type Decision struct {
	ID        uint            `gorm:"primaryKey" json:"id"`
	UserID    uint            `gorm:"not null;index" json:"user_id"`
	Question  string          `gorm:"not null" json:"question"`
	Options   JSONStringSlice `gorm:"type:text" json:"options"`
	AIChoice  string          `json:"ai_choice"`
	AIReason  string          `json:"ai_reason"`
	IsRandom  bool            `gorm:"default:false" json:"is_random"`
	Regret    *bool           `json:"regret"`
	CreatedAt time.Time       `json:"created_at"`
}
