package main

import (
	"context"
	"log"
	"os"

	"github.com/akrylysov/algnhsa"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	dynamoclient "github.com/takatoseki0107/nudge-me/backend/internal/dynamodb"
	"github.com/takatoseki0107/nudge-me/backend/internal/handler"
	custommiddleware "github.com/takatoseki0107/nudge-me/backend/internal/middleware"
	"github.com/takatoseki0107/nudge-me/backend/internal/repository"
	"github.com/takatoseki0107/nudge-me/backend/internal/service"
)

func main() {
	ctx := context.Background()

	db, err := dynamoclient.NewClient(ctx)
	if err != nil {
		log.Fatalf("failed to create DynamoDB client: %v", err)
	}

	jwtSecret := mustEnv("JWT_SECRET")

	usersTable := mustEnv("DYNAMO_USERS_TABLE")
	decisionsTable := mustEnv("DYNAMO_DECISIONS_TABLE")
	personalityTable := mustEnv("DYNAMO_PERSONALITY_TABLE")

	userRepo := repository.NewUserRepository(db, usersTable)
	authSvc := service.NewAuthService(userRepo, jwtSecret)

	personalityRepo := repository.NewPersonalityRepository(db, personalityTable, usersTable)
	personalitySvc := service.NewPersonalityService(personalityRepo)
	if err := personalitySvc.SeedIfEmpty(ctx); err != nil {
		log.Fatalf("failed to seed personality questions: %v", err)
	}

	decisionRepo := repository.NewDecisionRepository(db, decisionsTable)
	decisionSvc := service.NewDecisionService(decisionRepo, userRepo, mustEnv("ANTHROPIC_API_KEY"))

	authHandler := handler.NewAuthHandler(authSvc)
	personalityHandler := handler.NewPersonalityHandler(personalitySvc)
	decisionHandler := handler.NewDecisionHandler(decisionSvc)
	userHandler := handler.NewUserHandler(userRepo)
	statsHandler := handler.NewStatsHandler(decisionRepo)

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{getEnv("FRONTEND_URL", "*")},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAuthorization},
		AllowMethods: []string{"GET", "POST", "PATCH", "DELETE"},
	}))

	api := e.Group("/api/v1")

	auth := api.Group("/auth")
	auth.POST("/register", authHandler.Register)
	auth.POST("/login", authHandler.Login)
	auth.POST("/logout", authHandler.Logout)

	protected := api.Group("")
	protected.Use(custommiddleware.JWTAuth(jwtSecret))

	personality := protected.Group("/personality")
	personality.GET("/questions", personalityHandler.GetQuestions)
	personality.POST("/result", personalityHandler.SaveResult)

	decisions := protected.Group("/decisions")
	decisions.POST("", decisionHandler.Create)
	decisions.POST("/random", decisionHandler.CreateRandom)
	decisions.GET("", decisionHandler.List)
	decisions.GET("/:id", decisionHandler.Get)
	decisions.PATCH("/:id/regret", decisionHandler.UpdateRegret)

	stats := protected.Group("/stats")
	stats.GET("/options", statsHandler.GetOptionStats)

	users := protected.Group("/users")
	users.GET("/me", userHandler.GetMe)
	users.PATCH("/me/character", userHandler.UpdateCharacter)
	users.PATCH("/me/personality", userHandler.UpdatePersonality)

	algnhsa.ListenAndServe(e, nil)
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required environment variable %s is not set", key)
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
