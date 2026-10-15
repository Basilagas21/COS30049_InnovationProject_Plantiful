#include <DHT.h>
#include <math.h>

// ==========================================
// PLANTIFUL IoT SENSOR MONITORING
// ESP32-WROOM-32
// Sensors: DHT11, PIR, soil moisture, rain
// Output: LED (PIR indicator)
// ==========================================

// PIN CONFIGURATION
#define DHT_PIN   4
#define DHT_TYPE  DHT11
#define PIR_PIN   27
#define LED_PIN   26
#define SOIL_PIN  34   // ADC1, input only
#define RAIN_PIN  35   // ADC1

// NODE IDENTITY
// The sensors row this node reports under. Must exist in Supabase before the
// bridge can insert readings (iot/bridge.py registers it on startup).
#define SENSOR_ID "b7e2c4a1-8d3f-4c6b-9a2e-5f1d8c3e7b90"

DHT dht(DHT_PIN, DHT_TYPE);

// ==========================================
// CALIBRATION
// Dry values come from your own readings.
// Wet values are placeholders, replace them after testing:
// soil probe in a glass of water, and a few drops on the rain plate.
// If a percentage moves the wrong way, swap that sensor's dry and wet values.
// ==========================================
const int SOIL_DRY = 4095;
const int SOIL_WET = 1750;
const int RAIN_DRY = 4095;
const int RAIN_WET = 2500;

// STATUS THRESHOLDS (percent)
const int SOIL_DRY_BELOW   = 30;  // below this = DRY
const int SOIL_MOIST_BELOW = 60;  // below this = MOIST, otherwise WET
const int RAIN_WET_ABOVE   = 20;  // above this = WET

// TIMING SETTINGS
const unsigned long REPORT_INTERVAL = 4000;
const unsigned long PIR_WARMUP = 60000;

// PIR VARIABLES
unsigned long totalMotionEvents = 0;
unsigned long periodMotionEvents = 0;
unsigned long lastReport = 0;
unsigned long reportCount = 0;

int previousMotion = LOW;

// DHT11 VARIABLES
float previousTemp = NAN;
float previousHumidity = NAN;

// ==========================================
// ANALOG HELPERS
// ==========================================

// Average several samples to reduce ADC noise
int readAveraged(int pin) {
  long sum = 0;
  for (int i = 0; i < 16; i++) {
    sum += analogRead(pin);
    delayMicroseconds(500);
  }
  return (int)(sum / 16);
}

// Convert a raw ADC value to 0-100 percent
int toPercent(int raw, int dryValue, int wetValue) {
  int pct = map(raw, dryValue, wetValue, 0, 100);
  return constrain(pct, 0, 100);
}

// A reading stuck at ground usually means a wiring problem.
// 4095 is NOT a fault, because a dry sensor reads that value.
bool rawLooksFaulty(int raw) {
  return (raw <= 20);
}

// ==========================================
// PRINT TABLE HEADER
// ==========================================

void printHeader() {
  Serial.println();
  Serial.println("======================================================================================================================================================");
  Serial.println("                                                         PLANTIFUL SENSOR QA/QC");
  Serial.println("======================================================================================================================================================");
  Serial.println("Time(s) | Temp(C) | Hum(%) | Temp Chg | Hum Chg | PIR  | LED  | Events | Period | DHT QC   | Soil raw | Soil% | Soil  | Rain raw | Rain% | Rain");
  Serial.println("------------------------------------------------------------------------------------------------------------------------------------------------------");
}

// ==========================================
// SETUP
// ==========================================

void setup() {
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Full 0 to 3.3 V range on the analog inputs, 12-bit (0-4095)
  analogReadResolution(12);
  analogSetPinAttenuation(SOIL_PIN, ADC_11db);
  analogSetPinAttenuation(RAIN_PIN, ADC_11db);

  dht.begin();

  previousMotion = digitalRead(PIR_PIN);
  lastReport = millis();

  Serial.println();
  Serial.println("PLANTIFUL IoT SENSOR MONITORING");
  Serial.println("Board: ESP32-WROOM-32");
  Serial.println("Sensors: DHT11 + PIR + Soil moisture + Rain");
  Serial.println("Output: External LED (PIR Indicator)");
  Serial.println("Report interval: 4 seconds");
  Serial.println("PIR warm-up: 60 seconds");

  printHeader();
}

