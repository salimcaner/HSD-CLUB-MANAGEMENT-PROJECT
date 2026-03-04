//yetkilerin yönetimi
//permission listesi mapping’i

const Role_Permission = {
    ADMIN: [
        "events:read", "events:create", "events:update", "events:delete",
        "projects:read", "projects:create", "projects:update", "projects:delete",
        "reports:read", "reports:feedback", "reports:create", "report:delete", "report:update",
        "calendar:read", "calendar:create", "calendar:update", "calendar:delete",
        "finance:read", "finance:create", "finance:update", "finance:delete",
        "members:read", "members:create", "members:update", "members:delete"
    ],

    ELCI: [
        "events:read", "events:create", "events:update", "events:delete",
        "projects:read", "projects:create", "projects:update", "projects:delete",
        "reports:read", "reports:feedback", "reports:create", "report:delete", "report:update",
        "calendar:read", "calendar:create", "calendar:update", "calendar:delete",
        "finance:read", "finance:create", "finance:update", "finance:delete",
        "members:read", "members:create", "members:update", "members:delete"
    ],

    ELCI_YARDIMCISI: [
        "events:read", "events:create", "events:update", "events:delete",
        "projects:read", "projects:create", "projects:update", "projects:delete",
        "reports:read", "reports:feedback", "reports:create", "report:delete", "report:update",
        "calendar:read", "calendar:create", "calendar:update", "calendar:delete",
        "members:read", "members:create", "members:update"
    ],

    GENEL_SEKRETER: [
        "events:read", "events:create", "events:update", "events:delete",
        "projects:read", "projects:create", "projects:update", "projects:delete",
        "reports:read", "reports:create", "report:delete", "report:update",
        "members:read", "members:create", "members:update"
    ],

    INSAN_KAYNAKLARI: [
        "events:read", "events:create", "events:update", "events:delete",
        "projects:read", "projects:create", "projects:update", "projects:delete",
        "reports:read", "reports:create", "report:update", "report:delete",
        "members:read", "members:create", "members:update"
    ],

    KOMITE_LIDERI: [
        "events:read", "events:create", "events:update", "events:delete",
        "projects:read", "projects:create", "projects:update", "projects:delete",
        "reports:read", "reports:feedback", "reports:create", "report:delete", "report:update",
        "members:read", "members:create", "members:update"
    ],

    UYE: [
        "events:read",
        "projects:read",
        "reports:create", "report:delete", "report:update", "reports:read"
    ]
}

export function buildPermissions(role) {
    if (!role) return [];
    const normalizedRole = typeof role === 'string' ? role.toUpperCase() : role;
    return Role_Permission[normalizedRole] || [];
}
export function hasPerm(user, perm) {
    return user.permissions?.includes(perm);
}
export function hasAnyPerm(user, perms) {
    if (!user?.permissions) return false;

    return perms.some(perm => user.permissions.includes(perm));
}
