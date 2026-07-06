# EPD-nRF5 Web Controller (epd-web) - Code Analysis & Upgrade Recommendations

This document outlines the architecture of the recently integrated `epd-web` tool, examines similar open-source projects in the E-Paper/ESL (Electronic Shelf Label) space, and provides concrete recommendations for future features.

---

## 1. Codebase Architecture

The integrated code in [public/epd-web](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web) is a static client-side web utility that communicates with E-Paper Displays (EPD) driven by nRF51/nRF52 microcontrollers (running the `tsl0922/EPD-nRF5` firmware). 

### File Breakdown
*   [index.html](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/index.html): Configures the interface layout, including collapsible controls for BLE connection, device driver setup, Note Mode (Ghi chú & Đếm ngược), Timetable Mode (Thời khóa biểu), Paint Mode, and Crop Tools.
*   [main.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/main.js): Orchestrates GATT Bluetooth handshakes, packet division for transmissions, sleep schedule configuration, and MTU synchronization.
*   [dithering.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/dithering.js): Contains image dithering algorithms (Floyd-Steinberg, Atkinson, Sierra, etc.) to optimize colorful graphics for 1-bit B/W, 3-color (Black/White/Red), or 4-color displays.
*   [paint.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/paint.js): Handles canvas drawings and pixel extraction for custom designs.
*   [crop.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/crop.js): Implements zooming and shifting of canvas selections.
*   [epd-note.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/epd-note.js): Combines user-entered text, fonts, line spacing, and event date countdowns into a 400x300 canvas matrix.
*   [epd-timetable.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/epd-timetable.js): Renders a custom grid schedule table (Excel style) onto the canvas.

