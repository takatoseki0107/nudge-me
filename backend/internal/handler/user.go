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
	userID := c.Get("userID").(string)
	user, err := h.userRepo.FindByID(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}
	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateCharacter(c echo.Context) error {
	userID := c.Get("userID").(string)

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

	if err := h.userRepo.UpdateCharacter(c.Request().Context(), userID, req.Character); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update character")
	}

	user, err := h.userRepo.FindByID(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch user")
	}
	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdatePersonality(c echo.Context) error {
	userID := c.Get("userID").(string)

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

	if err := h.userRepo.UpdatePersonality(c.Request().Context(), userID, req.PersonalityType); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update personality")
	}

	user, err := h.userRepo.FindByID(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch user")
	}
	return c.JSON(http.StatusOK, user)
}
