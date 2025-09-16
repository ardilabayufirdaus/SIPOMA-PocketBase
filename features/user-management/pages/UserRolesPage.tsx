import React from "react";
import UserPermissionManagerNew from "../components/UserPermissionManagerNew";

interface UserRolesPageProps {
  users: any[];
  plantUnits: any[];
  t: any;
}

const UserRolesPage: React.FC<UserRolesPageProps> = ({
  users,
  plantUnits,
  t,
}) => {
  return (
    <div className="p-6">
      <UserPermissionManagerNew language="en" />
    </div>
  );
};

export default UserRolesPage;
