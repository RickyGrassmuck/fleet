/* eslint-disable react/prop-types */
// disable this rule as it was throwing an error in Header and Cell component
// definitions for the selection row for some reason when we dont really need it.
import React from "react";
import { Column } from "react-table";
import ReactTooltip from "react-tooltip";

import { IDeviceUser, IHost } from "interfaces/host";
import Checkbox from "components/forms/fields/Checkbox";
import HeaderCell from "components/TableContainer/DataTable/HeaderCell/HeaderCell";
import IssueCell from "components/TableContainer/DataTable/IssueCell/IssueCell";
import LinkCell from "components/TableContainer/DataTable/LinkCell/LinkCell";
import StatusCell from "components/TableContainer/DataTable/StatusCell/StatusCell";
import TextCell from "components/TableContainer/DataTable/TextCell/TextCell";
import {
  humanHostMemory,
  humanHostUptime,
  humanHostLastSeen,
  humanHostDetailUpdated,
  hostTeamName,
} from "utilities/helpers";
import { IConfig } from "interfaces/config";
import { IDataColumn } from "interfaces/datatable_config";
import { ITeamSummary } from "interfaces/team";
import { IUser } from "interfaces/user";
import PATHS from "router/paths";
import permissionUtils from "utilities/permissions";
import IssueIcon from "../../../../assets/images/icon-issue-fleet-black-16x16@2x.png";

interface IGetToggleAllRowsSelectedProps {
  checked: boolean;
  indeterminate: boolean;
  title: string;
  onChange: () => void;
  style: { cursor: string };
}
interface IHeaderProps {
  column: {
    title: string;
    isSortedDesc: boolean;
  };
  getToggleAllRowsSelectedProps: () => IGetToggleAllRowsSelectedProps;
  toggleAllRowsSelected: () => void;
}

interface ICellProps {
  cell: {
    value: string;
  };
  row: {
    original: IHost;
    getToggleRowSelectedProps: () => IGetToggleAllRowsSelectedProps;
    toggleRowSelected: () => void;
  };
}

interface IDeviceUserCellProps {
  cell: {
    value: IDeviceUser[];
  };
  row: {
    original: IHost;
  };
}

const condenseDeviceUsers = (users: IDeviceUser[]): string[] => {
  if (!users?.length) {
    return [];
  }
  const condensed =
    users
      .slice(-3)
      .map((u) => u.email)
      .reverse() || [];
  return users.length > 3
    ? condensed.concat(`+${users.length - 3} more`) // TODO: confirm limit
    : condensed;
};

const tooltipTextWithLineBreaks = (lines: string[]) => {
  return lines.map((line) => {
    return (
      <span key={Math.random().toString().slice(2)}>
        {line}
        <br />
      </span>
    );
  });
};

const lastSeenTime = (status: string, seenTime: string): string => {
  if (status !== "online") {
    return `Last Seen: ${humanHostLastSeen(seenTime)} UTC`;
  }
  return "Online";
};

