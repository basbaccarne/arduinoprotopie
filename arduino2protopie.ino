/* 
this code is the basic Arduino code to receive some Protopie data over serial
by Bas Baccarne
*/

// To manage the incoming data from Protopie (a variable with a value), we need three things:
// 1. A struct to struct to capture incoming data
struct MessageValue {
  String message;
  String value;
};

// 2. A function to parse incoming Protopie data
struct MessageValue getMessage(String inputtedStr) {
  struct MessageValue result;
  char charArr[50];
  inputtedStr.toCharArray(charArr, 50);
  char* ptr = strtok(charArr, "||");
  result.message = String(ptr);
  ptr = strtok(NULL, "||");
  if (ptr == NULL) {
    result.value = String("");
    return result;
  }
  result.value = String(ptr);
  return result;
}

// 3. Declare MessageValue struct's instance for incoming protopie data
struct MessageValue receivedData;


void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}


void loop() {
  // Read message from serial
  while (Serial.available() > 0) {
    String receivedString = Serial.readStringUntil('\0');  // read until Serial buffer is empty
    receivedData = getMessage(receivedString);
  }

  // Check variable name and act when the right variable name is detected
  if (receivedData.message.equals("led")) {
    if (receivedData.value.equals("on")) {
      digitalWrite(LED_BUILTIN, HIGH);
    }
    if (receivedData.value.equals("off")) {
      digitalWrite(LED_BUILTIN, LOW);
    }
  }
}
