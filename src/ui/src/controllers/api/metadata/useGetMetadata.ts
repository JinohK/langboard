/* eslint-disable @typescript-eslint/no-explicit-any */
import { TMetadataForm } from "@/controllers/api/metadata/types";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { MetadataModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

const useGetMetadata = (form: TMetadataForm, options?: TQueryOptions) => {
    const { query } = useQueryMutation();

    let url: string;
    switch (form.type) {
        case "card":
            url = Utils.String.format(API_ROUTES.METADATA.CARD, { uid: form.project_uid, card_uid: form.uid });
            break;
        case "project_wiki":
            url = Utils.String.format(API_ROUTES.METADATA.PROJECT_WIKI, { uid: form.project_uid, wiki_uid: form.uid });
            break;
        default:
            throw new Error("Invalid metadata type");
    }

    const getMetadata = async () => {
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        MetadataModel.Model.fromOne(
            {
                uid: form.uid,
                type: form.type,
                metadata: res.data.metadata,
            },
            true
        );

        return res.data;
    };

    const result = query(["get-metadata"], getMetadata, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });

    return result;
};

export default useGetMetadata;
