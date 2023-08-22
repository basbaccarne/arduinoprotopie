/* 
Code for the zomerwijs workshop
Set-up Arduino as described in rhe comments below
by Bas Baccarne

input: grove rotary sensor  - variable name "rotary"  // values 0 to 100                          // connected to A0     
input: button               - variable name "button"  // values 0 (pressed) or 1 (unpressed)      // connected to D4
input: grove thumb joystick - variable name "thumb"   // values "up", "down", "left" & "right"    // connected to A2 & A3
output: neopixel ledring    - variable name "ledring" // values 0 to 24                           // conntected to D2
*/

// libraries
#include "Adafruit_NeoPixel.h" // to control the ledring
#include "string.h" // to manage the incoming serial data (character)

// variables for the rotary sensor (connected to A0)
#define ROTARY_ANGLE_SENSOR A0
#define ADC_REF 5
#define GROVE_VCC 5
#define FULL_ANGLE 300
float old_angle;

// variables for the button (connected to D4)
#define BUTTON_PIN 4
float old_button;

// variables for the thumb joystick (connected to A2 and A3)
#define THUMBY A2
#define THUMBX A3
int thumb_threshold = 50; // increase if you want to increase sensitivity
int thumb_calibrated = 0;
int thumb_center = 350;

// variables for the neopixel ledring (connected to D2)
#define PIXEL_PIN   2
#define PIXEL_COUNT 16
Adafruit_NeoPixel strip = Adafruit_NeoPixel(PIXEL_COUNT, PIXEL_PIN, NEO_GRB + NEO_KHZ800);
uint32_t color = strip.Color(75, 250, 100); // change color here if you want

// manage incoming protopie message 1: declare struct to capture incoming data
struct MessageValue {
  String message;
  String value;
};

// manage incoming protopie message 2: declare function to parse incoming protopie data
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

// manage incoming protopie message 3: declare MessageValue struct's instance for incoming protopie data
struct MessageValue receivedData;

///////////////////////
void setup()
//////////////////////
{
    // start serial communication
    Serial.begin(9600);
    Serial.setTimeout(10); 

    // initiate input: rotary sensor
    pinMode(ROTARY_ANGLE_SENSOR, INPUT);

    // initiate input: button
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // initiate input: thumb joystick
    pinMode(THUMBX, INPUT);
    pinMode(THUMBY, INPUT);

    // initiate output: neopixel led ring
    strip.setBrightness(155); // set brightness on a scale from 0 to255
    strip.begin();
    strip.show(); // initialize all pixels to 'off'
}

//////////////////////
void loop()
//////////////////////
{   
    // input: read value of the rotary angle sensor
    float voltage;
    int sensor_value = analogRead(ROTARY_ANGLE_SENSOR);
    voltage = (float)sensor_value*ADC_REF/1023;
    float degrees = (voltage*FULL_ANGLE)/GROVE_VCC;
    float angle = ceil(degrees/ 215 * 100);

    // input: send value of the sensor to protopie if value changes (format: variable_name||value)
    if(old_angle != angle){
      Serial.print("rotary||");
      Serial.println(angle, 0);
      old_angle = angle;
      delay(10);
    }

    // input: send value of the button to protopie
    float button = digitalRead(BUTTON_PIN); // 1 is unpressed, 0 is pressed

    // input: send value of the button to protopie if value changes
    if(old_button != button){
      Serial.print("button||");
      Serial.println(button);
      old_button = button;
      delay(10);
    }

    // input: send command (up down lefgt right from the thumb joystick)
    int thumb_x = analogRead(A2);
    int thumb_y = analogRead(A3);

    if(thumb_calibrated != 1){
      thumb_center = thumb_x;
      thumb_calibrated = 1;
    }
    if(thumb_x < thumb_center-thumb_threshold){Serial.println("thumb||up");}
    if(thumb_x > thumb_center+thumb_threshold){Serial.println("thumb||down");}
    if(thumb_y < thumb_center-thumb_threshold){Serial.println("thumb||left");}
    if(thumb_y > thumb_center+thumb_threshold){Serial.println("thumb||right");}

    // output: read message from serial
    while (Serial.available() > 0) {
      String receivedString = Serial.readStringUntil('\0'); // read until Serial buffer is empty
      receivedData = getMessage(receivedString);
    }
   
    // output: check variable name and act when the right variable name is detected (in this case: "ledring" is sent by protopie)
      if(receivedData.message.equals("ledring")){
        // fill the ledring from led n° 0 to the value of the variable "ledring"
        strip.clear();
        strip.fill(color, 0, receivedData.value.toInt());
        strip.show();  
      }
}
