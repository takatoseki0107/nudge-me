package repository

import (
	"github.com/takatoseki0107/nudge-me/backend/internal/model"
	"gorm.io/gorm"
)

type DecisionRepository struct {
	db *gorm.DB
}

func NewDecisionRepository(db *gorm.DB) *DecisionRepository {
	return &DecisionRepository{db: db}
}

func (r *DecisionRepository) Create(d *model.Decision) error {
	return r.db.Create(d).Error
}

func (r *DecisionRepository) FindByUserID(userID uint) ([]model.Decision, error) {
	var decisions []model.Decision
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&decisions).Error
	return decisions, err
}

func (r *DecisionRepository) FindByIDAndUserID(id, userID uint) (*model.Decision, error) {
	var d model.Decision
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&d).Error
	if err != nil {
		return nil, err
	}
	return &d, nil
}
