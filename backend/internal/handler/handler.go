package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// StatsHandler handles statistics endpoints
type StatsHandler struct{}

func NewStatsHandler() *StatsHandler { return &StatsHandler{} }

func (h *StatsHandler) GetOptionStats(c echo.Context) error {
	return c.JSON(http.StatusNotImplemented, map[string]string{"message": "not implemented"})
}
