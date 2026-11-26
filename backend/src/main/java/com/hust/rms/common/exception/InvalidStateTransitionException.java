package com.hust.rms.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidStateTransitionException extends ApiException {

    public InvalidStateTransitionException(String code, String message) {
        super(HttpStatus.BAD_REQUEST, code, message);
    }
}
