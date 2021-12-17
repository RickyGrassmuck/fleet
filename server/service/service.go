// Package service holds the implementation of the fleet interface and HTTP
// endpoints for the API
package service

import (
	"fmt"
	"html/template"
	"sync"

	"github.com/WatchBeam/clock"
	"github.com/fleetdm/fleet/v4/server/authz"
	"github.com/fleetdm/fleet/v4/server/config"
	"github.com/fleetdm/fleet/v4/server/fleet"
	"github.com/fleetdm/fleet/v4/server/logging"
	"github.com/fleetdm/fleet/v4/server/service/async"
	"github.com/fleetdm/fleet/v4/server/sso"
	kitlog "github.com/go-kit/kit/log"
)

// Service is the struct implementing fleet.Service. Create a new one with NewService.
type Service struct {
	ds             fleet.Datastore
	task           *async.Task
	carveStore     fleet.CarveStore
	resultStore    fleet.QueryResultStore
	liveQueryStore fleet.LiveQueryStore
	logger         kitlog.Logger
	config         config.FleetConfig
	clock          clock.Clock
	license        fleet.LicenseInfo

	osqueryLogWriter *logging.OsqueryLogger

	mailService     fleet.MailService
	ssoSessionStore sso.SessionStore

	seenHostSet *seenHostSet

	failingPolicySet FailingPolicySet

	authz *authz.Authorizer
}

// FailingPolicySet holds sets of hosts that failed policy executions.
type FailingPolicySet interface {
	// ListSets lists all the policy sets.
	ListSets() ([]uint, error)
	// AddHost adds the given host to the policy set.
	AddHost(policyID uint, host PolicySetHost) error
	// ListHosts returns the list of hosts present in the policy set.
	ListHosts(policyID uint) ([]PolicySetHost, error)
	// RemoveHosts removes the hosts from the policy set.
	// If after removal, the policy has no hosts then the set is removed.
	RemoveHosts(policyID uint, hosts []PolicySetHost) error
	// RemoveSet removes a policy set.
	RemoveSet(policyID uint) error
}

// PolicySetHost is a host entry for a policy set.
type PolicySetHost struct {
	// ID is the identifier of the host.
	ID uint
	// Hostname is the host's name.
	Hostname string
}

// NewService creates a new service from the config struct
func NewService(
	ds fleet.Datastore,
	task *async.Task,
	resultStore fleet.QueryResultStore,
	logger kitlog.Logger,
	osqueryLogger *logging.OsqueryLogger,
	config config.FleetConfig,
	mailService fleet.MailService,
	c clock.Clock,
	sso sso.SessionStore,
	lq fleet.LiveQueryStore,
	carveStore fleet.CarveStore,
	license fleet.LicenseInfo,
	failingPolicySet FailingPolicySet,
) (fleet.Service, error) {
	var svc fleet.Service

	authorizer, err := authz.NewAuthorizer()
	if err != nil {
		return nil, fmt.Errorf("new authorizer: %w", err)
	}

	svc = &Service{
		ds:               ds,
		task:             task,
		carveStore:       carveStore,
		resultStore:      resultStore,
		liveQueryStore:   lq,
		logger:           logger,
		config:           config,
		clock:            c,
		osqueryLogWriter: osqueryLogger,
		mailService:      mailService,
		ssoSessionStore:  sso,
		seenHostSet:      newSeenHostSet(),
		license:          license,
		failingPolicySet: failingPolicySet,
		authz:            authorizer,
	}
	svc = validationMiddleware{svc, ds, sso}
	return svc, nil
}

func (s Service) SendEmail(mail fleet.Email) error {
	return s.mailService.SendEmail(mail)
}

type validationMiddleware struct {
	fleet.Service
	ds              fleet.Datastore
	ssoSessionStore sso.SessionStore
}

// getAssetURL simply returns the base url used for retrieving image assets from fleetdm.com.
func getAssetURL() template.URL {
	return template.URL("https://fleetdm.com/images/permanent")
}

// seenHostSet implements synchronized storage for the set of seen hosts.
type seenHostSet struct {
	mutex   sync.Mutex
	hostIDs map[uint]bool
}

func newSeenHostSet() *seenHostSet {
	return &seenHostSet{
		mutex:   sync.Mutex{},
		hostIDs: make(map[uint]bool),
	}
}

// addHostID adds the host identified by ID to the set
func (m *seenHostSet) addHostID(id uint) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.hostIDs[id] = true
}

// getAndClearHostIDs gets the list of unique host IDs from the set and empties
// the set.
func (m *seenHostSet) getAndClearHostIDs() []uint {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	var ids []uint
	for id := range m.hostIDs {
		ids = append(ids, id)
	}
	m.hostIDs = make(map[uint]bool)
	return ids
}
