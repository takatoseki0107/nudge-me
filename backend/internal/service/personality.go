package service

import (
	"github.com/takatoseki0107/nudge-me/backend/internal/model"
	"github.com/takatoseki0107/nudge-me/backend/internal/repository"
)

// personalityTypes defines evaluation order; earlier index wins on tie.
var personalityTypes = []string{"analytical", "spontaneous", "empathetic", "competitive"}

type PersonalityService struct {
	repo *repository.PersonalityRepository
}

func NewPersonalityService(repo *repository.PersonalityRepository) *PersonalityService {
	return &PersonalityService{repo: repo}
}

func (s *PersonalityService) GetQuestions() ([]model.PersonalityQuestion, error) {
	return s.repo.FindAllQuestions()
}

// DetermineType tallies answers and returns the personality type with the most votes.
// On tie, the type that appears earlier in personalityTypes wins.
func (s *PersonalityService) DetermineType(answers []string) string {
	counts := make(map[string]int, len(personalityTypes))
	for _, a := range answers {
		counts[a]++
	}

	best := personalityTypes[0]
	for _, t := range personalityTypes[1:] {
		if counts[t] > counts[best] {
			best = t
		}
	}
	return best
}

func (s *PersonalityService) SaveResult(userID uint, answers []string) (string, error) {
	pt := s.DetermineType(answers)
	if err := s.repo.UpdatePersonalityType(userID, pt); err != nil {
		return "", err
	}
	return pt, nil
}

func (s *PersonalityService) SeedIfEmpty() error {
	count, err := s.repo.CountQuestions()
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	return s.repo.SeedQuestions(defaultQuestions())
}

func defaultQuestions() []model.PersonalityQuestion {
	return []model.PersonalityQuestion{
		{
			Question: "新しいレストランに行くとき、どちらを選びますか？",
			Options:  model.JSONStringSlice{"メニューをしっかり調べてから決める（analytical）", "その場の気分で直感的に決める（spontaneous）"},
		},
		{
			Question: "友人が悩んでいるとき、あなたはどうしますか？",
			Options:  model.JSONStringSlice{"一緒に解決策を考える（analytical）", "まず気持ちに寄り添って話を聞く（empathetic）"},
		},
		{
			Question: "休日の過ごし方として近いのはどちらですか？",
			Options:  model.JSONStringSlice{"予定を立てて効率よく動く（analytical）", "思いつきで行動する（spontaneous）"},
		},
		{
			Question: "チームでプロジェクトに取り組むとき、あなたの役割は？",
			Options:  model.JSONStringSlice{"全体をまとめてリードする（competitive）", "メンバーのサポートに回る（empathetic）"},
		},
		{
			Question: "買い物をするとき、どちらに近いですか？",
			Options:  model.JSONStringSlice{"比較・検討してから購入する（analytical）", "気に入ったらすぐ買う（spontaneous）"},
		},
		{
			Question: "目標に向かうとき、どちらのタイプですか？",
			Options:  model.JSONStringSlice{"結果にこだわって最善を尽くす（competitive）", "プロセスを楽しみながら進む（empathetic）"},
		},
	}
}
