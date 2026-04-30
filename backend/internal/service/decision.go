package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"github.com/takatoseki0107/nudge-me/backend/internal/model"
	"github.com/takatoseki0107/nudge-me/backend/internal/repository"
)

type DecisionService struct {
	repo      *repository.DecisionRepository
	userRepo  *repository.UserRepository
	anthropic *anthropic.Client
}

func NewDecisionService(
	repo *repository.DecisionRepository,
	userRepo *repository.UserRepository,
	apiKey string,
) *DecisionService {
	client := anthropic.NewClient(option.WithAPIKey(apiKey))
	return &DecisionService{repo: repo, userRepo: userRepo, anthropic: &client}
}

type aiResponse struct {
	Choice string `json:"choice"`
	Reason string `json:"reason"`
}

func (s *DecisionService) Create(userID uint, question string, options []string, character string) (*model.Decision, error) {
	if len(options) < 2 {
		return nil, errors.New("at least 2 options are required")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	char := character
	if char == "" {
		char = user.AICharacter
	}

	choice, reason, err := s.callClaude(question, options, char, user.PersonalityType)
	if err != nil {
		return nil, err
	}

	d := &model.Decision{
		UserID:   userID,
		Question: question,
		Options:  model.JSONStringSlice(options),
		AIChoice: choice,
		AIReason: reason,
		IsRandom: false,
	}
	if err := s.repo.Create(d); err != nil {
		return nil, err
	}
	return d, nil
}

func (s *DecisionService) CreateRandom(userID uint, question string, options []string) (*model.Decision, error) {
	if len(options) < 2 {
		return nil, errors.New("at least 2 options are required")
	}

	choice := options[rand.Intn(len(options))]
	d := &model.Decision{
		UserID:   userID,
		Question: question,
		Options:  model.JSONStringSlice(options),
		AIChoice: choice,
		AIReason: "運任せで決めました！",
		IsRandom: true,
	}
	if err := s.repo.Create(d); err != nil {
		return nil, err
	}
	return d, nil
}

func (s *DecisionService) List(userID uint) ([]model.Decision, error) {
	return s.repo.FindByUserID(userID)
}

func (s *DecisionService) Get(id, userID uint) (*model.Decision, error) {
	return s.repo.FindByIDAndUserID(id, userID)
}

func (s *DecisionService) UpdateRegret(id, userID uint, regret bool) (*model.Decision, error) {
	if err := s.repo.UpdateRegret(id, userID, regret); err != nil {
		return nil, err
	}
	return s.repo.FindByIDAndUserID(id, userID)
}

func (s *DecisionService) callClaude(question string, options []string, character, personalityType string) (string, string, error) {
	systemPrompt := buildSystemPrompt(character, personalityType)
	userMsg := buildUserMessage(question, options)

	msg, err := s.anthropic.Messages.New(context.Background(), anthropic.MessageNewParams{
		Model:     anthropic.ModelClaudeHaiku4_5,
		MaxTokens: 512,
		System: []anthropic.TextBlockParam{
			{Text: systemPrompt},
		},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(userMsg)),
		},
	})
	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "credit balance is too low") {
			return "", "", fmt.Errorf("api_credit_exhausted: %w", err)
		}
		return "", "", fmt.Errorf("claude api error: %w", err)
	}

	raw := msg.Content[0].Text
	raw = strings.TrimSpace(raw)
	// strip markdown code fences if present
	raw = strings.TrimPrefix(raw, "```json")
	raw = strings.TrimPrefix(raw, "```")
	raw = strings.TrimSuffix(raw, "```")
	raw = strings.TrimSpace(raw)

	var res aiResponse
	if err := json.Unmarshal([]byte(raw), &res); err != nil {
		return "", "", fmt.Errorf("failed to parse claude response: %w", err)
	}
	return res.Choice, res.Reason, nil
}

func buildSystemPrompt(character, personalityType string) string {
	var style string
	switch character {
	case "sarcastic":
		style = "あなたは毒舌キャラクターです。ズバッと核心をついて、遠慮なく背中を押してください。ただし最終的には相手のためになるアドバイスをしてください。"
	case "sporty":
		style = "あなたは体育会系キャラクターです。熱血で前向き、「やってみろ！」という勢いで背中を押してください。テンションは高めで励ましてください。"
	default:
		style = "あなたは優しいキャラクターです。温かく寄り添い、相手の気持ちに共感しながら丁寧にアドバイスしてください。"
	}

	var personalityNote string
	switch personalityType {
	case "analytical":
		personalityNote = "ユーザーは分析タイプです。論理的な根拠を重視します。"
	case "spontaneous":
		personalityNote = "ユーザーは直感タイプです。直感的でシンプルなアドバイスを好みます。"
	case "empathetic":
		personalityNote = "ユーザーは共感タイプです。感情面への配慮を重視します。"
	case "competitive":
		personalityNote = "ユーザーは競争タイプです。結果・成長につながる選択を重視します。"
	}

	return fmt.Sprintf(`%s
%s
必ず以下のJSON形式のみで回答してください。余分な文章は一切含めないでください。
{"choice": "選んだ選択肢のテキスト（入力された選択肢の文言をそのまま使う）", "reason": "その選択肢を選んだ理由（200文字以内、キャラクターの口調で）"}`, style, personalityNote)
}

func buildUserMessage(question string, options []string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("悩み: %s\n選択肢:\n", question))
	for i, o := range options {
		sb.WriteString(fmt.Sprintf("%d. %s\n", i+1, o))
	}
	return sb.String()
}
