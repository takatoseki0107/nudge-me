package model

type PersonalityQuestion struct {
	ID       uint            `gorm:"primaryKey" json:"id"`
	Question string          `gorm:"not null" json:"question"`
	Options  JSONStringSlice `gorm:"type:text" json:"options"`
}
