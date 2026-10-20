package com.bookmark.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotBlank(message = "Author is required")
    @Size(max = 100, message = "Author must not exceed 100 characters")
    private String author;

    @NotBlank(message = "ISBN is required")
    @Size(max = 20, message = "ISBN must not exceed 20 characters")
    private String isbn;

    private String category;
    private String publisher;
    private String edition;
    private Integer publicationYear;
    private String language;
    private String shelfLocation;
    private String description;

    @NotNull(message = "Total copies is required")
    @Min(value = 0, message = "Total copies must be 0 or greater")
    private Integer totalCopies;
}
