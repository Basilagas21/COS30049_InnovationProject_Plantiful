
#include <DHT.h>
#include <math.h>

// ==========================================
// PLANTIFUL IoT SENSOR MONITORING
// ESP32-WROOM-32
// ==========================================

// PIN CONFIGURATION
#define DHT_PIN 4
#define DHT_TYPE DHT11
#define PIR_PIN 27
#define LED_PIN 26

DHT dht(DHT_PIN, DHT_TYPE);

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
// PRINT TABLE HEADER
// ==========================================

void printHeader() {
  Serial.println();
  Serial.println("====================================================================================================");
  Serial.println("                                  PLANTIFUL SENSOR QA/QC");
  Serial.println("====================================================================================================");
  Serial.println("Time(s) | Temp(C) | Hum(%) | Temp Change | Hum Change | PIR  | LED(PIR) | Events | Period | DHT QC");
  Serial.println("----------------------------------------------------------------------------------------------------");
}

// ==========================================
// SETUP
// ==========================================

void setup() {
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(LED_PIN, LOW);
  dht.begin();

  previousMotion = digitalRead(PIR_PIN);
  lastReport = millis();

  Serial.println();
  Serial.println("PLANTIFUL IoT SENSOR MONITORING");
  Serial.println("Board: ESP32-WROOM-32");
  Serial.println("Sensors: DHT11 + PIR");
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
  digitalWrite(
    LED_PIN,
    (pirReady && motion == HIGH) ? HIGH : LOW
  );

  // Count LOW -> HIGH transitions
  if (pirReady &&
      motion == HIGH &&
      previousMotion == LOW) {

    totalMotionEvents++;
    periodMotionEvents++;
  }

  previousMotion = motion;

  // ========================================
  // 2. REPORT EVERY 4 SECONDS
  // ========================================

  if (now - lastReport >= REPORT_INTERVAL) {
    lastReport = now;

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    bool readOK =
      !isnan(temperature) &&
      !isnan(humidity);

    // Typical DHT11 measurement range
    bool rangeOK =
      readOK &&
      temperature >= 0 &&
      temperature <= 50 &&
      humidity >= 20 &&
      humidity <= 90;

    // ======================================
    // 3. CALCULATE SENSOR CHANGES
    // ======================================

    float tempChange = NAN;
    float humidityChange = NAN;
    bool suddenChange = false;

    if (readOK &&
        !isnan(previousTemp) &&
        !isnan(previousHumidity)) {

      tempChange = temperature - previousTemp;
      humidityChange = humidity - previousHumidity;

      if (fabs(tempChange) > 5.0 ||
          fabs(humidityChange) > 15.0) {
        suddenChange = true;
      }
    }

    // ======================================
    // 4. DHT11 QA/QC VALIDATION
    // ======================================

    const char* dhtQC;

    if (!readOK) {
      dhtQC = "READ ERR";
    }
    else if (!rangeOK) {
      dhtQC = "FAIL";
    }
    else if (suddenChange) {
      dhtQC = "CHECK";
    }
    else {
      dhtQC = "PASS";
    }

    // ======================================
    // 5. FORMAT SENSOR VALUES
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
    // 6. PIR AND LED STATUS
    // ======================================

    const char* pirStatus;

    if (!pirReady) {
      pirStatus = "WARM";
    } else {
      pirStatus = (motion == HIGH) ? "ON" : "OFF";
    }

    const char* ledStatus =
      (pirReady && motion == HIGH) ? "ON" : "OFF";

    // ======================================
    // 7. PRINT COMBINED TABLE
    // ======================================

    if (reportCount > 0 &&
        reportCount % 10 == 0) {
      printHeader();
    }

    char line[200];

    snprintf(
      line,
      sizeof(line),
      "%7lu | %7s | %6s | %11s | %10s | %-4s | %-8s | %6lu | %6lu | %s",
      now / 1000,
      tempText,
      humidityText,
      tempChangeText,
      humidityChangeText,
      pirStatus,
      ledStatus,
      totalMotionEvents,
      periodMotionEvents,
      dhtQC
    );

    Serial.println(line);

    // ======================================
    // 8. UPDATE PREVIOUS READINGS
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
