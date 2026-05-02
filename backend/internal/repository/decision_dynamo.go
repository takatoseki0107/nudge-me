package repository

import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
	"github.com/takatoseki0107/nudge-me/backend/internal/model"
)

type DecisionRepository struct {
	db    *dynamodb.Client
	table string
}

func NewDecisionRepository(db *dynamodb.Client, table string) *DecisionRepository {
	return &DecisionRepository{db: db, table: table}
}

func (r *DecisionRepository) Create(ctx context.Context, d *model.Decision) error {
	d.ID = uuid.NewString()
	d.CreatedAt = time.Now().UTC()

	item, err := attributevalue.MarshalMap(d)
	if err != nil {
		return err
	}

	_, err = r.db.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.table),
		Item:      item,
	})
	return err
}

func (r *DecisionRepository) FindByUserID(ctx context.Context, userID string) ([]model.Decision, error) {
	out, err := r.db.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(r.table),
		IndexName:              aws.String("user_id-created_at-index"),
		KeyConditionExpression: aws.String("user_id = :uid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":uid": &types.AttributeValueMemberS{Value: userID},
		},
		ScanIndexForward: aws.Bool(false),
	})
	if err != nil {
		return nil, err
	}

	var decisions []model.Decision
	if err := attributevalue.UnmarshalListOfMaps(out.Items, &decisions); err != nil {
		return nil, err
	}
	return decisions, nil
}

func (r *DecisionRepository) FindByIDAndUserID(ctx context.Context, id, userID string) (*model.Decision, error) {
	out, err := r.db.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.table),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: id},
		},
	})
	if err != nil {
		return nil, err
	}
	if out.Item == nil {
		return nil, ErrNotFound
	}

	var d model.Decision
	if err := attributevalue.UnmarshalMap(out.Item, &d); err != nil {
		return nil, err
	}
	if d.UserID != userID {
		return nil, ErrNotFound
	}
	return &d, nil
}

func (r *DecisionRepository) UpdateRegret(ctx context.Context, id, userID string, regret bool) error {
	existing, err := r.FindByIDAndUserID(ctx, id, userID)
	if err != nil {
		return err
	}
	_ = existing

	_, err = r.db.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(r.table),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: id},
		},
		UpdateExpression: aws.String("SET regret = :r"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":r": &types.AttributeValueMemberBOOL{Value: regret},
		},
	})
	return err
}

func (r *DecisionRepository) CountByOption(ctx context.Context, question string, options []string) (map[string]int, error) {
	counts := make(map[string]int, len(options))
	for _, o := range options {
		counts[o] = 0
	}

	// Scan with filter — acceptable for stats endpoint (low-frequency call)
	out, err := r.db.Scan(ctx, &dynamodb.ScanInput{
		TableName:        aws.String(r.table),
		FilterExpression: aws.String("#q = :q"),
		ExpressionAttributeNames: map[string]string{
			"#q": "question",
		},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":q": &types.AttributeValueMemberS{Value: question},
		},
	})
	if err != nil {
		return nil, err
	}

	var decisions []model.Decision
	if err := attributevalue.UnmarshalListOfMaps(out.Items, &decisions); err != nil {
		return nil, err
	}
	for _, d := range decisions {
		if _, ok := counts[d.AIChoice]; ok {
			counts[d.AIChoice]++
		}
	}
	return counts, nil
}
