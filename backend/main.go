package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/takatoseki0107/nudge-me/backend/internal/handler"
	custommiddleware "github.com/takatoseki0107/nudge-me/backend/internal/middleware"
	"github.com/takatoseki0107/nudge-me/backend/internal/model"
	"github.com/takatoseki0107/nudge-me/backend/internal/repository"
	"github.com/takatoseki0107/nudge-me/backend/internal/service"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	db, err := gorm.Open(sqlite.Open(getEnv("DB_PATH", "./nudge.db")), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get sql.DB: %v", err)
	}
	// Prevent SQLite write concurrency issues
	sqlDB.SetMaxOpenConns(1)

	if err := db.AutoMigrate(
		&model.User{},
		&model.Decision{},
		&model.PersonalityQuestion{},
	); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}

	anthropicKey := getEnv("ANTHROPIC_API_KEY", "")
	if anthropicKey == "" {
		log.Fatal("ANTHROPIC_API_KEY is not set")
	}
	log.Printf("ANTHROPIC_API_KEY loaded: length=%d", len(anthropicKey))

	jwtSecret := getEnv("JWT_SECRET", "change-me")

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo, jwtSecret)

	personalityRepo := repository.NewPersonalityRepository(db)
	personalitySvc := service.NewPersonalityService(personalityRepo)
	if err := personalitySvc.SeedIfEmpty(); err != nil {
		log.Fatalf("failed to seed personality questions: %v", err)
	}

	decisionRepo := repository.NewDecisionRepository(db)
	decisionSvc := service.NewDecisionService(decisionRepo, userRepo, anthropicKey)

	authHandler := handler.NewAuthHandler(authService)
	personalityHandler := handler.NewPersonalityHandler(personalitySvc)
	decisionHandler := handler.NewDecisionHandler(decisionSvc)
	userHandler := handler.NewUserHandler(userRepo)
	statsHandler := handler.NewStatsHandler()

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{getEnv("FRONTEND_URL", "http://localhost:3000")},
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

	e.Logger.Fatal(e.Start(":" + getEnv("PORT", "8080")))
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
