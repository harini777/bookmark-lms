package com.bookmark;

import com.bookmark.dto.BookRequest;
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
public class BookControllerTest {

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

        String body = result.getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    @Test
    void createBook_AsLibrarian_ShouldReturn201() throws Exception {
        BookRequest req = validBookRequest("978-0-061-96436-9", "Test Book JUnit", "Author A");

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Test Book JUnit"))
                .andExpect(jsonPath("$.availableCopies").value(3));
    }

    @Test
    void createBook_AsMember_ShouldReturn403() throws Exception {
        BookRequest req = validBookRequest("978-0-061-96436-0", "Member Book", "Author B");

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + memberToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createBook_WithoutAuth_ShouldReturn401() throws Exception {
        BookRequest req = validBookRequest("978-0-061-11111-1", "No Auth Book", "Author C");

        mockMvc.perform(post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createBook_DuplicateIsbn_ShouldReturn400() throws Exception {
        BookRequest req = validBookRequest("978-0-000-00001-0", "Original", "Author D");

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        BookRequest dup = validBookRequest("978-0-000-00001-0", "Duplicate ISBN Book", "Author E");

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dup)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createBook_NegativeCopies_ShouldReturn400() throws Exception {
        BookRequest req = new BookRequest();
        req.setTitle("Neg Copies");
        req.setAuthor("Author F");
        req.setIsbn("978-0-000-00002-0");
        req.setTotalCopies(-1);

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createBook_MissingTitle_ShouldReturn400() throws Exception {
        BookRequest req = new BookRequest();
        req.setAuthor("Author G");
        req.setIsbn("978-0-000-00003-0");
        req.setTotalCopies(2);

        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getBookById_NonExistent_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/books/999999")
                .header("Authorization", "Bearer " + librarianToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void searchBooks_ShouldReturnResults() throws Exception {
        // Create a book first
        BookRequest req = validBookRequest("978-0-000-00100-0", "Searchable Book Alpha", "Author Search");
        mockMvc.perform(post("/api/books")
                .header("Authorization", "Bearer " + librarianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/books/search?query=Searchable")
                .header("Authorization", "Bearer " + librarianToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    private BookRequest validBookRequest(String isbn, String title, String author) {
        BookRequest req = new BookRequest();
        req.setTitle(title);
        req.setAuthor(author);
        req.setIsbn(isbn);
        req.setCategory("Fiction");
        req.setTotalCopies(3);
        return req;
    }
}
