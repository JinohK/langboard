import axios from "axios";

export const api = axios.create({
    transformRequest: axios.defaults.transformRequest
        ? Array.isArray(axios.defaults.transformRequest)
            ? axios.defaults.transformRequest
            : [axios.defaults.transformRequest]
        : [],
});
