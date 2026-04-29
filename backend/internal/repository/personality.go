package repository

import (
	"github.com/takatoseki0107/nudge-me/backend/internal/model"
	"gorm.io/gorm"
)

type PersonalityRepository struct {
	db *gorm.DB
}

func NewPersonalityRepository(db *gorm.DB) *PersonalityRepository {
	return &PersonalityRepository{db: db}
}

func (r *PersonalityRepository) FindAllQuestions() ([]model.PersonalityQuestion, error) {
	var questions []model.PersonalityQuestion
	if err := r.db.Order("id").Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *PersonalityRepository) CountQuestions() (int64, error) {
	var count int64
	return count, r.db.Model(&model.PersonalityQuestion{}).Count(&count).Error
}

func (r *PersonalityRepository) SeedQuestions(questions []model.PersonalityQuestion) error {
	return r.db.Create(&questions).Error
}

func (r *PersonalityRepository) UpdatePersonalityType(userID uint, personalityType string) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).
		Update("personality_type", personalityType).Error
}
