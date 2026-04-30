package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/takatoseki0107/nudge-me/backend/internal/service"
)

type DecisionHandler struct {
	svc *service.DecisionService
}

func NewDecisionHandler(svc *service.DecisionService) *DecisionHandler {
	return &DecisionHandler{svc: svc}
}

type createDecisionRequest struct {
	Question  string   `json:"question"`
	Options   []string `json:"options"`
	Character string   `json:"character"`
}

func (h *DecisionHandler) Create(c echo.Context) error {
	userID := c.Get("userID").(uint)

	var req createDecisionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Question == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "question is required")
	}
	if len(req.Options) < 2 {
		return echo.NewHTTPError(http.StatusBadRequest, "at least 2 options are required")
	}

	decision, err := h.svc.Create(userID, req.Question, req.Options, req.Character)
	if err != nil {
		log.Printf("ERROR Create decision: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create decision")
	}
	return c.JSON(http.StatusCreated, decision)
}

func (h *DecisionHandler) CreateRandom(c echo.Context) error {
	userID := c.Get("userID").(uint)

	var req createDecisionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Question == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "question is required")
	}
	if len(req.Options) < 2 {
		return echo.NewHTTPError(http.StatusBadRequest, "at least 2 options are required")
	}

	decision, err := h.svc.CreateRandom(userID, req.Question, req.Options)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create random decision")
	}
	return c.JSON(http.StatusCreated, decision)
}

func (h *DecisionHandler) List(c echo.Context) error {
	userID := c.Get("userID").(uint)
	decisions, err := h.svc.List(userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch decisions")
	}
	return c.JSON(http.StatusOK, decisions)
}

func (h *DecisionHandler) Get(c echo.Context) error {
	userID := c.Get("userID").(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	decision, err := h.svc.Get(uint(id), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "decision not found")
	}
	return c.JSON(http.StatusOK, decision)
}

type updateRegretRequest struct {
	Regret bool `json:"regret"`
}

func (h *DecisionHandler) UpdateRegret(c echo.Context) error {
	userID := c.Get("userID").(uint)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	var req updateRegretRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	decision, err := h.svc.UpdateRegret(uint(id), userID, req.Regret)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "decision not found")
	}
	return c.JSON(http.StatusOK, decision)
}
