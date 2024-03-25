export const ALL_PERMISSIONS = [
    //users
    "users:roles:write",
    "users:roles:delete",

    //roles
    "roles:write",

    //posts
    "posts:write",
    "posts:read", 
    "posts:delete",
    "posts:update"
] as const;

export const PERMISSIONS = ALL_PERMISSIONS.reduce((acc, permission) => {
    acc[permission] = permission;

    return acc;
},{} as Record<(typeof ALL_PERMISSIONS)[number], (typeof ALL_PERMISSIONS)[number]>);

export const USER_ROLE_PERMISSIONS = [
    PERMISSIONS["posts:write"],
    PERMISSIONS["posts:read"],
];

export const SYSTEM_ROLE = {
    SUPER_ADMIN: "SUPER_ADMIN",
    APPLICATION_USER: "APPLICATION_USER",
}