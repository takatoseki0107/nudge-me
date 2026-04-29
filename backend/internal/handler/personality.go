package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/takatoseki0107/nudge-me/backend/internal/service"
)

type PersonalityHandler struct {
	svc *service.PersonalityService
}

func NewPersonalityHandler(svc *service.PersonalityService) *PersonalityHandler {
	return &PersonalityHandler{svc: svc}
}

func (h *PersonalityHandler) GetQuestions(c echo.Context) error {
	questions, err := h.svc.GetQuestions()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch questions")
	}
	return c.JSON(http.StatusOK, questions)
}

type saveResultRequest struct {
	Answers []string `json:"answers"`
}

func (h *PersonalityHandler) SaveResult(c echo.Context) error {
	userID := c.Get("userID").(uint)

	var req saveResultRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if len(req.Answers) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "answers are required")
	}

	pt, err := h.svc.SaveResult(userID, req.Answers)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to save result")
	}

	return c.JSON(http.StatusOK, map[string]string{"personality_type": pt})
}
