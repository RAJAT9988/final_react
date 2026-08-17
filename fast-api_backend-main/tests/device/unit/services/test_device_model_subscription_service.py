from datetime import date

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.device.exceptions import DeviceNotApprovedException
from app.device.schemas.device_model_subscription import (
    DeviceModelSubscriptionCreate,
    DeviceModelSubscriptionUpdate,
)
from tests.device.conftest import (
    build_company_device_service,
    build_device_service,
    build_subscription_service,
    create_company_and_branch,
    device_create_payload,
    make_actor,
)


@pytest.mark.asyncio
async def test_subscription_enable_blocked_until_approved(
    db_session: AsyncSession,
) -> None:
    company, branch = await create_company_and_branch(db_session)
    actor = make_actor(company.company_id)
    device_service = build_device_service()
    cd_service = build_company_device_service()
    sub_service = build_subscription_service()
    created = await device_service.create_device(
        db_session, device_create_payload(branch.branch_id), actor
    )
    with pytest.raises(DeviceNotApprovedException):
        await sub_service.create_subscription(
            db_session,
            created.device_id,
            DeviceModelSubscriptionCreate(
                model_id="person",
                subscription_key="enc:secret-key",
                is_enabled=True,
                start_date=date(2026, 2, 10),
                end_date=date(2027, 2, 10),
            ),
            actor,
        )

    disabled = await sub_service.create_subscription(
        db_session,
        created.device_id,
        DeviceModelSubscriptionCreate(
            model_id="person",
            subscription_key="enc:secret-key",
            is_enabled=False,
            start_date=date(2026, 2, 10),
            end_date=date(2027, 2, 10),
        ),
        actor,
    )
    assert disabled.is_enabled is False
    assert "subscription_key" not in disabled.model_dump()

    with pytest.raises(DeviceNotApprovedException):
        await sub_service.update_subscription(
            db_session,
            disabled.subscription_id,
            DeviceModelSubscriptionUpdate(is_enabled=True),
            actor,
        )

    await cd_service.approve(db_session, created.device_id, actor=actor)
    enabled = await sub_service.update_subscription(
        db_session,
        disabled.subscription_id,
        DeviceModelSubscriptionUpdate(is_enabled=True),
        actor,
    )
    assert enabled.is_enabled is True
    assert "subscription_key" not in enabled.model_dump()
