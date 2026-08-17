-- ============================================================================
-- Sample seed data: device + camera modules
-- ============================================================================
-- Purpose: there are no physical devices registered yet, so this script
-- seeds a realistic fixture against an ALREADY-EXISTING company/branch/user
-- in the target database:
--   - 2 devices are `master` at the SAME branch — demonstrating that a
--     branch may have multiple master devices (no uniqueness constraint).
--   - 1 device is an already-`approved` `slave`.
--   - 1 device (`Yard Camera Unit-04`) is left at `approval_status =
--     'pending_approval'` with assign_by set — Owner/Admin registered it
--     via authenticated POST /devices and it is waiting for approval.
--   - 1 device (`Self-Registered Gate Unit-05`) is also
--     `pending_approval`, but assign_by IS NULL — it arrived via
--     unauthenticated POST /devices/register-slave (no acting user).
--     Same approval workflow; the NULL assign_by is the distinguisher.
--
-- Assumes the following already exist in `companies` / `company_branches`
-- / `users`:
--   company_id : 3c6eb1d8-c092-4e2f-ae4e-a1622e9cf86c
--   branch_id  : d63d972c-ebd3-43e0-b0b9-c15f0dd1706f
--   user_id    : 186fab0a-e3d8-4903-b211-bc939d090b94
--
-- Table names match Alembic models (plural, company style):
--   devices, company_devices, device_health, device_model_subscriptions,
--   cameras, device_camera_assignments.
-- BaseModel.created_by / updated_by are Integer — leave them NULL.
-- Device-owned actor columns (assign_by, approved_by, enabled_by) are UUID.
--
-- Run after `alembic upgrade head` against local Postgres. Fixture only —
-- not a migration. Idempotent: safe to re-run (fixed UUIDs + ON CONFLICT
-- DO NOTHING).
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. devices — two `master` at the SAME branch, one approved slave, one
--    Owner-registered pending row, one self-registered pending row
-- ============================================================================
INSERT INTO devices (
    device_id, device_name, ip, dns_name, device_role, status,
    serial_no, mac_id, manufacturing_date,
    created_at, created_by, updated_at, updated_by,
    is_system_record, is_deleted
) VALUES
    ('76c4d241-0301-4666-88b6-6885eaf586a1', 'Main Entrance NVR-01', '192.168.1.101', NULL, 'master', 'Active',
     'ATM-MST-0001', 'AA:BB:CC:00:11:01', '2026-02-10',
     now(), NULL, now(), NULL,
     false, false),
    ('d8b2ffc2-35f6-457f-b9d2-38fa48b154d3', 'Warehouse NVR-02', '192.168.1.201', NULL, 'master', 'Active',
     'ATM-MST-0002', 'AA:BB:CC:00:11:02', '2026-02-10',
     now(), NULL, now(), NULL,
     false, false),
    ('1b90dbaa-8a55-4eb4-96eb-a49ad76f44fe', 'Loading Dock Unit-03', '192.168.1.211', NULL, 'slave', 'Maintenance',
     'ATM-SLV-0003', 'AA:BB:CC:00:11:03', '2026-03-01',
     now(), NULL, now(), NULL,
     false, false),
    ('2a5e6f31-9c4a-4b7e-8f10-3d6c9a4e0b2d', 'Yard Camera Unit-04', '192.168.1.221', NULL, 'slave', 'Inactive',
     'ATM-SLV-0004', 'AA:BB:CC:00:11:04', '2026-03-15',
     now(), NULL, now(), NULL,
     false, false),
    ('3e8f1a62-b47c-4d91-9e3a-7c5b2d8f0a14', 'Self-Registered Gate Unit-05', '192.168.1.231', 'gate-unit-05.local', 'slave', 'Inactive',
     'ATM-SLV-0005', 'AA:BB:CC:00:11:05', '2026-04-01',
     now(), NULL, now(), NULL,
     false, false)
ON CONFLICT (device_id) DO NOTHING;

