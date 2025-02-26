import React from "react";

import { ITeam } from "interfaces/team";
import { IUserFormErrors } from "interfaces/user";
import Modal from "components/Modal";
import Spinner from "components/Spinner";
import UserForm from "../UserForm";
import { IFormData } from "../UserForm/UserForm";

interface ICreateUserModalProps {
  onCancel: () => void;
  onSubmit: (formData: IFormData) => void;
  defaultGlobalRole?: string | null;
  defaultTeamRole?: string;
  defaultTeams?: ITeam[];
  availableTeams?: ITeam[];
  isPremiumTier: boolean;
  smtpConfigured: boolean;
  currentTeam?: ITeam;
  canUseSso: boolean; // corresponds to whether SSO is enabled for the organization
  isModifiedByGlobalAdmin?: boolean | false;
  isLoading?: boolean | false;
  serverErrors?: { base: string; email: string };
  createUserErrors?: IUserFormErrors;
}

const baseClass = "create-user-modal";

const CreateUserModal = ({
  onCancel,
  onSubmit,
  currentTeam,
  defaultGlobalRole,
  defaultTeamRole,
  defaultTeams,
  availableTeams,
  isPremiumTier,
  smtpConfigured,
  canUseSso,
  isModifiedByGlobalAdmin,
  isLoading,
  serverErrors,
  createUserErrors,
}: ICreateUserModalProps): JSX.Element => {
  return (
    <Modal title="Create user" onExit={onCancel} className={baseClass}>
      <>
        {isLoading && (
          <div className="loading-spinner">
            <Spinner />
          </div>
        )}
        <UserForm
          serverErrors={serverErrors}
          createOrEditUserErrors={createUserErrors}
          defaultGlobalRole={defaultGlobalRole}
          defaultTeamRole={defaultTeamRole}
          defaultTeams={defaultTeams}
          onCancel={onCancel}
          onSubmit={onSubmit}
          availableTeams={availableTeams || []}
          submitText={"Create"}
          isPremiumTier={isPremiumTier}
          smtpConfigured={smtpConfigured}
          canUseSso={canUseSso}
          isModifiedByGlobalAdmin={isModifiedByGlobalAdmin}
          currentTeam={currentTeam}
          isNewUser
        />
      </>
    </Modal>
  );
};

export default CreateUserModal;
