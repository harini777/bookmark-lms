package com.bookmark.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {
    private String fullName;
    private String phone;
    private String email;
    private String dateOfBirth;
    private String gender;
    private String address;
}