const allHostTableHeaders: IDataColumn[] = [
  // We are using React Table useRowSelect functionality for the selection header.
  // More information on its API can be found here
  // https://react-table.tanstack.com/docs/api/useRowSelect
  {
    id: "selection",
    Header: (cellProps: IHeaderProps): JSX.Element => {
      const props = cellProps.getToggleAllRowsSelectedProps();
      const checkboxProps = {
        value: props.checked,
        indeterminate: props.indeterminate,
        onChange: () => cellProps.toggleAllRowsSelected(),
      };
      return <Checkbox {...checkboxProps} />;
    },
    Cell: (cellProps: ICellProps): JSX.Element => {
      const props = cellProps.row.getToggleRowSelectedProps();
      const checkboxProps = {
        value: props.checked,
        onChange: () => cellProps.row.toggleRowSelected(),
      };
      return <Checkbox {...checkboxProps} />;
    },
    disableHidden: true,
  },
  {
    title: "Hostname",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "hostname",
    Cell: (cellProps: ICellProps) => (
      <LinkCell
        value={cellProps.cell.value}
        path={PATHS.HOST_DETAILS(cellProps.row.original)}
        title={lastSeenTime(
          cellProps.row.original.status,
          cellProps.row.original.seen_time
        )}
      />
    ),
    disableHidden: true,
  },
  {
    title: "Team",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "team_name",
    Cell: (cellProps: ICellProps) => (
      <TextCell value={cellProps.cell.value} formatter={hostTeamName} />
    ),
  },
  {
    title: "Status",
    Header: "Status",
    disableSortBy: true,
    accessor: "status",
    Cell: (cellProps: ICellProps) => (
      <StatusCell value={cellProps.cell.value} />
    ),
  },
  {
    title: "Issues",
    Header: () => <img alt="host issues" src={IssueIcon} />,
    disableSortBy: true,
    accessor: "issues",
    Cell: (cellProps: ICellProps) => (
      <IssueCell
        issues={cellProps.row.original.issues}
        rowId={cellProps.row.original.id}
      />
    ),
  },
  {
    title: "OS",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "os_version",
    Cell: (cellProps: ICellProps) => <TextCell value={cellProps.cell.value} />,
  },
  {
    title: "Osquery",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "osquery_version",
    Cell: (cellProps: ICellProps) => <TextCell value={cellProps.cell.value} />,
  },
  {
    title: "Used by",
    Header: "Used by",
    disableSortBy: true,
    accessor: "device_mapping",
    Cell: (cellProps: IDeviceUserCellProps): JSX.Element => {
      const numUsers = cellProps.cell.value?.length || 0;
      const users = condenseDeviceUsers(cellProps.cell.value || []);
      if (users.length) {
        const tooltipText = tooltipTextWithLineBreaks(users);
        return (
          <>
            <span
              className={`text-cell ${users.length > 1 ? "text-muted" : ""}`}
              data-tip
              data-for={`device_mapping__${cellProps.row.original.id}`}
              data-tip-disable={users.length <= 1}
            >
              {numUsers === 1 ? users[0] : `${numUsers} users`}
            </span>
            <ReactTooltip
              place="top"
              type="dark"
              effect="solid"
              backgroundColor="#3e4771"
              id={`device_mapping__${cellProps.row.original.id}`}
              data-html
            >
              <span className={`tooltip__tooltip-text`}>{tooltipText}</span>
            </ReactTooltip>
          </>
        );
      }
      return <span className="text-muted">---</span>;
    },
  },
  {
    title: "IP address",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "primary_ip",
    Cell: (cellProps: ICellProps) => <TextCell value={cellProps.cell.value} />,
  },
  {
    title: "Last fetched",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "detail_updated_at",
    Cell: (cellProps: ICellProps) => (
      <TextCell
        value={cellProps.cell.value}
        formatter={humanHostDetailUpdated}
      />
    ),
  },
  {
    title: "Last seen",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "seen_time",
    Cell: (cellProps: ICellProps) => (
      <TextCell value={cellProps.cell.value} formatter={humanHostLastSeen} />
    ),
  },
  {
    title: "UUID",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "uuid",
    Cell: (cellProps: ICellProps) => <TextCell value={cellProps.cell.value} />,
  },
  {
    title: "Uptime",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "uptime",
    Cell: (cellProps: ICellProps) => (
      <TextCell value={cellProps.cell.value} formatter={humanHostUptime} />
    ),
  },
  {
    title: "CPU",
    Header: "CPU",
    disableSortBy: true,
    accessor: "cpu_type",
    Cell: (cellProps: ICellProps) => <TextCell value={cellProps.cell.value} />,
  },
  {
    title: "RAM",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "memory",
    Cell: (cellProps: ICellProps) => (
      <TextCell value={cellProps.cell.value} formatter={humanHostMemory} />
    ),
  },
  {
    title: "MAC address",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "primary_mac",
    Cell: (cellProps: ICellProps) => <TextCell value={cellProps.cell.value} />,
  },
  {
    title: "Serial number",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "hardware_serial",
    Cell: (cellProps: ICellProps) => <TextCell value={cellProps.cell.value} />,
  },
  {
    title: "Hardware model",
    Header: (cellProps: IHeaderProps) => (
      <HeaderCell
        value={cellProps.column.title}
        isSortedDesc={cellProps.column.isSortedDesc}
      />
    ),
    accessor: "hardware_model",
    Cell: (cellProps: ICellProps) => <TextCell value={cellProps.cell.value} />,
  },
];

const defaultHiddenColumns = [
  "device_mapping",
  "primary_mac",
  "cpu_type",
  "memory",
  "uptime",
  "uuid",
  "seen_time",
  "hardware_model",
  "hardware_serial",
];

/**
 * Will generate a host table column configuration based off of the current user
 * permissions and license tier of fleet they are on.
 */
const generateAvailableTableHeaders = (
  config: IConfig,
  currentUser: IUser,
  currentTeam: ITeamSummary | undefined
): IDataColumn[] => {
  return allHostTableHeaders.reduce(
    (columns: Column[], currentColumn: Column) => {
      // skip over column headers that are not shown in free observer tier
      if (
        permissionUtils.isFreeTier(config) &&
        permissionUtils.isGlobalObserver(currentUser)
      ) {
        if (
          currentColumn.accessor === "team_name" ||
          currentColumn.id === "selection"
        ) {
          return columns;
        }
        // skip over column headers that are not shown in free admin/maintainer
      } else if (permissionUtils.isFreeTier(config)) {
        if (currentColumn.accessor === "team_name") {
          return columns;
        }
      } else if (
        // In premium tier, we want to check user role to enable/disable select column
        !permissionUtils.isGlobalAdmin(currentUser) &&
        !permissionUtils.isGlobalMaintainer(currentUser) &&
        !permissionUtils.isTeamMaintainer(
          currentUser,
          currentTeam?.id || null
        ) &&
        !permissionUtils.isTeamAdmin(currentUser, currentTeam?.id || null)
      ) {
        if (currentColumn.id === "selection") {
          return columns;
        }
      }

      columns.push(currentColumn);
      return columns;
    },
    []
  );
};

/**
 * Will generate a host table column configuration that a user currently sees.
 *
 */
const generateVisibleTableColumns = (
  hiddenColumns: string[],
  config: IConfig,
  currentUser: IUser,
  currentTeam: ITeamSummary | undefined
): IDataColumn[] => {
  // remove columns set as hidden by the user.
  return generateAvailableTableHeaders(config, currentUser, currentTeam).filter(
    (column) => {
      return !hiddenColumns.includes(column.accessor as string);
    }
  );
};

export {
  defaultHiddenColumns,
  generateAvailableTableHeaders,
  generateVisibleTableColumns,
};
