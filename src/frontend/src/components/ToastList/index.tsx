import useToastStore from "@/core/stores/ToastStore";
import * as Toast from "@radix-ui/react-toast";
import "@/assets/styles/Toast.scss";
import ToastMessage from "@/components/ToastList/ToastMessage";

export default function ToastList() {
    const list = useToastStore((state) => state.list);

    return (
        <Toast.Provider swipeDirection="right">
            {Object.entries(list).map(([id, toast]) => (
                <ToastMessage key={id} id={id} toast={toast} />
            ))}
            <Toast.Viewport className="rt-ToastViewport" />
        </Toast.Provider>
    );
}
