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

func (r *DecisionRepository) UpdateRegret(id, userID uint, regret bool) error {
	result := r.db.Model(&model.Decision{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("regret", regret)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *DecisionRepository) CountByOption(question string, options []string) (map[string]int, error) {
	type row struct {
		AIChoice string
		Count    int
	}
	var rows []row
	err := r.db.Model(&model.Decision{}).
		Select("ai_choice, count(*) as count").
		Where("question = ? AND ai_choice IN ?", question, options).
		Group("ai_choice").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	counts := make(map[string]int, len(options))
	for _, o := range options {
		counts[o] = 0
	}
	for _, row := range rows {
		counts[row.AIChoice] = row.Count
	}
	return counts, nil
}
