from datetime import date

from fastapi import APIRouter, Depends

from app.api.deps import get_report_service
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/availability")
def availability_report(service: ReportService = Depends(get_report_service)):
    """Автомобілі в розрізі зайнятості."""
    return service.availability()


@router.get("/financial")
def financial_report(
    date_from: date | None = None,
    date_to: date | None = None,
    service: ReportService = Depends(get_report_service),
):
    """Автомобілі в розрізі фінансових показників."""
    return service.financial(date_from, date_to)