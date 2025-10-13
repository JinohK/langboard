import { createContext, memo, useContext, useRef, useState } from "react";

export interface IChatInputContext {
    height: number;
    setHeight: (height: number) => void;
    file: File | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    chatAttachmentRef: React.RefObject<HTMLInputElement | null>;
    chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
    clearAttachmentPreview: () => void;
}

interface IChatInputProviderProps {
    height: number;
    setHeight: (height: number) => void;
    children: React.ReactNode;
}

const initialContext = {
    height: 0,
    setHeight: () => {},
    file: null,
    setFile: () => {},
    chatAttachmentRef: { current: null },
    chatInputRef: { current: null },
    clearAttachmentPreview: () => {},
};

const ChatInputContext = createContext<IChatInputContext>(initialContext);

export const ChatInputProvider = memo(({ height, setHeight, children }: IChatInputProviderProps): React.ReactNode => {
    const [file, setFile] = useState<File | null>(null);
    const chatAttachmentRef = useRef<HTMLInputElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);

    const clearAttachmentPreview = () => {
        setFile(null);
        if (chatAttachmentRef.current) {
            chatAttachmentRef.current.value = "";
        }
    };

    return (
        <ChatInputContext.Provider
            value={{
                height,
                setHeight,
                file,
                setFile,
                chatAttachmentRef,
                chatInputRef,
                clearAttachmentPreview,
            }}
        >
            {children}
        </ChatInputContext.Provider>
    );
});

export const useChatInput = () => {
    const context = useContext(ChatInputContext);
    if (!context) {
        throw new Error("useChatInput must be used within a ChatInputProvider");
    }
    return context;
};
