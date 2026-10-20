package com.bookmark;

import com.bookmark.dto.BookRequest;
import com.bookmark.dto.IssueRequest;
import com.bookmark.dto.LoginRequest;
import com.bookmark.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class LoanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String librarianToken;
    private String memberToken;

    @BeforeEach
    void setUp() throws Exception {
        librarianToken = getToken("librarian", "Librarian@123");
        memberToken = getToken("member1", "Member@123");
    }

    private String getToken(String username, String password) throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername(username);
        req.setPassword(password);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
    }

    private Long createBook(String isbn, String title) throws Exception {
        BookRequest req = new BookRequest();
        req.setTitle(title);
        req.setAuthor("Test Author");
        req.setIsbn(isbn);
        req.setCategory("Test");
        req.setTotalCopies(2);

        MvcResult result = mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asLong();
    }

    private Long getMemberOneId() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/members/me")
                .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asLong();
    }

    @Test
    void issueBook_ShouldSucceed_AndReduceAvailability() throws Exception {
        Long bookId = createBook("978-1-001-00001-1", "Issue Test Book");
        Long memberId = getMemberOneId();

        IssueRequest req = new IssueRequest();
        req.setBookId(bookId);
        req.setMemberId(memberId);

        mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookId").value(bookId))
                .andExpect(jsonPath("$.memberId").value(memberId))
                .andExpect(jsonPath("$.returned").value(false));

        // Verify availability decreased
        mockMvc.perform(get("/api/books/" + bookId)
                .header("Authorization", "Bearer " + librarianToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableCopies").value(1));
    }

    @Test
    void issueBook_UnavailableBook_ShouldReturn400() throws Exception {
        Long bookId = createBook("978-1-001-00002-1", "Unavailable Book");

        // Register two members to exhaust copies
        Long memberId1 = getMemberOneId();

        Long memberId2 = registerAndGetId("loantest_m2", "loantest_m2@test.com");

        IssueRequest req1 = new IssueRequest();
        req1.setBookId(bookId);
        req1.setMemberId(memberId1);
        mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk());

        IssueRequest req2 = new IssueRequest();
        req2.setBookId(bookId);
        req2.setMemberId(memberId2);
        mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk());

        // Third issue attempt — no copies left
        Long memberId3 = registerAndGetId("loantest_m3", "loantest_m3@test.com");
        IssueRequest req3 = new IssueRequest();
        req3.setBookId(bookId);
        req3.setMemberId(memberId3);
        mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req3)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnBook_ShouldSucceed_AndRestoreAvailability() throws Exception {
        Long bookId = createBook("978-1-001-00003-1", "Return Test Book");
        Long memberId = getMemberOneId();

        IssueRequest req = new IssueRequest();
        req.setBookId(bookId);
        req.setMemberId(memberId);

        MvcResult issueResult = mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        Long loanId = objectMapper.readTree(issueResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(patch("/api/loans/" + loanId + "/return")
                .header("Authorization", "Bearer " + librarianToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.returned").value(true));

        // Verify availability restored
        mockMvc.perform(get("/api/books/" + bookId)
                .header("Authorization", "Bearer " + librarianToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableCopies").value(2));
    }

    @Test
    void returnBook_AlreadyReturned_ShouldReturn400() throws Exception {
        Long bookId = createBook("978-1-001-00004-1", "Double Return Book");
        Long memberId = getMemberOneId();

        IssueRequest req = new IssueRequest();
        req.setBookId(bookId);
        req.setMemberId(memberId);

        MvcResult issueResult = mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        Long loanId = objectMapper.readTree(issueResult.getResponse().getContentAsString())
                .get("id").asLong();

        // First return
        mockMvc.perform(patch("/api/loans/" + loanId + "/return")
                .header("Authorization", "Bearer " + librarianToken))
                .andExpect(status().isOk());

        // Second return — should fail
        mockMvc.perform(patch("/api/loans/" + loanId + "/return")
                .header("Authorization", "Bearer " + librarianToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void issueBook_AsMemember_ShouldReturn403() throws Exception {
        Long bookId = createBook("978-1-001-00005-1", "Member Issue Test");
        Long memberId = getMemberOneId();

        IssueRequest req = new IssueRequest();
        req.setBookId(bookId);
        req.setMemberId(memberId);

        mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + memberToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void issueBook_NonExistentBook_ShouldReturn404() throws Exception {
        Long memberId = getMemberOneId();
        IssueRequest req = new IssueRequest();
        req.setBookId(999999L);
        req.setMemberId(memberId);

        mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void issueBook_NonExistentMember_ShouldReturn404() throws Exception {
        Long bookId = createBook("978-1-001-00006-1", "NoMember Test Book");
        IssueRequest req = new IssueRequest();
        req.setBookId(bookId);
        req.setMemberId(999999L);

        mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    private Long registerAndGetId(String username, String email) throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername(username);
        req.setEmail(email);
        req.setPassword("Password123");
        req.setFullName("Test Member");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        if (result.getResponse().getStatus() == 201) {
            return objectMapper.readTree(result.getResponse().getContentAsString())
                    .get("id").asLong();
        }
        // Already registered — get from members list
        MvcResult listResult = mockMvc.perform(get("/api/members")
                .header("Authorization", "Bearer " + librarianToken))
                .andExpect(status().isOk())
                .andReturn();
        var arr = objectMapper.readTree(listResult.getResponse().getContentAsString());
        for (var node : arr) {
            if (node.get("username").asText().equals(username)) {
                return node.get("id").asLong();
            }
        }
        throw new RuntimeException("Could not find/create member: " + username);
    }
}
