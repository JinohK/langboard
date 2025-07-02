import { Checkbox, Flex, Table, Toast } from "@/components/base";
import useUpdateUserInSettings from "@/controllers/api/settings/users/useUpdateUserInSettings";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { ROUTES } from "@/core/routing/constants";
import { EHttpStatus } from "@langboard/core/enums";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function UserAdmin() {
    const [t] = useTranslation();
    const { model: user } = ModelRegistry.User.useContext();
    const navigate = usePageNavigateRef();
    const isAdmin = user.useField("is_admin");
    const { mutateAsync } = useUpdateUserInSettings(user, { interceptToast: true });
    const [isValidating, setIsValidating] = useState(false);

    const toggle = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = mutateAsync({
            is_admin: !isAdmin,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.User first name changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Table.FlexCell className="w-1/12 justify-center truncate">
            <Flex justify="center" w="full">
                <Checkbox checked={!!isAdmin} onClick={toggle} />
            </Flex>
        </Table.FlexCell>
    );
}

export default UserAdmin;
