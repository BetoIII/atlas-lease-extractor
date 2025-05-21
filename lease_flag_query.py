from lease_flags_schema import (
    LeaseFlag,
    LeaseFlagsSchema,
    LeaseFlagType,
    EarlyTerminationClause,
    UncappedOperatingExpenses,
    AmbiguousMaintenanceObligations,
    ExcessiveServiceCharges,
    HiddenFees,
    RestrictiveUseClauses,
    DoNotCompeteClauses,
    AmbiguousLanguage,
    LandlordsRightToTerminate,
    TenantInsuranceRequirements,
    IndemnificationClauses,
    UnfavorableRenewalTerms,
    HoldoverPenalties,
    SubleaseRestrictions,
    AssignmentClauses,
)
from typing import List

# Example: mapping keywords to flag classes
FLAG_KEYWORDS = {
    "early termination": EarlyTerminationClause,
    "uncapped operating expenses": UncappedOperatingExpenses,
    "ambiguous maintenance": AmbiguousMaintenanceObligations,
    "excessive service charges": ExcessiveServiceCharges,
    "hidden fees": HiddenFees,
    "restrictive use": RestrictiveUseClauses,
    "do not compete": DoNotCompeteClauses,
    "ambiguous language": AmbiguousLanguage,
    "landlord's right to terminate": LandlordsRightToTerminate,
    "tenant insurance": TenantInsuranceRequirements,
    "indemnification": IndemnificationClauses,
    "unfavorable renewal": UnfavorableRenewalTerms,
    "holdover penalties": HoldoverPenalties,
    "sublease restrictions": SubleaseRestrictions,
    "assignment clauses": AssignmentClauses,
}

def query_lease_flags(document_text: str) -> LeaseFlagsSchema:
    """
    Extracts lease flags from the given document text and returns them in the LeaseFlagsSchema format.
    """
    found_flags: List[LeaseFlag] = []

    # Simple keyword-based extraction (replace with NLP or search as needed)
    lowered = document_text.lower()
    for keyword, flag_class in FLAG_KEYWORDS.items():
        if keyword in lowered:
            found_flags.append(flag_class())

    return LeaseFlagsSchema(lease_flags=found_flags)

# Example usage:
# doc_text = "This lease contains an early termination clause and ambiguous maintenance obligations."
# result = query_lease_flags(doc_text)
# print(result.json(indent=2))
