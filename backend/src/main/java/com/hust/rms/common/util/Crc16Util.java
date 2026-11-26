package com.hust.rms.common.util;

import java.nio.charset.StandardCharsets;

/**
 * HUST IT3180 RMS — Thuật toán kiểm tra tổng CRC-16/CCITT-FALSE cho chuẩn EMVCo & NAPAS VietQR.
 * Đa thức sinh: 0x1021, giá trị khởi tạo: 0xFFFF, không đảo bit (RefIn=false, RefOut=false, XorOut=0x0000).
 */
public final class Crc16Util {

    private static final int POLYNOMIAL = 0x1021;
    private static final int INITIAL_CRC = 0xFFFF;

    private Crc16Util() {
    }

    public static String computeHex(String asciiPayload) {
        if (asciiPayload == null) {
            throw new IllegalArgumentException("Chuỗi đầu vào tính CRC16 không được null.");
        }
        int crc = INITIAL_CRC;
        byte[] octets = asciiPayload.getBytes(StandardCharsets.UTF_8);
        for (byte octet : octets) {
            crc ^= (octet & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) {
                if ((crc & 0x8000) != 0) {
                    crc = ((crc << 1) ^ POLYNOMIAL) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }
        return String.format("%04X", crc);
    }
}