### Bluetooth BLE Protocol Specs
*   **Service UUID**: `62750001-d828-918d-fb46-b6c11c675aec`
*   **Write/Data Characteristic**: `62750002-d828-918d-fb46-b6c11c675aec` (Sends formatted buffers, drawings, and setup commands)
*   **Version Characteristic**: `62750003-d828-918d-fb46-b6c11c675aec` (Reads the tag's current firmware version code)
*   **Target Device Filter**: Scan looks specifically for Bluetooth devices with a name starting with `'NRF'`.

---

## 2. Similar E-Paper / ESL Hacking Projects
By researching the developer community, we identified several adjacent firmware and web integration designs for E-Paper Shelf Labels:

1.  **[ATC_TLSR_Paper](https://github.com/atc1441/ATC_TLSR_Paper)**:
    - Target: Hanshow and other cheap ESLs using the Telink TLSR8359 chip.
    - Concept: Custom BLE firmware allowing direct connection from browsers via WebBluetooth.
2.  **[OpenEPaperLink](https://github.com/OpenEPaperLink/Home_Assistant_Integration)**:
    - Target: ZBS243-based shelf labels (using custom Zigbee/2.4GHz RF).
    - Concept: Connects tags to a local central hub (typically an ESP32 bridge/gateway). Extremely popular for Home Assistant integrations.
3.  **[gicisky-tag](https://github.com/fpoli/gicisky-tag)**:
    - Target: Bluetooth ESL tags sold by Picksmart/Gicisky.
    - Concept: Python scripts to format and transmit image payloads to the device without modifying its factory firmware.

---

## 3. Recommended Application Upgrades

Integrating the EPD controller directly into our stock management dashboard opens up unique opportunities. Here are proposals to expand this feature:

### 💡 Recommendation 1: Real-Time Vietnamese Stock Board Tag
Create an automated template that converts our Firestore stock watchlist or the active VN-Index charts into a clean e-paper dashboard:
- **Layout**: Current VN-Index value, percentage change, and top 3 watchlist symbols (Symbol, Price, Change %).
- **Implementation**: Canvas-drawn dashboard rendered on the hidden parent state, transmitted directly to the E-Ink display via the `epdCharacteristic` channel.

### 💡 Recommendation 2: Automated Smart Home Weather / Clock Station
Utilize the built-in weather feature to sync coordinates from the parent application:
- Auto-pull real-time weather from OpenWeatherMap (or another API) based on location and compile it into a visual widget (temp, humidity, icon) alongside the clock display.

### 💡 Recommendation 3: Saved Templates Library in Firestore
Allow saving custom designs, schedules, or notes to Firestore:
- Instead of keeping templates localized in the EPD iframe, serialize the note/timetable canvases to a JSON layout (or base64 format) and sync them in a new Firestore collection `epd_templates`. This allows users to reload previous designs instantly across devices.

### 💡 Recommendation 4: Localized Gateway Integration (Node-RED/ESP32)
For persistent background updates (which WebBluetooth cannot do since it requires active user interaction inside a browser tab):
- Integrate a simple REST client pointing to a local ESP32 gateway. The gateway acts as a bridge, fetching the latest VN-Index / Stock data from our Firebase database and automatically updating the e-paper tag every 15 minutes.

# EPD-nRF5 Web Controller (epd-web) - Code Analysis & Upgrade Recommendations

This document outlines the architecture of the recently integrated `epd-web` tool, examines similar open-source projects in the E-Paper/ESL (Electronic Shelf Label) space, and provides concrete recommendations for future features.

---

## 1. Codebase Architecture

The integrated code in [public/epd-web](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web) is a static client-side web utility that communicates with E-Paper Displays (EPD) driven by nRF51/nRF52 microcontrollers (running the `tsl0922/EPD-nRF5` firmware). 

### File Breakdown
*   [index.html](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/index.html): Configures the interface layout, including collapsible controls for BLE connection, device driver setup, Note Mode (Ghi chú & Đếm ngược), Timetable Mode (Thời khóa biểu), Paint Mode, and Crop Tools.
*   [main.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/main.js): Orchestrates GATT Bluetooth handshakes, packet division for transmissions, sleep schedule configuration, and MTU synchronization.
*   [dithering.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/dithering.js): Contains image dithering algorithms (Floyd-Steinberg, Atkinson, Sierra, etc.) to optimize colorful graphics for 1-bit B/W, 3-color (Black/White/Red), or 4-color displays.
*   [paint.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/paint.js): Handles canvas drawings and pixel extraction for custom designs.
*   [crop.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/crop.js): Implements zooming and shifting of canvas selections.
*   [epd-note.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/epd-note.js): Combines user-entered text, fonts, line spacing, and event date countdowns into a 400x300 canvas matrix.
*   [epd-timetable.js](file:///Volumes/Setup/Code/React/NewStockManagement/public/epd-web/js/epd-timetable.js): Renders a custom grid schedule table (Excel style) onto the canvas.

### Bluetooth BLE Protocol Specs
*   **Service UUID**: `62750001-d828-918d-fb46-b6c11c675aec`
*   **Write/Data Characteristic**: `62750002-d828-918d-fb46-b6c11c675aec` (Sends formatted buffers, drawings, and setup commands)
*   **Version Characteristic**: `62750003-d828-918d-fb46-b6c11c675aec` (Reads the tag's current firmware version code)
*   **Target Device Filter**: Scan looks specifically for Bluetooth devices with a name starting with `'NRF'`.

---

## 2. Similar E-Paper / ESL Hacking Projects
By researching the developer community, we identified several adjacent firmware and web integration designs for E-Paper Shelf Labels:

1.  **[ATC_TLSR_Paper](https://github.com/atc1441/ATC_TLSR_Paper)**:
    - Target: Hanshow and other cheap ESLs using the Telink TLSR8359 chip.
    - Concept: Custom BLE firmware allowing direct connection from browsers via WebBluetooth.
2.  **[OpenEPaperLink](https://github.com/OpenEPaperLink/Home_Assistant_Integration)**:
    - Target: ZBS243-based shelf labels (using custom Zigbee/2.4GHz RF).
    - Concept: Connects tags to a local central hub (typically an ESP32 bridge/gateway). Extremely popular for Home Assistant integrations.
3.  **[gicisky-tag](https://github.com/fpoli/gicisky-tag)**:
    - Target: Bluetooth ESL tags sold by Picksmart/Gicisky.
    - Concept: Python scripts to format and transmit image payloads to the device without modifying its factory firmware.

---

## 3. Recommended Application Upgrades

Integrating the EPD controller directly into our stock management dashboard opens up unique opportunities. Here are proposals to expand this feature:

### 💡 Recommendation 1: Real-Time Vietnamese Stock Board Tag
Create an automated template that converts our Firestore stock watchlist or the active VN-Index charts into a clean e-paper dashboard:
- **Layout**: Current VN-Index value, percentage change, and top 3 watchlist symbols (Symbol, Price, Change %).
- **Implementation**: Canvas-drawn dashboard rendered on the hidden parent state, transmitted directly to the E-Ink display via the `epdCharacteristic` channel.

### 💡 Recommendation 2: Automated Smart Home Weather / Clock Station
Utilize the built-in weather feature to sync coordinates from the parent application:
- Auto-pull real-time weather from OpenWeatherMap (or another API) based on location and compile it into a visual widget (temp, humidity, icon) alongside the clock display.

### 💡 Recommendation 3: Saved Templates Library in Firestore
Allow saving custom designs, schedules, or notes to Firestore:
- Instead of keeping templates localized in the EPD iframe, serialize the note/timetable canvases to a JSON layout (or base64 format) and sync them in a new Firestore collection `epd_templates`. This allows users to reload previous designs instantly across devices.

### 💡 Recommendation 4: Localized Gateway Integration (Node-RED/ESP32)
For persistent background updates (which WebBluetooth cannot do since it requires active user interaction inside a browser tab):
- Integrate a simple REST client pointing to a local ESP32 gateway. The gateway acts as a bridge, fetching the latest VN-Index / Stock data from our Firebase database and automatically updating the e-paper tag every 15 minutes.

---

## 4. Firmware Extraction & OTA Update Plan

### 📥 Firmware Extraction (Trích xuất Firmware)
- **Over-the-Air (Wireless)**: **Not Feasible**. By default, the Nordic Semiconductor BLE DFU bootloader and the target firmware do not support readback operations over BLE for security reasons.
- **Physical Connection**: **Feasible via SWD Port**.
  - **Tool required**: Segger J-Link or DAPLink hardware programmer.
  - **Wiring**: Connect to the tag PCB's SWD test points (`SWDIO`, `SWCLK`, `GND`, `VDD`).
  - **Read command**: Use Nordic's CLI tools to read the flash memory:
    ```bash
    nrfjprog --readcode backup_firmware.hex
    ```
  - **Note on APPROTECT**: If the tag developer enabled Readback Protection (APPROTECT) in production, any read attempt will fail. Unlocking the debug port requires a full chip erase (`ERASEALL`), which destroys the original firmware. Bypassing this requires advanced hardware voltage glitching attacks.

### 📤 Firmware OTA Upgrades (Nâng cấp Firmware không dây)
- **Feasible via Web Bluetooth**: We can build a custom OTA updater directly in our dashboard using Web Bluetooth DFU libraries.
- **Detailed BLE Protocol Steps**:
  1. **Device Discovery & Prep**: The browser connects to the target EPD device under standard operating mode using the Web Bluetooth API.
  2. **Buttonless DFU Reboot**: To switch the device to bootloader mode, write `0x01` to the **Buttonless DFU Characteristic** (`8EC90003-F315-4F60-9FB8-838830DAEA50`). The device automatically disconnects, reboots into DFU mode, and broadcasts as `DfuTarg`.
  3. **DFU Target Handshake**: The browser scans for and connects to `DfuTarg`. It discovers the official **Secure DFU Service** (`0xFE59` or `8EC90000-F315-4F60-9FB8-838830DAEA50`).
  4. **MTU Exchange & PRN Setup**: Exchange MTU size and configure Packet Receipt Notifications (PRN) to receive transfer success signals from the tag.
  5. **Sending Init Packet**:
     - Write metadata details to the **DFU Control Point** (`8EC90001-...`): select command type `0x01` (Create Command object).
     - Stream the `.dat` init packet data (containing signature, hash, target hw/sw versions) through the **DFU Packet Characteristic** (`8EC90002-...`).
     - Send execution command `0x04` to the Control Point.
  6. **Streaming Firmware Data**:
     - Write command `0x02` (Create Data object) to the Control Point.
     - Stream the application firmware binary data in packets matching the device MTU size via the DFU Packet Characteristic.
     - Periodically receive progress acknowledgments (PRN packets) from the device.
  7. **Validation & Install**: Send command `0x04` (Execute) to the Control Point. The bootloader verifies the cryptographic signature (Secure DFU) or checksum. Once validated, it overwrites the old application sector, updates flash descriptors, and boots into the new firmware.

---

## 5. Coding & Compiling Custom Firmware for nRF52/nRF51

**Yes, we can absolutely write custom firmware** for these chips. You have two main development environments to write custom firmware for the E-Paper tag:

### Option A: Official nRF5 SDK (C Language) - Used by `tsl0922/EPD-nRF5`
This is the most battery-efficient and performant approach.
- **Codebase structure**: Uses pure C and Nordic's hardware abstraction layer (nRF5 SDK v17.x).
- **Core files**:
  - `main.c`: Initializes BLE services, handles power management (System Off sleep modes), and coordinates updates.
  - `spi_epd.c` / `epd_xx.c`: Low-level SPI controller interfacing with the E-Paper display's registers.
  - `sdk_config.h`: Central configuration file enabling/disabling peripheral drivers (SPI, BLE, UART).
- **Compiling**:
  1. Install GCC ARM Embedded Toolchain (`arm-none-eabi-gcc`).
  2. Setup GNU Make tool.
  3. Modify the board pins (CLK, MOSI, CS, DC, RST, BUSY) in custom board headers (`custom_board.h`).
  4. Run `make` in the build directory to compile the source code into `.hex` or `.bin` binaries.

### Option B: Arduino Core for nRF52 (C++ Language) - Easiest for Custom Features
If you want to quickly add smart features (like custom text displays, QR codes, or custom BLE services) without dealing with complex low-level C registers:
- **Core Package**: Use the Adafruit nRF52 Arduino Core.
- **Key Libraries**:
  - `GxEPD2`: The most mature Arduino library for Waveshare E-Paper displays. Handles refreshing, partial updates, and power settings.
  - `Adafruit_GFX`: Standard graphics library for drawing shapes, fonts, and icons on the canvas.
  - `Adafruit_BluefruitLE_nRF52`: Simplified BLE library for creating custom characteristics.
- **Compiling**: Write standard `.ino` files and compile them via the Arduino IDE or VS Code with PlatformIO.

### Packaging the Firmware for OTA Updates
To bundle your compiled `.hex` binary into an OTA-ready `.zip` package, you must package it with Nordic's signature keys:
1. Generate a public/private keypair using `nrfutil` (if using Secure DFU).
2. Run the packaging utility command:
   ```bash
   nrfutil pkg generate --hw-version 52 --sd-req 0x0100 --application-version 1 --application build.hex --key-file private.key update_package.zip
   ```
3. Load the resulting `update_package.zip` into your E-Ink Manager browser console to upload it wirelessly.

---

## 6. Connection Log Analysis (Log Case Study: NRF_EPD_4833)

Below is an analysis of a device connection log to understand the low-level transactions between the browser and the tag:

```
08:46:11 Lưu ý: Chế độ nhà phát triển đã được bật! Vui lòng không tự ý sửa đổi nếu không biết rõ!
08:46:16 Đang kết nối... NRF_EPD_4833
08:46:16 Found GATT Server
08:46:16 Found EPD Service
08:46:16 Found Characteristic
08:46:16 Phiên bản Firmware: 0x19
08:46:16 ⇑01
08:46:17 Đã nhận cấu hình: 6d74753d323434
08:46:17 ⇓t=1783068376
08:46:17 Thời gian thiết bị: 7/3/2026, 8:46:16 AM
08:46:17 Thời gian hệ thống: 7/3/2026, 8:46:17 AM
```

### Protocol Decoding & Insights
1. **Device Ticker**: `NRF_EPD_4833`
   - Uses the `'NRF'` scan filter.
   - The hex code suffix `4833` represents the unique hardware identification portion of the device's BLE MAC address.
2. **GATT Discovery Success**:
   - Resolved the BLE GATT server, EPD Service (`62750001-...`), and EPD control Characteristic (`62750002-...`).
3. **Firmware Version (`0x19`)**:
   - Sourced from the Version Characteristic (`62750003-...`).
   - `0x19` in hexadecimal translates to **25** in decimal. In the official firmware repository, versioning uses hexadecimal coding where `0x15` is Version 1.5, and `0x19` is **Version 1.9** (the latest official master release version). The display UI logs this decimal value `25` as `v2.5` (or firmware version `2.5`). This confirms the hardware runs the latest v1.9 firmware codebase.
4. **Command Transmission (`⇑01`)**:
   - `⇑` indicates write operation to the characteristic.
   - `01` corresponds to command `EpdCmd.INIT` (value `0x01`). The web application sends this command to query current device parameters.
5. **Configuration Feedback (`6d74753d323434`)**:
   - The device notifies the browser of its setup variables.
   - Converting the hex bytes `6d 74 75 3d 32 34 34` to ASCII text yields: **`mtu=244`**.
   - **Significance**: The device indicates it supports a BLE Maximum Transmission Unit (MTU) size of 244 bytes. Knowing this allows the web app to stream graphics in large 244-byte chunks instead of the BLE default of 20 bytes, accelerating image update speed by 12x.
6. **Device Time Broadcast (`⇓t=1783068376`)**:
   - `⇓` represents notification received from the device.
   - The device outputs its internal RTC time: Unix timestamp `1783068376`.
   - Decoding `1783068376` (Seconds since Jan 1, 1970) yields: **Friday, July 3, 2026 at 08:46:16 AM**.
7. **Time Alignment check**:
   - Device Time: `8:46:16 AM` vs. System Time: `8:46:17 AM`.
   - The clock is synchronized within **1 second**, confirming that the display's internal clock is keeping accurate time.

---

## 7. Image Upload Log & Code Analysis (Log Case Study: Image Transfer)

Below is an analysis of the logs generated during an image transfer to the EPD device:

```
10:06:17 ⇑30f0bfbefbbfefdfdeddafffffeeffffffffffffdffffffffffffffffffffffffffffffffffffffffffffffffffffffffbd7bfdefaf5eeeefef5f7f7fffbffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffbefefb7bdfdfbffbefbf6f7eeffffffffffffffffffffffffffffbfffffffffff7fffffffffffffffffffffffffffffffffef7b7efef757b7ddfbbeefedbbffffffffffffffffffffffefffffffffffffffffffffffffffffffffffffffffffffffffff7bdfddefdffefeffeff7fdbfeebffeffffffffffffffffffffffffffbffffffffffffffffffffffffffff
10:06:17 ⇑05
10:06:17 Gửi hoàn thành! Thời gian: 5.607s
10:06:17 Vui lòng không thao tác trước khi màn hình làm mới xong.
```

### Low-Level BLE Actions
1. **Writing Image Data Chunk (`⇑30f0bfbef...`)**:
   - `⇑` indicates write operation to the characteristic.
   - The hex code prefix `30` corresponds to `EpdCmd.WRITE_IMG` (`0x30`).
   - Under the hood, `writeImage()` slices the canvas image array into fragments based on the negotiated MTU size (`mtu - 2 = 242` bytes).
   - In each slice, the payload prefix byte represents packet metadata (`0x0F` for B/W step, `0x00` for first packet, or `0xF0` for subsequent packets). The rest contains the binary raw pixel buffer.
2. **Triggering Screen Refresh (`⇑05`)**:
   - `05` corresponds to `EpdCmd.REFRESH` (`0x05`).
   - After the entire binary payload is uploaded, this command triggers the microcontroller to execute the physical e-paper refresh waveforms to align the microcapsules and display the new image.
3. **Execution Statistics**:
   - **Upload Time**: `5.607s` to transfer the full payload over BLE.
   - **Sync Speed optimization**: Utilizes interleaved writes (writing without response with a 25ms delay, and periodically sending with response to clear BLE buffers) to prevent hardware congestion while maintaining high speeds.
   - **Post-Transfer Instruction**: Displays "Vui lòng không thao tác..." because the physical bistable e-paper refresh takes several seconds to complete drawing. Doing other Bluetooth actions during this drawing phase could crash the microcontroller.

---

## 8. Clear Screen Command Log Analysis (Log Case Study: Screen Clearing)

Below is an analysis of the logs generated during a screen clear operation on the EPD device:

```
13:00:34 ⇑02
13:00:34 Đã gửi lệnh xóa!
13:00:34 Vui lòng chờ màn hình tải xong.
```

### Protocol Interaction
1. **Clear Command Write (`⇑02`)**:
   - `⇑` indicates write operation to the characteristic.
   - The hex command `02` corresponds to `EpdCmd.CLEAR` (`0x02`).
   - Unlike `SET_TIME` (`0x20`) which delegates rendering to the asynchronous scheduler loop (`app_sched_event_put`), `EPD_CMD_CLEAR` is executed **synchronously** inside the BLE write event callback handler on the microcontroller.
2. **Firmware Execution Details**:
   - The vi điều khiển (MCU) wakes up the EPD controller by calling `init(epd)` on the active driver.
   - It performs a rapid memory fill (`SSD16xx_Clear`) by writing `0xFF` (representing white pixels) directly to the controller's RAM buffer over SPI. This takes only a few milliseconds.
   - It triggers a physical refresh (`refresh`) to flash the display to white.
   - Finally, it calls `EPD_GPIO_Uninit()` to release the SPI bus and set GPIO pins to high-impedance state for battery preservation.
3. **Observation**: Because the EPD clear command is executed directly and has a very simple execution path without heavy GFX font/lunar-calendar loops, it triggers the screen refresh instantly while still connected to BLE.
