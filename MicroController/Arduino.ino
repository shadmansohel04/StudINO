#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>
#include <string.h>
#include <Keypad.h>
#include <avr/wdt.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
SoftwareSerial UNO(12, 11);

const byte ROW_NUM    = 4;
const byte COLUMN_NUM = 4;

char keys[ROW_NUM][COLUMN_NUM] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

byte pin_rows[ROW_NUM]    = {7, 6, 5, 4};
byte pin_column[COLUMN_NUM] = {3, 2, 9, 8};
Keypad keypad = Keypad(makeKeymap(keys), pin_rows, pin_column, ROW_NUM, COLUMN_NUM);
char userCode[11];

const int PIR = 13;
const int ledPin = 13;
int PIRstate = 0;
int wifiData = 0;
int counter = 0;
String message = "Study";
String lastMessage = "";
unsigned long lastTenMinCheck = 0;
const unsigned long tenMinutes = 1200000;

void setup() {
  Serial.begin(9600);
  UNO.begin(4800);

  // DISPLAY
  pinMode(ledPin, OUTPUT);

  // SENSOR
  pinMode(PIR, INPUT);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  delay(2000);
  lcd.print("Connecting...");

  awaiting();
  UNO.println("CONFIRMED");

  login();
  Serial.println("raaaa");
  Serial.println(wifiData);
  lcd.clear();

  delay(1000);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connected");

  Serial.println(wifiData);
  lcd.setCursor(0, 1);
  lcd.print("Data: ");
  lcd.print(wifiData);

  delay(5000);
  lcd.clear();
}

void awaiting(){
  Serial.println("awaiting");
  while(true){
    if (UNO.available()) {
      String received = UNO.readStringUntil('\n');
      received.trim();  
      if(received == "connected"){
        return;
      }
    }
    Serial.println("_ ");
    delay(100);
  }
}

void login() {
  memset(userCode, '\0', sizeof(userCode));
  int i = 0;
  lcd.clear();
  bool looper = false;
  lcd.print("Enter code");

  while(true) {
    char key = keypad.getKey();

    if (key && i < 10) { 
      if(key == '#'){
        looper = true;
        break;
      }
      lcd.setCursor(0, 0);
      lcd.clear();
      Serial.println(key);
      userCode[i] = key; 
      i += 1; 
      userCode[i] = '\0';
      lcd.print(userCode);
    }

    else if (i >= 10) {
      break;
    }

  }
  
  if(looper){
    looper = false;
    login();
  }

  UNO.println(userCode);
  UNO.flush();
  int valid = 0;

  Serial.println(userCode);
  while (true) {
    if (UNO.available() > 0) {
      valid = UNO.parseInt();
      Serial.println(valid);

      if (valid == 11 || valid == -50){
        Serial.println("WHWYWYW");
        looper = true;
        break;
      }
      else if (valid != 0){
        Serial.println("HAHAHAHA");
        wifiData = valid;
        return;
      }

    }
    Serial.print(".");
    delay(500);
  }

  if(looper){
    looper = false;
    login();
  }

}


void retrieveScore() {
  while (true) {
    if (UNO.available() > 0) {
      wifiData = UNO.parseInt();
      Serial.println(wifiData);

      if(wifiData == -50){
        softwareReset();
      }
      else if (wifiData != 0) {
        break;
      }
    }
    Serial.print(".");
    delay(500);
  }
}

void update(int tag) {
  UNO.println(tag);
  UNO.flush();

  retrieveScore();
}

void loop() {

  if (millis() - lastTenMinCheck >= tenMinutes) {
    lastTenMinCheck = millis();

    Serial.println("🔔 10-minute check-in!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("10-min check-in");
    update(10);
    lcd.clear();
    lcd.print("Back to it!");
  }

  if (counter >= 40) {
    message = "Im snitching";
    Serial.println("noooo");
    update(-10);
    counter = 0;
  } 
  else if (counter >= 20) {
    message = "Get back to work...";
  }

  PIRstate = digitalRead(PIR);

  if (PIRstate == HIGH) {
    counter = 0;
    message = "Study score: " + String(wifiData);
  } 
  else {
    counter += 1;
  }

  if (message != lastMessage) {
    lcd.setCursor(0, 0);
    lcd.print("                ");
    lcd.setCursor(0, 0);
    lcd.print(message);
    lastMessage = message;
  }

  delay(500);
}

void softwareReset() {
  delay(1000);
  lcd.clear();
  lcd.print("Relogin");
  UNO.println("RES");
  delay(1000);

  wdt_enable(WDTO_15MS); 
  while (1);
}

