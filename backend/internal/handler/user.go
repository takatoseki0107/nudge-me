package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/takatoseki0107/nudge-me/backend/internal/repository"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler(userRepo *repository.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

func (h *UserHandler) GetMe(c echo.Context) error {
	userID := c.Get("userID").(uint)
	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}
	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateCharacter(c echo.Context) error {
	userID := c.Get("userID").(uint)

	var req struct {
		Character string `json:"character"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	allowed := map[string]bool{"sarcastic": true, "kind": true, "sporty": true}
	if !allowed[req.Character] {
		return echo.NewHTTPError(http.StatusBadRequest, "character must be sarcastic, kind, or sporty")
	}

	if err := h.userRepo.UpdateCharacter(userID, req.Character); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update character")
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch user")
	}
	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdatePersonality(c echo.Context) error {
	userID := c.Get("userID").(uint)

	var req struct {
		PersonalityType string `json:"personality_type"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	allowed := map[string]bool{"analytical": true, "spontaneous": true, "empathetic": true, "competitive": true}
	if !allowed[req.PersonalityType] {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid personality_type")
	}

	if err := h.userRepo.UpdatePersonality(userID, req.PersonalityType); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update personality")
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch user")
	}
	return c.JSON(http.StatusOK, user)
}
