import TypeUtils from "@/core/utils/TypeUtils";
import axios from "axios";
import pako from "pako";

export const api = axios.create({
    transformRequest: (axios.defaults.transformRequest
        ? Array.isArray(axios.defaults.transformRequest)
            ? axios.defaults.transformRequest
            : [axios.defaults.transformRequest]
        : []
    ).concat((data, headers) => {
        if (TypeUtils.isString(data) && data.length > 1024) {
            headers["Content-Encoding"] = "gzip";
            return pako.gzip(data).buffer;
        } else {
            headers["Content-Encoding"] = undefined;
            return data;
        }
    }),
});
