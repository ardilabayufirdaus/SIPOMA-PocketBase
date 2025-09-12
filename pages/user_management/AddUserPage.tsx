import React, { useState } from "react";
import UserForm from "../../components/UserForm";
import { AddUserData, PlantUnit } from "../../types";
import { useUserManagement } from "../../hooks/useUserManagement";

interface AddUserPageProps {
  onOpenPasswordDisplay: (
    password: string,
    username: string,
    fullName: string
  ) => void;
  plantUnits: PlantUnit[];
  t: any;
}

const AddUserPage: React.FC<AddUserPageProps> = ({
  onOpenPasswordDisplay,
  plantUnits,
  t,
}) => {
  const { addUser } = useUserManagement();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSaveUser = async (user: AddUserData) => {
    try {
      const result = await addUser(user, plantUnits);
      if (result.success && result.tempPassword) {
        onOpenPasswordDisplay(
          result.tempPassword,
          user.username,
          user.full_name
        );
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t.add_user_menu || "Add New User"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {t.add_user_description ||
            "Create a new user account with appropriate permissions"}
        </p>
      </div>

      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {t.user_created_success || "User created successfully!"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <UserForm
          userToEdit={null}
          onSave={handleSaveUser}
          onCancel={() => {}} // No cancel action needed for dedicated add page
          plantUnits={plantUnits}
          t={t}
        />
      </div>
    </div>
  );
};

export default AddUserPage;
