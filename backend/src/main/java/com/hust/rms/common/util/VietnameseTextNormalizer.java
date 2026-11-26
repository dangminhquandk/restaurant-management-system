package com.hust.rms.common.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class VietnameseTextNormalizer {

    private static final Pattern COMBINING_MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    private VietnameseTextNormalizer() {
    }

    public static String normalize(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        String replaced = input.replace('đ', 'd').replace('Đ', 'd');
        String decomposed = Normalizer.normalize(replaced, Normalizer.Form.NFD);
        String stripped = COMBINING_MARKS.matcher(decomposed).replaceAll("");
        return WHITESPACE.matcher(stripped.toLowerCase(Locale.ROOT).trim()).replaceAll(" ");
    }

    public static boolean containsNormalized(String candidate, String searchQuery) {
        String normalizedQuery = normalize(searchQuery);
        if (normalizedQuery.isEmpty()) {
            return true;
        }
        return normalize(candidate).contains(normalizedQuery);
    }
}
