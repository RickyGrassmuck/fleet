package service

import (
	"database/sql"
	"encoding/json"
	"errors"
	"io"
)

var (
	ErrUnauthenticated = errors.New("unauthenticated, or invalid token")
	ErrMissingLicense  = errors.New("missing or invalid license")
)

type SetupAlreadyErr interface {
	SetupAlready() bool
	Error() string
}

type setupAlreadyErr struct{}

func (e setupAlreadyErr) Error() string {
	return "Fleet has already been setup"
}

func (e setupAlreadyErr) SetupAlready() bool {
	return true
}

type NotSetupErr interface {
	NotSetup() bool
	Error() string
}

type notSetupErr struct{}

func (e notSetupErr) Error() string {
	return "The Fleet instance is not set up yet"
}

func (e notSetupErr) NotSetup() bool {
	return true
}

type NotFoundErr interface {
	NotFound() bool
	Error() string
}

type notFoundErr struct{}

func (e notFoundErr) Error() string {
	return "The resource was not found"
}

func (e notFoundErr) NotFound() bool {
	return true
}

// Implement Is so that errors.Is(err, sql.ErrNoRows) returns true for an
// error of type *notFoundError, without having to wrap sql.ErrNoRows
// explicitly.
func (e notFoundErr) Is(other error) bool {
	return other == sql.ErrNoRows
}

type serverError struct {
	Message string `json:"message"`
	Errors  []struct {
		Name   string `json:"name"`
		Reason string `json:"reason"`
	} `json:"errors"`
}

func extractServerErrorText(body io.Reader) string {
	var serverErr serverError
	if err := json.NewDecoder(body).Decode(&serverErr); err != nil {
		return "unknown"
	}

	errText := serverErr.Message
	if len(serverErr.Errors) > 0 {
		errText += ": " + serverErr.Errors[0].Reason
	}

	return errText
}
