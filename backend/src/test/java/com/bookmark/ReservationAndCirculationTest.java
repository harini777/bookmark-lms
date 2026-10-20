package com.bookmark;

import com.bookmark.dto.BookRequest;
import com.bookmark.dto.IssueRequest;
import com.bookmark.dto.LoginRequest;
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
public class ReservationAndCirculationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String librarianToken;
    private String member1Token;
    private String member2Token;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = getToken("admin", "Admin@123");
        librarianToken = getToken("librarian", "Librarian@123");
        member1Token = getToken("member1", "Member@123");
        member2Token = getToken("member2", "Member@123");
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

    private Long createSingleCopyBook(String isbn, String title) throws Exception {
        BookRequest req = new BookRequest();
        req.setTitle(title);
        req.setAuthor("SRS Author");
        req.setIsbn(isbn);
        req.setCategory("Computer Science");
        req.setPublisher("Bookmark Press");
        req.setEdition("1st");
        req.setPublicationYear(2026);
        req.setTotalCopies(1);

        MvcResult result = mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asLong();
    }

    @Test
    void testReservationAndQueueFlow_UC10_UC11() throws Exception {
        Long bookId = createSingleCopyBook("978-9-999-00001-1", "Queue Book");

        // Try to reserve when book has available copies -> Should reject (UC10 flow)
        mockMvc.perform(post("/api/reservations/book/" + bookId)
                .header("Authorization", "Bearer " + member1Token))
                .andExpect(status().isBadRequest());

        // Issue book to member1 so availableCopies becomes 0
        IssueRequest issueReq = new IssueRequest();
        issueReq.setBookId(bookId);
        issueReq.setMemberId(3L); // member1

        mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(issueReq)))
                .andExpect(status().isOk());

        // Now member2 reserves the unavailable book -> should succeed with queuePosition = 1
        MvcResult resResult = mockMvc.perform(post("/api/reservations/book/" + bookId)
                .header("Authorization", "Bearer " + member2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.queuePosition").value(1))
                .andReturn();

        Long resId = objectMapper.readTree(resResult.getResponse().getContentAsString()).get("id").asLong();

        // Duplicate reservation by same member should fail
        mockMvc.perform(post("/api/reservations/book/" + bookId)
                .header("Authorization", "Bearer " + member2Token))
                .andExpect(status().isBadRequest());

        // Cancel reservation (UC11)
        mockMvc.perform(patch("/api/reservations/" + resId + "/cancel")
                .header("Authorization", "Bearer " + member2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void testRenewBook_UC9() throws Exception {
        Long bookId = createSingleCopyBook("978-9-999-00002-1", "Renewable Book");

        IssueRequest issueReq = new IssueRequest();
        issueReq.setBookId(bookId);
        issueReq.setMemberId(3L); // member1

        MvcResult issueResult = mockMvc.perform(post("/api/loans/issue")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(issueReq)))
                .andExpect(status().isOk())
                .andReturn();

        Long loanId = objectMapper.readTree(issueResult.getResponse().getContentAsString()).get("id").asLong();

        // Member renews the book
        mockMvc.perform(patch("/api/loans/" + loanId + "/renew")
                .header("Authorization", "Bearer " + member1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.renewalCount").value(1));

        // Second renewal succeeds
        mockMvc.perform(patch("/api/loans/" + loanId + "/renew")
                .header("Authorization", "Bearer " + member1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.renewalCount").value(2));

        // Third renewal fails (limit = 2)
        mockMvc.perform(patch("/api/loans/" + loanId + "/renew")
                .header("Authorization", "Bearer " + member1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testComprehensiveReports_UC19() throws Exception {
        mockMvc.perform(get("/api/reports")
                .header("Authorization", "Bearer " + librarianToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTitles").isNumber())
                .andExpect(jsonPath("$.totalCopies").isNumber())
                .andExpect(jsonPath("$.totalLoansIssued").isNumber());
    }

    @Test
    void testAdminRoleManagementAndBackup_UC20_UC21() throws Exception {
        // List users as admin
        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(4))));

        // Export backup
        mockMvc.perform(get("/api/admin/backup")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value("1.0"))
                .andExpect(jsonPath("$.books").isArray());
    }
}
