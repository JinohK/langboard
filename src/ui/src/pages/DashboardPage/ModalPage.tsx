import { ROUTES } from "@/core/routing/constants";
import CreateProjectFormDialog from "@/pages/DashboardPage/components/CreateProjectFormDialog";
import MyActivityDialog from "@/pages/DashboardPage/components/MyActivityDialog";
import { memo, useState } from "react";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";

const ModalPage = memo(() => {
    const navigate = usePageNavigateRef();
    const [pageType, tabName, modalType] = location.pathname.split("/").slice(2);
    const [isOpened, setIsOpened] = useState(true);

    let modalName;
    if (pageType === "projects") {
        modalName = modalType;
    } else {
        modalName = tabName;
    }

    const moveToBack = () => {
        if (pageType === "projects") {
            navigate(ROUTES.DASHBOARD.PAGE_TYPE(`${pageType}/${tabName}`));
        } else {
            navigate(ROUTES.DASHBOARD.PAGE_TYPE(pageType));
        }
    };

    const changeIsOpenedState = (opened: bool) => {
        if (!opened) {
            moveToBack();
        }
        setIsOpened(opened);
    };

    let modalContent;
    switch (modalName) {
        case "new-project":
            modalContent = <CreateProjectFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case "my-activity":
            modalContent = <MyActivityDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        default:
            modalContent = null;
    }

    return modalContent;
});

export default ModalPage;