-- ============================================================================
-- 2. company_devices — assigns each device to the given company + branch.
-- ============================================================================
INSERT INTO company_devices (
    company_device_id, device_id, company_id, branch_id, assign_by,
    approval_status, approved_by, approved_at,
    created_at, created_by, updated_at, updated_by,
    is_system_record, is_deleted
) VALUES
    ('6b638eaa-4542-4075-afe6-4c1440ac2341', '76c4d241-0301-4666-88b6-6885eaf586a1',
     '3c6eb1d8-c092-4e2f-ae4e-a1622e9cf86c', 'd63d972c-ebd3-43e0-b0b9-c15f0dd1706f',
     '186fab0a-e3d8-4903-b211-bc939d090b94',
     'approved', '186fab0a-e3d8-4903-b211-bc939d090b94', now(),
     now(), NULL, now(), NULL,
     false, false),
    ('b46372bf-cbe5-4033-9541-960ca314cee8', 'd8b2ffc2-35f6-457f-b9d2-38fa48b154d3',
     '3c6eb1d8-c092-4e2f-ae4e-a1622e9cf86c', 'd63d972c-ebd3-43e0-b0b9-c15f0dd1706f',
     '186fab0a-e3d8-4903-b211-bc939d090b94',
     'approved', '186fab0a-e3d8-4903-b211-bc939d090b94', now(),
     now(), NULL, now(), NULL,
     false, false),
    ('cd73fb2b-21d0-407b-8aff-5ecb84b7d7a7', '1b90dbaa-8a55-4eb4-96eb-a49ad76f44fe',
     '3c6eb1d8-c092-4e2f-ae4e-a1622e9cf86c', 'd63d972c-ebd3-43e0-b0b9-c15f0dd1706f',
     '186fab0a-e3d8-4903-b211-bc939d090b94',
     'approved', '186fab0a-e3d8-4903-b211-bc939d090b94', now(),
     now(), NULL, now(), NULL,
     false, false),
    ('f3c1a9e2-7b6d-4a08-9e2f-1c5d8b4a6f90', '2a5e6f31-9c4a-4b7e-8f10-3d6c9a4e0b2d',
     '3c6eb1d8-c092-4e2f-ae4e-a1622e9cf86c', 'd63d972c-ebd3-43e0-b0b9-c15f0dd1706f',
     '186fab0a-e3d8-4903-b211-bc939d090b94',
     'pending_approval', NULL, NULL,
     now(), NULL, now(), NULL,
     false, false),
    -- Self-registered via POST /devices/register-slave: assign_by is NULL.
    ('8d4e2c91-6f3a-4b17-ae50-2c9f8d1b7e46', '3e8f1a62-b47c-4d91-9e3a-7c5b2d8f0a14',
     '3c6eb1d8-c092-4e2f-ae4e-a1622e9cf86c', 'd63d972c-ebd3-43e0-b0b9-c15f0dd1706f',
     NULL,
     'pending_approval', NULL, NULL,
     now(), NULL, now(), NULL,
     false, false)
ON CONFLICT (company_device_id) DO NOTHING;

-- ============================================================================
-- 3. device_health — one latest snapshot per assignment
-- ============================================================================
INSERT INTO device_health (
    device_health_id, company_device_id, cpu_usage, npu_usage, ram, temperature,
    created_at, created_by, updated_at, updated_by,
    is_system_record, is_deleted
) VALUES
    ('eb67171b-61a1-4c5e-9dc5-b738287aa4a3', '6b638eaa-4542-4075-afe6-4c1440ac2341',
     42.5, 15.2, 63.0, 47.8,
     now(), NULL, now(), NULL,
     false, false),
    ('a8724794-d5f5-4fca-9247-80d02fa32deb', 'b46372bf-cbe5-4033-9541-960ca314cee8',
     38.0, 10.0, 55.0, 44.2,
     now(), NULL, now(), NULL,
     false, false),
    ('7d5bf7b7-664e-40cb-a9da-cd86e8d9a4b4', 'cd73fb2b-21d0-407b-8aff-5ecb84b7d7a7',
     12.0, 0.0, 30.0, 39.5,
     now(), NULL, now(), NULL,
     false, false)
ON CONFLICT (device_health_id) DO NOTHING;

-- ============================================================================
-- 4. device_model_subscriptions — model access per assignment
-- ============================================================================
INSERT INTO device_model_subscriptions (
    subscription_id, company_device_id, model_id, subscription_key,
    is_enabled, enabled_by, start_date, end_date,
    created_at, created_by, updated_at, updated_by,
    is_system_record, is_deleted
) VALUES
    ('6f41ca0e-8140-4568-86fa-a6890f421783', '6b638eaa-4542-4075-afe6-4c1440ac2341',
     'person', 'enc:sample-key-person-01', true, '186fab0a-e3d8-4903-b211-bc939d090b94',
     '2026-02-10', '2027-02-10',
     now(), NULL, now(), NULL,
     false, false),
    ('1ed8ccef-a82d-4c71-9c47-ca8523ec6b89', '6b638eaa-4542-4075-afe6-4c1440ac2341',
     'face', 'enc:sample-key-face-01', true, '186fab0a-e3d8-4903-b211-bc939d090b94',
     '2026-02-10', '2027-02-10',
     now(), NULL, now(), NULL,
     false, false),
    ('410d47e0-1be5-486f-a89e-73d1aa7bd549', 'b46372bf-cbe5-4033-9541-960ca314cee8',
     'person', 'enc:sample-key-person-02', true, '186fab0a-e3d8-4903-b211-bc939d090b94',
     '2026-02-10', '2027-02-10',
     now(), NULL, now(), NULL,
     false, false),
    ('ace2c2d4-aa6c-4284-baa8-3697505b6d5e', 'cd73fb2b-21d0-407b-8aff-5ecb84b7d7a7',
     'fire_safety', 'enc:sample-key-firesafety-03', false, '186fab0a-e3d8-4903-b211-bc939d090b94',
     '2026-03-01', '2027-03-01',
     now(), NULL, now(), NULL,
     false, false)
