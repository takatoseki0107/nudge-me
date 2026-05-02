package repository

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
	"github.com/takatoseki0107/nudge-me/backend/internal/model"
)

const personalityQuestionsTable = "nudge-me-personality-questions"

type PersonalityRepository struct {
	db *dynamodb.Client
}

func NewPersonalityRepository(db *dynamodb.Client) *PersonalityRepository {
	return &PersonalityRepository{db: db}
}

func (r *PersonalityRepository) FindAllQuestions(ctx context.Context) ([]model.PersonalityQuestion, error) {
	out, err := r.db.Scan(ctx, &dynamodb.ScanInput{
		TableName: aws.String(personalityQuestionsTable),
	})
	if err != nil {
		return nil, err
	}

	var questions []model.PersonalityQuestion
	if err := attributevalue.UnmarshalListOfMaps(out.Items, &questions); err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *PersonalityRepository) CountQuestions(ctx context.Context) (int64, error) {
	out, err := r.db.DescribeTable(ctx, &dynamodb.DescribeTableInput{
		TableName: aws.String(personalityQuestionsTable),
	})
	if err != nil {
		return 0, err
	}
	return *out.Table.ItemCount, nil
}

func (r *PersonalityRepository) SeedQuestions(ctx context.Context, questions []model.PersonalityQuestion) error {
	for i := range questions {
		if questions[i].ID == "" {
			questions[i].ID = uuid.NewString()
		}
		item, err := attributevalue.MarshalMap(questions[i])
		if err != nil {
			return err
		}
		_, err = r.db.PutItem(ctx, &dynamodb.PutItemInput{
			TableName: aws.String(personalityQuestionsTable),
			Item:      item,
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *PersonalityRepository) UpdatePersonalityType(ctx context.Context, userID, personalityType string) error {
	_, err := r.db.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(usersTable),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: userID},
		},
		UpdateExpression: aws.String("SET personality_type = :p"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":p": &types.AttributeValueMemberS{Value: personalityType},
		},
	})
	return err
}
