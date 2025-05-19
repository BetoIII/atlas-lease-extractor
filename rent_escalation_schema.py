from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date

class Duration(BaseModel):
    years: int = 0
    months: int = 0
    days: int = 0

class Uplift(BaseModel):
    min: Optional[float] = None  # Minimum uplift (percent or amount)
    amount: Optional[float] = None  # Fixed uplift (percent or amount)
    max: Optional[float] = None  # Maximum uplift (percent or amount)

class RentScheduleEntry(BaseModel):
    start_date: date
    duration: Duration
    rent_type: str = Field(..., description="e.g. Base, Minimum, Annual Fixed, Initial")
    units: str = Field(..., description="e.g. $/SF/Year, $ per rentable SF")
    amount: float
    review_type: Optional[str] = Field(None, description="e.g. CPI, Market Review, etc.")
    uplift: Optional[Uplift] = None
    adjust_expense_stops: Optional[bool] = False
    stop_year: Optional[int] = None

class RentEscalationSchema(BaseModel):
    rent_schedule: List[RentScheduleEntry]
