import { Checkbox, Table } from "@/components/base";
import { GlobalRelationshipType } from "@/core/models";
import GlobalRelationshipChildName from "@/pages/SettingsPage/components/relationships/GlobalRelationshipChildName";
import GlobalRelationshipDescription from "@/pages/SettingsPage/components/relationships/GlobalRelationshipDescription";
import GlobalRelationshipParentName from "@/pages/SettingsPage/components/relationships/GlobalRelationshipParentName";
import { memo } from "react";

export interface IGlobalRelationshipRowProps {
    globalRelationship: GlobalRelationshipType.TModel;
    selectedGlobalRelationships: string[];
    setSelectedGlobalRelationships: React.Dispatch<React.SetStateAction<string[]>>;
}

const GlobalRelationshipRow = memo(
    ({ globalRelationship, selectedGlobalRelationships, setSelectedGlobalRelationships }: IGlobalRelationshipRowProps) => {
        const toggleSelect = () => {
            setSelectedGlobalRelationships((prev) => {
                if (prev.some((value) => value === globalRelationship.uid)) {
                    return prev.filter((value) => value !== globalRelationship.uid);
                } else {
                    return [...prev, globalRelationship.uid];
                }
            });
        };

        return (
            <Table.Row>
                <Table.Cell className="w-12 p-0 text-center">
                    <Checkbox checked={selectedGlobalRelationships.some((value) => value === globalRelationship.uid)} onClick={toggleSelect} />
                </Table.Cell>
                <GlobalRelationshipParentName globalRelationship={globalRelationship} />
                <GlobalRelationshipChildName globalRelationship={globalRelationship} />
                <GlobalRelationshipDescription globalRelationship={globalRelationship} />
            </Table.Row>
        );
    }
);

export default GlobalRelationshipRow;
