import { Flex, Skeleton } from "@/components/base";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";

function SkeletonBoardCardCheckitem() {
    return (
        <div className="my-2 snap-center">
            <Flex
                items="center"
                justify="between"
                gap="2"
                h={{
                    initial: "16",
                    md: "12",
                }}
                className="w-full"
            >
                <Flex items="center" gap="2" w="full" className="truncate">
                    <Flex items="center" gap="1">
                        <Skeleton className="h-8 w-6 transition-all sm:size-8" />
                    </Flex>
                    <Flex
                        direction={{
                            initial: "col",
                            md: "row",
                        }}
                        items={{
                            md: "center",
                        }}
                        gap="0.5"
                        w="full"
                    >
                        <Flex items="center" justify="between" gap="1" mr="1">
                            <Flex items="center" gap="1">
                                <SkeletonUserAvatarList count={3} size={{ initial: "xs", lg: "sm" }} spacing="none" />
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </div>
    );
}

export default SkeletonBoardCardCheckitem;
