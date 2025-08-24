#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <SoftwareSerial.h>
#include <Arduino_JSON.h>
#include <string.h>

SoftwareSerial MCU(D2, D3);

const char* ssid = "SHAD";
const char* password = "home8521";

String token = "0000000000";
String baseHost = "https://rateto-backend.onrender.com/ESP8266/";
String host, updateHurtHost, updateGoodHost, userCodeHost;

int score = 0;
bool login = false;

void setup() {
  Serial.begin(9600);
  MCU.begin(4800);
  pinMode(D2, INPUT);
  pinMode(D3, OUTPUT);

  Serial.println("\nBooting up...");
  Serial.println(ESP.getResetReason());

  Serial.print("Connecting to ");
  Serial.println(ssid);

  connectWiFi();
  MCU.println("connected");
  confirm();

  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  delay(3000);

  Serial.println("Disconnected from WiFi");
}

void confirm(){
  Serial.print("Await");
  while(true){
    if (MCU.available()) {
      Serial.println("Listening...");
      String received = MCU.readStringUntil('\n');
      received.trim();
      if(received == "CONFIRMED"){
        return;
      }
    }
    delay(100);
    Serial.print(".");
  }
}

void loop() {
  if (MCU.available()) {
    Serial.println("Listening...");
    String received = MCU.readStringUntil('\n');
    received.trim();
    Serial.println("Received: " + received);

    if (!login || received.length() == 10) {
      bool isAllCaps = true;
      login = false;
      for (int i = 0; i < received.length(); i++) {
        char c = received.charAt(i);
        if (c < 'A' || c > 'Z') {
          isAllCaps = false;
          break;
        }
      }

      if(isAllCaps == false){
        token = received;
        setHosts(token);

        Serial.println(token);
        update(userCodeHost);
      }

      if (login) {
        Serial.println("YAYYYS");
        score = update(host);
        Serial.println(score);
        MCU.println(score);

      } 
      else {
        Serial.println("NOPE");
        MCU.println(11);
      }
      MCU.flush();
      return;
    }

    int message = received.toInt();
    Serial.println("Parsed Message: " + String(message));

    delay(2000);

    if (message == -10 || message == 10 || message == 20) {
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Reconnecting to WiFi...");
        connectWiFi();
      }

      if (message == 20) {
        score = update(host);
      } else if (message == -10) {
        score = update(updateHurtHost);
      } else if (message == 10) {
        score = update(updateGoodHost);
      }

      delay(100);
      MCU.println(score);
      MCU.flush();
      Serial.println("Updated Score: " + String(score));
    }
  }

  Serial.print(".");
  delay(100);
}

void setHosts(const String& token) {
  host = baseHost + "getUserScore/" + token;
  updateHurtHost = baseHost + "updateHurt/" + token;
  updateGoodHost = baseHost + "updateGood/" + token;
  userCodeHost = baseHost + "userCode/" + token;
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nFailed to connect to WiFi. Restarting...");
    ESP.restart();
  }
}

int update(const String& url) {
  WiFiClientSecure client;
  client.setInsecure(); // For dev/testing

  HTTPClient http;
  Serial.println("Request URL: " + url);

  if (http.begin(client, url)) {
    int httpCode = http.GET();

    if (httpCode > 0) {
      Serial.printf("HTTP GET request successful. Code: %d\n", httpCode);
      String payload = http.getString();
      Serial.println("Response:");
      Serial.println(payload);

      JSONVar myObject = JSON.parse(payload);

      if (JSON.typeof(myObject) == "undefined") {
        Serial.println("Failed to parse JSON");
        http.end();
        return 10;
      }

      if (myObject.hasOwnProperty("codeWork")) {
        bool codeWork = myObject["codeWork"];
        if (codeWork) {
          login = true;
        }
        Serial.println("Login response received.");
        delay(1000);
        http.end();
        return 0;
      }

      int score = myObject["score"];
      bool status = myObject["success"];

      Serial.println(score);
      Serial.println(status);

      http.end();

      if (status == 1) {
        return score;
      }
    } else {
      Serial.printf("HTTP GET request failed. Code: %d\n", httpCode);
    }
    http.end();
  } else {
    Serial.println("Failed to initialize HTTP connection.");
  }
  return 0;
}
