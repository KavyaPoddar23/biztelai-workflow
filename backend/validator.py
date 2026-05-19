import re

def validate_record(record: dict) -> list:
    """
    Run validation rules on a single record.
    Returns a list of error messages.
    """
    errors = []

    # 1. Missing mandatory fields
    mandatory = ["date", "shift", "emp_no", "machine_no", "work_order_no"]
    for field in mandatory:
        value = record.get(field)
        if not value or str(value).strip() in ["", "null", "None"]:
            errors.append(f"Missing mandatory field: {field}")

    # 2. Shift must be I, II, III or 1, 2, 3
    shift = str(record.get("shift", "")).strip()
    valid_shifts = ["I", "II", "III", "1", "2", "3"]
    if shift and shift not in valid_shifts:
        errors.append(f"Invalid shift value: '{shift}'. Must be I, II, III or 1, 2, 3")

    # 3. Employee number format: BT followed by 4 digits
    emp_no = str(record.get("emp_no", "")).strip()
    if emp_no and not re.match(r'^BT\d{4}$', emp_no):
        errors.append(f"Invalid employee number format: '{emp_no}'. Expected format: BT followed by 4 digits (e.g. BT4710)")

    # 4. Machine number format: MC- followed by 3 digits
    machine_no = str(record.get("machine_no", "")).strip()
    if machine_no and not re.match(r'^MC-\d{3}$', machine_no):
        errors.append(f"Invalid machine number format: '{machine_no}'. Expected format: MC-XXX (e.g. MC-730)")

    # 5. Quantity checks
    qty = record.get("qty_produced")
    if qty is not None and str(qty).strip() not in ["", "null", "None", "-"]:
        try:
            qty_num = float(qty)
            if qty_num == 0:
                errors.append("Quantity produced is 0 — please verify")
            elif qty_num > 200:
                errors.append(f"Suspicious quantity: {qty_num} exceeds 200 — please verify")
            elif qty_num < 0:
                errors.append("Quantity cannot be negative")
        except ValueError:
            errors.append(f"Invalid quantity value: '{qty}' is not a number")

    # 6. Time taken checks
    time_taken = record.get("time_taken")
    if time_taken is not None and str(time_taken).strip() not in ["", "null", "None"]:
        try:
            time_num = float(time_taken)
            if time_num <= 0:
                errors.append("Time taken must be greater than 0")
            elif time_num > 24:
                errors.append(f"Suspicious time taken: {time_num} hours exceeds 24 hours")
        except ValueError:
            errors.append(f"Invalid time value: '{time_taken}' is not a number")

    return errors


def validate_all_records(records: list, existing_work_orders: list = []) -> list:
    """Validate a list of records and check for duplicate work orders"""
    seen_work_orders = set(existing_work_orders)
    validated = []

    for record in records:
        errors = validate_record(record)

        # 7. Duplicate work order check within same batch
        wo = str(record.get("work_order_no", "")).strip()
        if wo and wo in seen_work_orders:
            errors.append(f"Duplicate work order number: '{wo}'")
        elif wo:
            seen_work_orders.add(wo)

        validated.append({
            **record,
            "validation_errors": errors,
            "needs_review": len(errors) > 0
        })

    return validated