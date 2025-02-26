package fleet

import (
	"encoding/json"
	"time"
)

type StatisticsPayload struct {
	AnonymousIdentifier            string                             `json:"anonymousIdentifier"`
	FleetVersion                   string                             `json:"fleetVersion"`
	LicenseTier                    string                             `json:"licenseTier"`
	NumHostsEnrolled               int                                `json:"numHostsEnrolled"`
	NumUsers                       int                                `json:"numUsers"`
	NumTeams                       int                                `json:"numTeams"`
	NumPolicies                    int                                `json:"numPolicies"`
	NumLabels                      int                                `json:"numLabels"`
	SoftwareInventoryEnabled       bool                               `json:"softwareInventoryEnabled"`
	VulnDetectionEnabled           bool                               `json:"vulnDetectionEnabled"`
	SystemUsersEnabled             bool                               `json:"systemUsersEnabled"`
	HostsStatusWebHookEnabled      bool                               `json:"hostsStatusWebHookEnabled"`
	NumWeeklyActiveUsers           int                                `json:"numWeeklyActiveUsers"`
	HostsEnrolledByOperatingSystem map[string][]HostsCountByOSVersion `json:"hostsEnrolledByOperatingSystem"`
	StoredErrors                   json.RawMessage                    `json:"storedErrors"`
}

type HostsCountByOSVersion struct {
	Version     string `json:"version"`
	NumEnrolled int    `json:"numEnrolled"`
}

const (
	StatisticsFrequency = time.Hour * 24 * 7
)
