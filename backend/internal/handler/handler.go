package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// DecisionHandler handles decision endpoints
type DecisionHandler struct{}

func NewDecisionHandler() *DecisionHandler { return &DecisionHandler{} }

func (h *DecisionHandler) Create(c echo.Context) error {
	return c.JSON(http.StatusNotImplemented, map[string]string{"message": "not implemented"})
}

func (h *DecisionHandler) CreateRandom(c echo.Context) error {
	return c.JSON(http.StatusNotImplemented, map[string]string{"message": "not implemented"})
}

func (h *DecisionHandler) List(c echo.Context) error {
	return c.JSON(http.StatusNotImplemented, map[string]string{"message": "not implemented"})
}

func (h *DecisionHandler) Get(c echo.Context) error {
	return c.JSON(http.StatusNotImplemented, map[string]string{"message": "not implemented"})
}

func (h *DecisionHandler) UpdateRegret(c echo.Context) error {
	return c.JSON(http.StatusNotImplemented, map[string]string{"message": "not implemented"})
}

// StatsHandler handles statistics endpoints
type StatsHandler struct{}

func NewStatsHandler() *StatsHandler { return &StatsHandler{} }

func (h *StatsHandler) GetOptionStats(c echo.Context) error {
	return c.JSON(http.StatusNotImplemented, map[string]string{"message": "not implemented"})
}
