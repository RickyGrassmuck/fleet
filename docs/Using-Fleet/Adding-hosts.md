# Adding hosts
- [Osquery installer](#osquery-installer)
- [Signing installers](#signing-installers)
- [Plain osquery](#plain-osquery)

The recommended way to add your host to Fleet is with an osquery installer. Fleet provides the tools to generate an osquery installer with the `fleetctl package` command.

To use the `fleetctl package` command, you must first install the `fleetctl` command-line tool. Instructions for installing `fleetctl` can be found on [here](https://fleetdm.com/get-started)

## Osquery installer

To create an osquery installer, you can use the `fleetctl package` command.

`fleetctl package` can be used to create an osquery installer which adds macOS hosts (**.pkg**), Windows hosts (**.msi**), or Linux hosts (**.deb** or **.rpm**) to Fleet.

The following command creates an osquery installer, `.pkg` file, which adds macOS hosts to Fleet. This osquery installer is located in the folder where the `fleetctl package` command is run.

```sh
fleetctl package --type pkg --fleet-url=[YOUR FLEET URL] --enroll-secret=[YOUR ENROLLMENT SECRET]
```
  >**Note:** The only configuration option required to create an installer is `--type`, but to communicate with a Fleet instance you'll need to specify a `--fleet-url` and `--enroll-secret`

When you install the generated osquery installer on a host, this host will be automatically enrolled in the specified Fleet instance.

### Signing installers

  >**Note:** Currently, the fleetctl package command does not provide support for signing Windows osquery installers. Windows installers can be signed after building.

The `fleetctl package` command provides support for signing and notarizing macOS osquery installers via the
`--sign-identity` and `--notarize` flags.
Check out the example below:

```sh
  AC_USERNAME=appleid@example.com AC_PASSWORD=app-specific-password fleetctl package --type pkg --sign-identity=[PATH TO SIGN IDENTITY] --notarize --fleet-url=[YOUR FLEET URL] --enroll-secret=[YOUR ENROLLMENT SECRET]
```

The above command should be run on a macOS device as notarizing and signing of macOS osquery installers can only be done on macOS devices.

Also remember to replace both `AC_USERNAME` and `AC_PASSWORD` environment variables with your Apple ID and a valid [app-specific](https://support.apple.com/en-ca/HT204397) password respectively.

### Fleet Desktop

> Fleet Desktop requires a Fleet version of 4.12.0 and above. To check your Fleet version, select
> the avatar on the right side of the top bar and select **My account**. Your Fleet version is
> displayed below the **Get API token** button.

How to install Fleet Desktop on your hosts:
1. On the top bar in the Fleet UI, select **Hosts > Add hosts**.
2. Select the **Include Fleet Desktop** checkbox.
3. Select the clipboard icon to copy the `fleetctl package` command.
4. In your terminal application, paste and run the copied command.

When you install the generated osquery installer on a host, Fleet Desktop will be installed on this
host and the Fleet icon will appear on the host's menu bar.

Read more about the Self-service and Scope transparency features included with Fleet Desktop in [the
4.15.0 release article](https://fleetdm.com/releases/fleet-4.15.0).

Fleet Desktop is supported on macOS, Windows, and Linux. Check out the supported Linux distributions
and versions [here
on GitHub](https://github.com/fleetdm/fleet/issues/5684#issuecomment-1123906753). 

Fleet Desktop is currently in beta. Check out the remaining work to bring Fleet Desktop out of beta [here on GitHub](https://github.com/fleetdm/fleet/issues/5684).

### Adding multiple hosts

If you're managing an enterprise environment with multiple hosts, you likely have an enterprise deployment tool like [Munki](https://www.munki.org/munki/), [Jamf Pro](https://www.jamf.com/products/jamf-pro/), [Chef](https://www.chef.io/), [Ansible](https://www.ansible.com/), or [Puppet](https://puppet.com/) to deliver software to your hosts.

You can distribute your osquery installer and add all your hosts to Fleet using your software management tool of choice.

### Automatically adding hosts to a team

`Applies only to Fleet Premium`

```
ℹ️  In Fleet 4.0, Teams were introduced.
```

The teams feature in Fleet allows you to place hosts in exclusive groups. With hosts segmented into teams, you can apply unique queries and give users access to only the hosts in specific teams.

You can add a host to a team by generating and using a unique osquery installer for a team or by [manually transferring a host to a team in the Fleet UI](../Using-Fleet/Teams.md#transfer-hosts-to-a-team).

To generate an osquery installer for a team:

1. First, create a team in Fleet by selecting "Create team" in **Settings > Teams**.
2. Then, navigate to **Hosts** and select your team.
3. Next, select "Add hosts" and copy the `fleetctl package` command for the platform (macOS, Windows, Linux) of the hosts you'd like to add to a team in Fleet.
4. Run the copied `fleetctl package` command and [distribute your installer](#adding-multiple-hosts) to add your hosts to a team in Fleet.

### Configuration options

The following command-line flags allow you to further configure an osquery installer to communicate with a specific Fleet instance.

|Flag | Options|
|------|--------|
|  --type |  **Required** - Type of package to build.<br> Options: `pkg`(macOS),`msi`(Windows), `deb`(Debian based Linux), `rpm`(RHEL, CentOS, etc.)|
|--fleet-desktop |      Include Fleet Desktop. Fleet Desktop is currently in beta. |
|--enroll-secret |      Enroll secret for authenticating to Fleet server |
|--fleet-url |          URL (`host:port`) of Fleet server |
|--fleet-certificate |  Path to server certificate bundle |
|--identifier |         Identifier for package product (default: `com.fleetdm.orbit`) |
|--version |            Version for package product (default: `0.0.3`) |
| --insecure  |             Disable TLS certificate verification (default: `false`) |
| --service   |             Install osquery with a persistence service (launchd, systemd, etc.) (default: `true`) |
|--sign-identity |      Identity to use for macOS codesigning |
| --notarize |             Whether to notarize macOS packages (default: `false`) |
|--osqueryd-channel |   Update channel of osqueryd to use (default: `stable`) |
|--orbit-channel |      Update channel of Orbit to use (default: `stable`) |
|--update-url |         URL for update server (default: `https://tuf.fleetctl.com`) |
|--update-roots |       Root key JSON metadata for update server (from fleetctl updates roots) |
| --debug     |             Enable debug logging (default: `false`) |
| --verbose   |             Log detailed information when building the package (default: false) |
| --help, -h    |             show help (default: `false`) |


Fleet supports other methods for adding your hosts to Fleet, such as the [plain osquery binaries](#plain-osquery) or [Kolide Osquery Launcher](https://github.com/kolide/launcher/blob/master/docs/launcher.md#connecting-to-fleet).

## Plain osquery

> If you'd like to use the native osqueryd binaries to connect to Fleet, this is enabled by using osquery's TLS API plugins that are principally documented on the official osquery wiki: http://osquery.readthedocs.io/en/stable/deployment/remote/. These plugins are very customizable and thus have a large configuration surface. Configuring osqueryd to communicate with Fleet is documented below in the "Native Osquery TLS Plugins" section.

You can find various ways to install osquery on a variety of platforms at https://osquery.io/downloads. Once you have installed osquery, you need to do two things:

### Set an environment variable with an enroll secret

The enroll secret is a value that osquery provides to authenticate with Fleet. There are a few ways you can set the enroll secret on the hosts which you control. You can either set the value as:

- an value of an environment variable (a common name is `OSQUERY_ENROLL_SECRET`)
- the content of a local file (a common path is `/etc/osquery/enroll_secret`)

The value of the environment variable or content of the file should be a secret shared between the osqueryd client and the Fleet server. This is osqueryd's passphrase which it uses to authenticate with Fleet, convincing Fleet that it is actually one of your hosts. The passphrase could be whatever you'd like, but it would be prudent to have the passphrase long, complex, mixed-case, etc. When you launch the Fleet server, you should specify this same value.

If you use an environment variable for this, you can specify it with the `--enroll_secret_env` flag when you launch osqueryd. If you use a local file for this, you can specify it's path with the `--enroll_secret_path` flag.

To retrieve the enroll secret, use the "Add New Host" dialog in the Fleet UI or
`fleetctl get enroll_secret`).

If your organization has a robust internal public key infrastructure (PKI) and you already deploy TLS client certificates to each host to uniquely identify them, then osquery supports an advanced authentication mechanism which takes advantage of this. Fleet can be fronted with a proxy that will perform the TLS client authentication.

### Deploy the TLS certificate that osquery will use to communicate with Fleet

When Fleet uses a self-signed certificate, osquery agents will need a copy of that certificate in order to authenticate the Fleet server. If clients connect directly to the Fleet server, you can download the certificate through the Fleet UI. From the main dashboard (`/hosts/manage`), click "Add New Host" and "Fetch Certificate". If Fleet is running behind a load-balancer that terminates TLS, you will have to talk to your system administrator about where to find this certificate.

It is important that the CN of this certificate matches the hostname or IP that osqueryd clients will use to connect.

Specify the path to this certificate with the `--tls_server_certs` flag when you launch osqueryd.

### Launching osqueryd

Assuming that you are deploying your enroll secret in the file `/etc/osquery/enroll_secret` and your osquery server certificate is at `/etc/osquery/fleet.crt`, you could copy and paste the following command with the following flags (be sure to replace `fleet.acme.net` with the hostname or IP of your Fleet installation):

```
sudo osqueryd \
 --enroll_secret_path=/etc/osquery/enroll_secret \
 --tls_server_certs=/etc/osquery/fleet.crt \
 --tls_hostname=fleet.example.com \
 --host_identifier=uuid \
 --enroll_tls_endpoint=/api/osquery/enroll \
 --config_plugin=tls \
 --config_tls_endpoint=/api/osquery/config \
 --config_refresh=10 \
 --disable_distributed=false \
 --distributed_plugin=tls \
 --distributed_interval=10 \
 --distributed_tls_max_attempts=3 \
 --distributed_tls_read_endpoint=/api/osquery/distributed/read \
 --distributed_tls_write_endpoint=/api/osquery/distributed/write \
 --logger_plugin=tls \
 --logger_tls_endpoint=/api/osquery/log \
 --logger_tls_period=10
```

If your osquery server certificate is deployed to a path that is not `/etc/osquery/fleet.crt`, be sure to update the `--tls_server_certs` flag. Similarly, if your enroll secret is in an environment variable that is not called `OSQUERY_ENROLL_SECRET`. Then, be sure to update the `--enroll_secret_env` environment variable.

If your enroll secret is defined in a local file, specify the file's path with the `--enroll_secret_path` flag instead of using the `--enroll_secret_env` flag.

### Using a flag file to manage flags

For your convenience, osqueryd supports putting all of your flags into a single file. We suggest deploying this file to `/etc/osquery/fleet.flags`. If you've deployed the appropriate osquery flags to that path, you could simply launch osquery via:

```
osqueryd --flagfile=/etc/osquery/fleet.flags
```

#### Flag file on Windows

Ensure that paths to files in the flag file are absolute, and not quoted. For example in `C:\Program Files\osquery\osquery.flags`:

```
--tls_server_certs=C:\Program Files\osquery\fleet.pem
--enroll_secret_path=C:\Program Files\osquery\secret.txt
```

### Migrating from plain osquery to osquery installer

The following is a strategy for migrating a plain osquery deployment. Unlike plain osquery, Fleet's
osquery installer supports the automatic updating of osquery on your hosts so that you don't have to
deploy a new package for every new osquery release.

#### Generate installer

```
fleetctl package --type [pkg|msi|deb|rpm] --fleet-url [fleet-hostname:port] --enroll-secret [secret]
```

If you currently ship a certificate (`fleet.pem`), also include this in the generated package with
`--fleet-certificate [/path/to/fleet.pem]`.

Fleet automatically manages most of the osquery flags to connect to the Fleet server. There's no
need to set any of the flags mentioned above in [Launching osqueryd](#launching-osqueryd). To
include other osquery flags, provide a flagfile when packaging with `--osquery-flagfile
[/path/to/osquery.flags]`.

Test the installers on each platform before initiating the migration.

#### Migrate

Using your standard deployment tooling (Chef, Puppet, etc.), install the generated package. At this
time, [uninstall the existing
osquery](https://blog.fleetdm.com/how-to-uninstall-osquery-f01cc49a37b9).

If the existing enrolled hosts use `--host_identifier=uuid` (or the `uuid` setting for Fleet's
[osquery_host_identifier](../Deploying/Configuration.md#osquery-host-identifier)), the new
installation should appear as the same host in the Fleet UI. If other settings are used, duplicate
entries will appear in the Fleet UI. The older entries can be automatically cleaned up with the host
expiration functionality configured in the application settings (UI or fleetctl).

## Grant full disk access to osquery on macOS
macOS does not allow applications to access all system files by default. If you are using MDM, which
is required to deploy these profiles, you
can deploy a "Privacy Preferences Policy Control" policy to grant Orbit or osquery that level of
access. This is necessary to query for files located in protected paths as well as to use event
tables that require access to the [EndpointSecurity
API](https://developer.apple.com/documentation/endpointsecurity#overview), such as *es_process_events*.

### Creating the configuration profile
#### Obtaining identifiers
If you use plain osquery, instructions are [available here](https://osquery.readthedocs.io/en/stable/deployment/process-auditing/).

On a system with osquery installed via the Fleet osquery installer (Orbit), obtain the
`CodeRequirement` of Orbit by running:

```
codesign -dr - /opt/orbit/bin/orbit/macos/edge/orbit
```

The output should be similar or identical to:

```
Executable=/opt/orbit/bin/orbit/macos/edge/orbit
designated => identifier "com.fleetdm.orbit" and anchor apple generic and certificate 1[field.1.2.840.113635.100.6.2.6] /* exists */ and certificate leaf[field.1.2.840.113635.100.6.1.13] /* exists */ and certificate leaf[subject.OU] = "8VBZ3948LU"
```

> **NOTE:** Depending on the version of `fleetctl` used to package and install Orbit, the executable path may be different.
> Fleetctl versions <= 4.13.2 would install orbit to `/var/lib/orbit` instead of `/opt/orbit`.

Note down the **executable path** and the entire **identifier**.

Osqueryd will inherit the privileges from Orbit and does not need explicit permissions.

#### Creating the profile
Depending on your MDM, this might be possible in the UI or require a custom profile. If your MDM has a feature to configure *Policy Preferences*, follow these steps:

1. Configure the identifier type to “path”
2. Paste the full path to Orbit as the identifier.
3. Paste the full code signing identifier into the code requirement field.
4. Allow “Access all files”. Access to Downloads, Documents etc is inherited from this.

If your MDM does not have built-in support for privacy preferences profiles, you can use
[PPPC-Utility](https://github.com/jamf/PPPC-Utility) to create a profile with those values, then upload it to
your MDM as a custom profile.

#### Test the profile
Link the profile to a test group that contains at least one Mac.
Once the computer has received the profile, which you can verify by looking at *Profiles* in *System
Preferences*, run this query from Fleet:

```sql
SELECT * FROM file WHERE path LIKE '/Users/%/Downloads/%%';
```

If this query returns files, the profile has been successfully applied, as *Downloads* is a
protected location. You can now enjoy the benefits of osquery on all system files as well as start
using the *es_process_events* table!

<meta name="pageOrderInSection" value="500">
