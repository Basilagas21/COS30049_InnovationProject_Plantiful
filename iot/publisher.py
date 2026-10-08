"""Simulated sensor feed for the Plantiful IoT monitoring feature.

Registers two fixed sensors in Supabase and pushes synthetic readings
(temperature, humidity, movement) on a timer. No physical hardware is
attached: values are a seeded random walk chosen to look like tropical
field conditions at Niah National Park.

Usage:
    python iot/publisher.py --once
    python iot/publisher.py --interval 30
"""

import argparse
import random
import time
from datetime import datetime, timezone

from supabase_rest import SupabaseRest

SENSORS = [
    {
        "sensor_id": "6b1f0a2e-9c4d-4e8b-a7f3-2d5c8e1b4a10",
        "gps_lat": 3.8074,
        "gps_lng": 113.7698,
        "install_date": "2026-09-15",
        "label": "microclimate station, Niah Great Cave approach",
    },
    {
        "sensor_id": "d47c9b21-5f6a-4a3e-9c88-71b6e3f05d2c",
        "gps_lat": 3.7986,
        "gps_lng": 113.7764,
        "install_date": "2026-09-15",
        "label": "soil probe, trail-side monitoring plot",
    },
]

TEMP_BASE = 28.5
TEMP_RANGE = (24.0, 34.0)
HUM_BASE = 86.0
HUM_RANGE = (62.0, 96.0)
MOVEMENT_CHANCE = 0.03


def register_sensors(client):
    rows = [
        {
            "sensor_id": s["sensor_id"],
            "gps_lat": s["gps_lat"],
            "gps_lng": s["gps_lng"],
            "install_date": s["install_date"],
        }
        for s in SENSORS
    ]
    client.insert("sensors", rows, on_conflict="sensor_id")


class Walk:
    def __init__(self, rng, base, low, high, step):
        self.rng = rng
        self.value = base + rng.uniform(-step * 3, step * 3)
        self.low = low
        self.high = high
        self.step = step

    def next(self):
        self.value += self.rng.uniform(-self.step, self.step)
        self.value = min(self.high, max(self.low, self.value))
        return round(self.value, 1)


def build_reading(rng, walks, recorded_at):
    movement = rng.random() < MOVEMENT_CHANCE
    return {
        "temperature": walks["temperature"].next(),
        "humidity": walks["humidity"].next(),
        "movement": movement,
        "recorded_at": recorded_at,
    }


def main():
    parser = argparse.ArgumentParser(description="Plantiful simulated sensor feed")
    parser.add_argument("--interval", type=float, default=30.0,
                        help="seconds between pushes (default: 30)")
    parser.add_argument("--once", action="store_true",
                        help="push a single batch and exit")
    parser.add_argument("--seed", type=int, default=None,
                        help="random seed for a reproducible demo run")
    args = parser.parse_args()

    client = SupabaseRest()
    rng = random.Random(args.seed)
    walks = {
        "temperature": Walk(rng, TEMP_BASE, *TEMP_RANGE, step=0.4),
        "humidity": Walk(rng, HUM_BASE, *HUM_RANGE, step=1.5),
    }

    register_sensors(client)
    registered = ", ".join(s["sensor_id"][:8] for s in SENSORS)
    print(f"Registered {len(SENSORS)} simulated sensors: {registered}")

    try:
        while True:
            recorded_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
            readings = [
                dict(build_reading(rng, walks, recorded_at), sensor_id=s["sensor_id"])
                for s in SENSORS
            ]
            client.insert("sensor_readings", readings)
            summary = ", ".join(
                f"{r['sensor_id'][:8]} {r['temperature']}°C {r['humidity']}% "
                f"movement={'yes' if r['movement'] else 'no'}"
                for r in readings
            )
            print(f"{recorded_at} pushed {len(readings)} reading(s): {summary}")
            if args.once:
                break
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("Stopped.")


if __name__ == "__main__":
    main()
