package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/takatoseki0107/nudge-me/backend/internal/repository"
)

type StatsHandler struct {
	decisionRepo *repository.DecisionRepository
}

func NewStatsHandler(decisionRepo *repository.DecisionRepository) *StatsHandler {
	return &StatsHandler{decisionRepo: decisionRepo}
}

type optionStat struct {
	Option  string  `json:"option"`
	Count   int     `json:"count"`
	Percent float64 `json:"percent"`
}

func (h *StatsHandler) GetOptionStats(c echo.Context) error {
	question := c.QueryParam("question")
	if question == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "question is required")
	}
	options := c.QueryParams()["options[]"]
	if len(options) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "options[] is required")
	}

	counts, err := h.decisionRepo.CountByOption(c.Request().Context(), question, options)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch stats")
	}

	total := 0
	for _, cnt := range counts {
		total += cnt
	}

	stats := make([]optionStat, 0, len(options))
	for _, opt := range options {
		cnt := counts[opt]
		pct := 0.0
		if total > 0 {
			pct = float64(cnt) / float64(total) * 100
		}
		stats = append(stats, optionStat{Option: opt, Count: cnt, Percent: pct})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"total": total,
		"stats": stats,
	})
}
