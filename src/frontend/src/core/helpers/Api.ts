import { API_URL } from "@/constants";
import axios from "axios";
import pako from "pako";

export const api = axios.create({
    baseURL: API_URL,
    transformRequest: (axios.defaults.transformRequest
        ? Array.isArray(axios.defaults.transformRequest)
            ? axios.defaults.transformRequest
            : [axios.defaults.transformRequest]
        : []
    ).concat((data, headers) => {
        if (typeof data === "string" && data.length > 1024) {
            headers["Content-Encoding"] = "gzip";
            return pako.gzip(data);
        } else {
            headers["Content-Encoding"] = undefined;
            return data;
        }
    }),
});