ON CONFLICT (subscription_id) DO NOTHING;

-- ============================================================================
-- 5. cameras — cameras attached to each device assignment
-- ============================================================================
INSERT INTO cameras (
    camera_id, camera_name, company_device_id, camera_type, rtsp_url,
    camera_status, location, zone, department, camera_group, resolution, fps_limit,
    created_at, created_by, updated_at, updated_by,
    is_system_record, is_deleted
) VALUES
    ('9f867bdb-1abf-4e46-adeb-0e37af3f210f', 'Main Entrance - Front Door', '6b638eaa-4542-4075-afe6-4c1440ac2341',
     'RTSP', 'rtsp://192.168.1.101:554/stream1',
     'online', 'Main Entrance', 'Zone A', 'Security', 'Entrance Cameras', '1920x1080', 15,
     now(), NULL, now(), NULL,
     false, false),
    ('049c64b7-bcba-4704-81ae-8ab04811bf22', 'Main Entrance - Lobby', '6b638eaa-4542-4075-afe6-4c1440ac2341',
     'RTSP', 'rtsp://192.168.1.101:554/stream2',
     'online', 'Main Lobby', 'Zone A', 'Security', 'Entrance Cameras', '1920x1080', 15,
     now(), NULL, now(), NULL,
     false, false),
    ('66485553-dfee-464b-94e4-24b886f7e6e2', 'Warehouse - Loading Bay 1', 'b46372bf-cbe5-4033-9541-960ca314cee8',
     'RTSP', 'rtsp://192.168.1.201:554/stream1',
     'online', 'Warehouse Bay 1', 'Zone B', 'Operations', 'Warehouse Cameras', '2560x1440', 10,
     now(), NULL, now(), NULL,
     false, false),
    ('6c4546d9-9856-4da2-acc3-b99eacdb3542', 'Loading Dock - Gate Cam', 'cd73fb2b-21d0-407b-8aff-5ecb84b7d7a7',
     'USB', NULL,
     'disconnected', 'Loading Dock Gate', 'Zone C', 'Operations', 'Dock Cameras', '1280x720', 10,
     now(), NULL, now(), NULL,
     false, false)
ON CONFLICT (camera_id) DO NOTHING;

-- ============================================================================
-- 6. device_camera_assignments — attaches each camera's detection run
-- ============================================================================
INSERT INTO device_camera_assignments (
    model_assign_id, camera_id, company_device_id, confidence_threshold, status,
    start_date, end_date,
    created_at, created_by, updated_at, updated_by,
    is_system_record, is_deleted
) VALUES
    ('e2f0c66a-8844-4d93-9c89-88154f2976b8', '9f867bdb-1abf-4e46-adeb-0e37af3f210f', '6b638eaa-4542-4075-afe6-4c1440ac2341',
     0.75, 'running', '2026-02-10', NULL,
     now(), NULL, now(), NULL,
     false, false),
    ('078202bf-bcd8-4989-9f40-9efc9077c23f', '049c64b7-bcba-4704-81ae-8ab04811bf22', '6b638eaa-4542-4075-afe6-4c1440ac2341',
     0.70, 'running', '2026-02-10', NULL,
     now(), NULL, now(), NULL,
     false, false),
    ('c44a36e1-256d-4eb9-aacd-28c2c7b8fa4c', '66485553-dfee-464b-94e4-24b886f7e6e2', 'b46372bf-cbe5-4033-9541-960ca314cee8',
     0.80, 'running', '2026-02-10', NULL,
     now(), NULL, now(), NULL,
     false, false),
    ('e136011b-94f8-44c6-8508-c0f982018e4f', '6c4546d9-9856-4da2-acc3-b99eacdb3542', 'cd73fb2b-21d0-407b-8aff-5ecb84b7d7a7',
     0.65, 'stopped', '2026-03-01', NULL,
     now(), NULL, now(), NULL,
     false, false)
ON CONFLICT (model_assign_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- Sanity check
-- ============================================================================
-- SELECT d.device_name, d.device_role, d.status, cd.approval_status, cd.branch_id
-- FROM devices d
-- JOIN company_devices cd ON cd.device_id = d.device_id
-- WHERE cd.branch_id = 'd63d972c-ebd3-43e0-b0b9-c15f0dd1706f' AND cd.is_deleted = false;
--
-- -- Devices still awaiting approval at this branch:
-- SELECT d.device_name, cd.approval_status
-- FROM devices d
-- JOIN company_devices cd ON cd.device_id = d.device_id
-- WHERE cd.branch_id = 'd63d972c-ebd3-43e0-b0b9-c15f0dd1706f'
--   AND cd.approval_status = 'pending_approval' AND cd.is_deleted = false;
-- ============================================================================
