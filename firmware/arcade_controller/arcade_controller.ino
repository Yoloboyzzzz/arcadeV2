/*
  Arcade Controller — ESP32 BLE Keyboard
  ---------------------------------------
  Presents itself to the phone as a Bluetooth LE keyboard named "Arcade Pad".
  6 buttons wired to GPIO pins (INPUT_PULLUP, active-low) map to keys the
  Neon Arcade website listens for. No custom pairing UI needed on the
  website — pair once in the phone's Bluetooth settings like any keyboard.

  Library required (Arduino Library Manager):
    "ESP32 BLE Keyboard" by T-vK
    https://github.com/T-vK/ESP32-BLE-Keyboard

  Board: any ESP32 dev board (Arduino-ESP32 core installed via Boards Manager).

  Wiring: each button between the listed GPIO and GND. Internal pull-ups
  are enabled in software, so no external resistors needed.

  Key mapping (must match js/input.js on the website):
    LEFT     -> Arrow Left
    RIGHT    -> Arrow Right
    UP       -> Arrow Up
    DOWN     -> Arrow Down
    ACTION 1 -> 'z'
    ACTION 2 -> 'x'
*/

#include <BleKeyboard.h>

// ---- Pin assignment — change to match your wiring ----
const int PIN_LEFT = 2;
const int PIN_RIGHT = 3;
const int PIN_UP = 4;
const int PIN_DOWN = 6;
const int PIN_A = 7; // Action 1
const int PIN_B = 9; // Action 2

struct Button {
  const char *name;
  int pin;
  uint8_t key;      // key code sent over BLE HID
  bool lastRaw;     // last raw (debounced-pending) reading
  bool state;       // debounced state (true = pressed)
  unsigned long lastChange;
};

Button buttons[] = {
  { "LEFT", PIN_LEFT, KEY_LEFT_ARROW, false, false, 0 },
  { "RIGHT", PIN_RIGHT, KEY_RIGHT_ARROW, false, false, 0 },
  { "UP", PIN_UP, KEY_UP_ARROW, false, false, 0 },
  { "DOWN", PIN_DOWN, KEY_DOWN_ARROW, false, false, 0 },
  { "ACTION 1", PIN_A, 'z', false, false, 0 },
  { "ACTION 2", PIN_B, 'x', false, false, 0 },
};
const int NUM_BUTTONS = sizeof(buttons) / sizeof(buttons[0]);
const unsigned long DEBOUNCE_MS = 15;

BleKeyboard bleKeyboard("Arcade Pad", "Fablab", 100);

void setup() {
  Serial.begin(115200);
  unsigned long serialWaitStart = millis();
  while (!Serial && (millis() - serialWaitStart) < 3000) {
    delay(10); // give the USB CDC connection a moment to enumerate
  }
  for (int i = 0; i < NUM_BUTTONS; i++) {
    pinMode(buttons[i].pin, INPUT_PULLUP);
  }
  bleKeyboard.begin();
  Serial.println("Arcade Pad booting — waiting for BLE pairing...");
  Serial.println("TEST: serial output is working!");
}

void loop() {
  bool connected = bleKeyboard.isConnected();
  unsigned long now = millis();

  for (int i = 0; i < NUM_BUTTONS; i++) {
    Button &b = buttons[i];
    bool raw = digitalRead(b.pin) == LOW; // active-low (pressed = LOW)

    if (raw != b.lastRaw) {
      b.lastChange = now;
      b.lastRaw = raw;
    }

    if ((now - b.lastChange) > DEBOUNCE_MS && raw != b.state) {
      b.state = raw;
      Serial.printf("%s %s\n", b.name, b.state ? "pressed" : "released");
      if (connected) {
        if (b.state) {
          bleKeyboard.press(b.key);
        } else {
          bleKeyboard.release(b.key);
        }
      }
    }
  }

  delay(4); // light polling delay, keeps debounce timing accurate
}