// ==========================================
// MAIN LOOP
// ==========================================

void loop() {
  unsigned long now = millis();

  // ========================================
  // 1. CONTINUOUS PIR MONITORING
  // ========================================

  int motion = digitalRead(PIR_PIN);
  bool pirReady = now >= PIR_WARMUP;

  // LED follows PIR after warm-up
  digitalWrite(LED_PIN, (pirReady && motion == HIGH) ? HIGH : LOW);

  // Count LOW -> HIGH transitions
  if (pirReady && motion == HIGH && previousMotion == LOW) {
    totalMotionEvents++;
    periodMotionEvents++;
  }

  previousMotion = motion;

  // ========================================
  // 2. REPORT EVERY 4 SECONDS
  // ========================================

  if (now - lastReport >= REPORT_INTERVAL) {
    lastReport = now;

    // ======================================
    // 3. READ DHT11
    // ======================================

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    bool readOK = !isnan(temperature) && !isnan(humidity);

    bool tempOK = readOK && temperature >= 0 && temperature <= 50;
    bool humidityInRange = readOK && humidity >= 20 && humidity <= 90;
    bool humidityHigh = readOK && humidity > 90;

    // ======================================
    // 4. CALCULATE DHT11 CHANGES
    // ======================================

    float tempChange = NAN;
    float humidityChange = NAN;
    bool suddenChange = false;

    if (readOK && !isnan(previousTemp) && !isnan(previousHumidity)) {
      tempChange = temperature - previousTemp;
      humidityChange = humidity - previousHumidity;

      if (fabs(tempChange) > 5.0 || fabs(humidityChange) > 15.0) {
        suddenChange = true;
      }
    }

    // ======================================
    // 5. DHT11 QA/QC VALIDATION
    // ======================================

    const char* dhtQC;

    if (!readOK) {
      dhtQC = "READ ERR";
    } else if (!tempOK) {
      dhtQC = "FAIL";
    } else if (humidityHigh) {
      dhtQC = "HIGH RH";   // above DHT11 spec, common in humid caves
    } else if (!humidityInRange) {
      dhtQC = "FAIL";
    } else if (suddenChange) {
      dhtQC = "CHECK";
    } else {
      dhtQC = "PASS";
    }

    // ======================================
    // 6. READ SOIL AND RAIN
    // ======================================

    int soilRaw = readAveraged(SOIL_PIN);
    int rainRaw = readAveraged(RAIN_PIN);

    int soilPct = toPercent(soilRaw, SOIL_DRY, SOIL_WET);
    int rainPct = toPercent(rainRaw, RAIN_DRY, RAIN_WET);

    const char* soilStatus;
    if (rawLooksFaulty(soilRaw)) {
      soilStatus = "ERR";
    } else if (soilPct < SOIL_DRY_BELOW) {
      soilStatus = "DRY";
    } else if (soilPct < SOIL_MOIST_BELOW) {
      soilStatus = "MOIST";
    } else {
      soilStatus = "WET";
    }

    const char* rainStatus;
    if (rawLooksFaulty(rainRaw)) {
      rainStatus = "ERR";
    } else if (rainPct > RAIN_WET_ABOVE) {
      rainStatus = "WET";
    } else {
      rainStatus = "DRY";
    }

    // ======================================
    // 7. FORMAT DHT11 VALUES
    // ======================================

    char tempText[12];
    char humidityText[12];
    char tempChangeText[12];
    char humidityChangeText[12];

    if (isnan(temperature)) {
      snprintf(tempText, sizeof(tempText), "N/A");
    } else {
      snprintf(tempText, sizeof(tempText), "%.1f", temperature);
    }

    if (isnan(humidity)) {
      snprintf(humidityText, sizeof(humidityText), "N/A");
    } else {
      snprintf(humidityText, sizeof(humidityText), "%.1f", humidity);
    }

    if (isnan(tempChange)) {
      snprintf(tempChangeText, sizeof(tempChangeText), "N/A");
    } else {
      snprintf(tempChangeText, sizeof(tempChangeText), "%+.1f", tempChange);
    }

    if (isnan(humidityChange)) {
      snprintf(humidityChangeText, sizeof(humidityChangeText), "N/A");
    } else {
      snprintf(humidityChangeText, sizeof(humidityChangeText), "%+.1f", humidityChange);
    }

    // ======================================
    // 8. PIR AND LED STATUS
    // ======================================

    const char* pirStatus;

    if (!pirReady) {
      pirStatus = "WARM";
    } else {
      pirStatus = (motion == HIGH) ? "ON" : "OFF";
    }

    const char* ledStatus = (pirReady && motion == HIGH) ? "ON" : "OFF";

    // ======================================
    // 9. PRINT COMBINED TABLE
    // ======================================

    if (reportCount > 0 && reportCount % 10 == 0) {
      printHeader();
    }

    char line[240];

    snprintf(
      line,
      sizeof(line),
      "%7lu | %7s | %6s | %8s | %7s | %-4s | %-4s | %6lu | %6lu | %-8s | %8d | %5d | %-5s | %8d | %5d | %-5s",
      now / 1000,
      tempText,
      humidityText,
      tempChangeText,
      humidityChangeText,
      pirStatus,
      ledStatus,
      totalMotionEvents,
      periodMotionEvents,
      dhtQC,
      soilRaw,
      soilPct,
      soilStatus,
      rainRaw,
      rainPct,
      rainStatus
    );

    Serial.println(line);

    // ======================================
    // 9b. EMIT MACHINE-READABLE JSON
    // ======================================
    // One "DATA {json}" line per reading, consumed by iot/bridge.py over USB.
    // This is the same payload the MQTT path would publish, so the transport
    // can change without touching the rest of the pipeline. The node has no
    // clock, so the bridge stamps recorded_at when the line arrives.

    char temperatureJson[12];
    char humidityJson[12];
    char soilJson[8];
    char rainJson[8];

    if (isnan(temperature)) {
      snprintf(temperatureJson, sizeof(temperatureJson), "null");
    } else {
      snprintf(temperatureJson, sizeof(temperatureJson), "%.1f", temperature);
    }

    if (isnan(humidity)) {
      snprintf(humidityJson, sizeof(humidityJson), "null");
    } else {
      snprintf(humidityJson, sizeof(humidityJson), "%.1f", humidity);
    }

    if (rawLooksFaulty(soilRaw)) {
      snprintf(soilJson, sizeof(soilJson), "null");
    } else {
      snprintf(soilJson, sizeof(soilJson), "%d", soilPct);
    }

    if (rawLooksFaulty(rainRaw)) {
      snprintf(rainJson, sizeof(rainJson), "null");
    } else {
      snprintf(rainJson, sizeof(rainJson), "%s", rainPct > RAIN_WET_ABOVE ? "true" : "false");
    }

    bool movementDetected = pirReady && (motion == HIGH || periodMotionEvents > 0);

    char json[224];
    snprintf(
      json,
      sizeof(json),
      "DATA {\"sensor_id\":\"%s\",\"temperature\":%s,\"humidity\":%s,\"movement\":%s,\"soil_moisture\":%s,\"rain\":%s,\"uptime_ms\":%lu}",
      SENSOR_ID,
      temperatureJson,
      humidityJson,
      movementDetected ? "true" : "false",
      soilJson,
      rainJson,
      now
    );

    Serial.println(json);

    // ======================================
    // 10. UPDATE PREVIOUS READINGS
    // ======================================

    if (readOK) {
      previousTemp = temperature;
      previousHumidity = humidity;
    } else {
      previousTemp = NAN;
      previousHumidity = NAN;
    }

    periodMotionEvents = 0;
    reportCount++;
  }
}