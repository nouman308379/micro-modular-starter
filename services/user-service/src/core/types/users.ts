export const USER_ROLES = ["client", "stakeHolder", "legislator", "staff"] as const;

export type UserRole = (typeof USER_ROLES)[number];
