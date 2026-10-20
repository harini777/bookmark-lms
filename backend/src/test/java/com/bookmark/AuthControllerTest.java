package com.bookmark;

import com.bookmark.dto.LoginRequest;
import com.bookmark.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerNewMember_ShouldReturn201() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser_auth");
        request.setEmail("testuser_auth@test.com");
        request.setPassword("Password123");
        request.setFullName("Test User Auth");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("testuser_auth"))
                .andExpect(jsonPath("$.role").value("MEMBER"));
    }

    @Test
    void registerWithDuplicateUsername_ShouldReturn400() throws Exception {
        RegisterRequest req1 = new RegisterRequest();
        req1.setUsername("dupuser1");
        req1.setEmail("dup1@test.com");
        req1.setPassword("Password123");
        req1.setFullName("Dup User 1");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // Same username, different email
        RegisterRequest req2 = new RegisterRequest();
        req2.setUsername("dupuser1");
        req2.setEmail("dup2@test.com");
        req2.setPassword("Password123");
        req2.setFullName("Dup User 2");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerWithDuplicateEmail_ShouldReturn400() throws Exception {
        RegisterRequest req1 = new RegisterRequest();
        req1.setUsername("emaildup1");
        req1.setEmail("shared@test.com");
        req1.setPassword("Password123");
        req1.setFullName("Email Dup 1");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        RegisterRequest req2 = new RegisterRequest();
        req2.setUsername("emaildup2");
        req2.setEmail("shared@test.com");
        req2.setPassword("Password123");
        req2.setFullName("Email Dup 2");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerWithInvalidEmail_ShouldReturn400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("bademail");
        request.setEmail("not-an-email");
        request.setPassword("Password123");
        request.setFullName("Bad Email User");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerWithMissingFields_ShouldReturn400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        // username, email, password, fullName all blank

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginWithInvalidCredentials_ShouldReturn401() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("nonexistent");
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginWithEmptyFields_ShouldReturn400() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("");
        request.setPassword("");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
