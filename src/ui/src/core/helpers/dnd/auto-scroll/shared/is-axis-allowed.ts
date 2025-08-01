import { type AllowedAxis, type Axis } from "@/core/helpers/dnd/auto-scroll/internal-types";

export function isAxisAllowed(axis: Axis, allowedAxis: AllowedAxis) {
    return allowedAxis === "all" || axis === allowedAxis;
}
