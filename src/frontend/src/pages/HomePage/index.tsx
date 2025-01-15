import { createDataTextRegex } from "@/components/Editor/plugins/markdown";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";

function HomePage(): JSX.Element {
    const { setIsLoadingRef } = usePageLoader();

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, []);

    return (
        <>
            <MentionedText content="Hello, !([mn:123:username])([/nm]) !([mn:456:username2])([/nm]) !([mn:789:username3])([/nm])" />
        </>
    );
}

function MentionedText({ content }: { content: string }) {
    const mentionRegex = createDataTextRegex("mention", 2, false);
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        const [fullMatch, userUID, username] = match;
        const matchIndex = match.index;

        if (matchIndex > lastIndex) {
            elements.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex, matchIndex)}</span>);
        }

        elements.push(
            <div
                key={`mention-${matchIndex}`}
                data-uid={userUID}
                style={{
                    color: "blue",
                    display: "inline-block",
                    fontWeight: "bold",
                }}
            >
                @{username}
            </div>
        );

        lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < content.length) {
        elements.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>);
    }

    return <>{elements}</>;
}

export default HomePage;
