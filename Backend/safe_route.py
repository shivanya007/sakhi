import math

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula to calculate distance in km
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * \
        math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
def find_safe_route(start_lat, start_lng, end_lat, end_lng, reports):
    risk_weights = {'assault': 6, 'harassment': 5, 'theft': 4, 'poor_lighting': 3}
    
    def get_point_risk(lat, lng):
        score = 0
        for r in reports:
            if calculate_distance(lat, lng, r.latitude, r.longitude) <= 0.5:
                score += risk_weights.get(r.incident_type.lower(), 1)
        return score

    primary_risk = get_point_risk(start_lat, start_lng)
    alternatives = []

    # If risk is more than 10, search for safer nearby spots
    if primary_risk > 10:
        # Check 4 points around the location (approx 300m offset)
        offsets = [(0.003, 0), (-0.003, 0), (0, 0.003), (0, -0.003)]
        for d_lat, d_lng in offsets:
            alt_lat, alt_lng = start_lat + d_lat, start_lng + d_lng
            alt_risk = get_point_risk(alt_lat, alt_lng)
            if alt_risk < primary_risk:
                alternatives.append({
                    "lat": round(alt_lat, 6),
                    "lng": round(alt_lng, 6),
                    "risk": alt_risk
                })

    # Sort alternatives to show the safest one first
    alternatives = sorted(alternatives, key=lambda x: x['risk'])

    message = "High risk area!" if primary_risk > 10 else "Area looks safe."
    
    return {
        "risk_score": primary_risk,
        "message": message,
        "suggestions": alternatives[:2] # Return top 2 safer alternatives
    }