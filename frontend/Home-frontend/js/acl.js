//yetkilerin yönetimi
//permission listesi mapping’i

const Role_Permission = {
    ELCI: [
        "events:read", "events:create", "events:update", "events:delete",
        "projects:read", "projects:create", "projects:update", "projects:delete",
        "reports:read", "reports:feedback", "reports:create", "report:delete", "report:update",
        "calendar:read", "calendar:create","calendar:update","calendar:delete",
        "finance:read", "finance:create","finance:update","finance:delete",
        "members:read", "members:create", "members:update", "members:delete"
    ],

    ELCI_YARDIMCISI: [
        "events:read", "events:create", "events:update", "events:delete",
        "projects:read", "projects:create", "projects:update", "projects:delete",
        "reports:read", "reports:feedback", "reports:create", "report:delete", "report:update",
        "calendar:read", "calendar:create","calendar:update","calendar:delete",
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
        "reports:read", "reports:create", "report:delete",
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
        "reports:create", "report:delete", "report:update","reports:read"
    ]
}

export function buildPermissions(role) {
  return Role_Permission[role] || [];
}

