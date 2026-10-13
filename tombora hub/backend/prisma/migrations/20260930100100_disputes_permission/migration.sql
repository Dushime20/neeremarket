INSERT INTO "permissions" ("id", "code", "description", "created_at")
VALUES (gen_random_uuid(), 'disputes.manage', 'disputes.manage', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."code" = 'disputes.manage'
  AND r."code" IN ('SUPER_ADMIN', 'ADMIN', 'ORDER_ADMIN', 'CUSTOMER_SUPPORT')
ON CONFLICT DO NOTHING;
