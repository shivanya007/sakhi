def calculate_risk(incident_type):
    risk_map = {
        "harassment": 5,
        "theft": 4,
        "poor_lighting": 3,
        "assault": 6
    }
    return risk_map.get(incident_type.lower(), 1)