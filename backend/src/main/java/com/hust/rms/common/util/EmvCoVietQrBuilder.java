package com.hust.rms.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

/**
 * HUST IT3180 RMS — Trình đóng gói Tag-Length-Value (TLV) sinh chuỗi VietQR động NAPAS 247 (SDD 3.3, NFR-08).
 */
public final class EmvCoVietQrBuilder {

    private static final String NAPAS_AID = "A000000727";
    private static final String SERVICE_ACCOUNT_TRANSFER = "QRIBFTTA";
    private static final String CURRENCY_VND = "704";
    private static final String COUNTRY_VN = "VN";
    private static final String DEFAULT_CITY = "HA NOI";
    private static final int MAX_MERCHANT_NAME_LEN = 25;

    private EmvCoVietQrBuilder() {
    }

    public static String buildDynamicVietQr(
            String bankBin,
            String accountNumber,
            String accountName,
            BigDecimal amountVnd,
            String addInfo
    ) {
        if (amountVnd == null || amountVnd.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền VietQR động phải lớn hơn 0.");
        }
        String cleanBin = bankBin != null ? bankBin.trim() : "";
        String cleanAccNo = accountNumber != null ? accountNumber.trim() : "";
        String exactAmount = amountVnd.setScale(0, RoundingMode.HALF_UP).toPlainString();
        String merchantName = normalizeAccountName(accountName);
        String cleanAddInfo = normalizeAddInfo(addInfo);

        String beneficiarySubTlv = tlv("00", cleanBin) + tlv("01", cleanAccNo);
        String merchantAccountInfo = tlv("00", NAPAS_AID)
                + tlv("01", beneficiarySubTlv)
                + tlv("02", SERVICE_ACCOUNT_TRANSFER);
        String additionalData = tlv("08", cleanAddInfo);

        String payloadWithoutCrc = tlv("00", "01")
                + tlv("01", "12")
                + tlv("38", merchantAccountInfo)
                + tlv("53", CURRENCY_VND)
                + tlv("54", exactAmount)
                + tlv("58", COUNTRY_VN)
                + tlv("59", merchantName)
                + tlv("60", DEFAULT_CITY)
                + tlv("62", additionalData)
                + "6304";

        return payloadWithoutCrc + Crc16Util.computeHex(payloadWithoutCrc);
    }

    public static String normalizeAccountName(String rawName) {
        String ascii = VietnameseTextNormalizer.normalize(rawName)
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9 ]", "")
                .replaceAll("\\s+", " ")
                .trim();
        if (ascii.isEmpty()) {
            return "NHA HANG RMS";
        }
        return ascii.length() > MAX_MERCHANT_NAME_LEN
                ? ascii.substring(0, MAX_MERCHANT_NAME_LEN).trim()
                : ascii;
    }

    private static String normalizeAddInfo(String rawInfo) {
        String ascii = VietnameseTextNormalizer.normalize(rawInfo)
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9 -]", "")
                .replaceAll("\\s+", " ")
                .trim();
        return ascii.length() > 50 ? ascii.substring(0, 50).trim() : ascii;
    }

    public static String tlv(String tag, String value) {
        if (tag == null || tag.length() != 2) {
            throw new IllegalArgumentException("EMVCo tag phải gồm đúng 2 ký tự.");
        }
        if (value == null || value.isEmpty() || value.length() > 99) {
            throw new IllegalArgumentException("Giá trị TLV cho tag " + tag + " có độ dài không hợp lệ.");
        }
        return String.format("%s%02d%s", tag, value.length(), value);
    }
}
