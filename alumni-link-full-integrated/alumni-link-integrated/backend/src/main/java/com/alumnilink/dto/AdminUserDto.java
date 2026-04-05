package com.alumnilink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminUserDto {
    private String id;
    private String email;
    private String name;
    private String role;
    private boolean approved;
    private String createdAt;
}

