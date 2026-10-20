package com.bookmark.service;

import com.bookmark.dto.BookDTO;
import com.bookmark.dto.BookRequest;
import com.bookmark.entity.Book;
import com.bookmark.exception.BadRequestException;
import com.bookmark.exception.ResourceNotFoundException;
import com.bookmark.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    public List<BookDTO> getAllBooks() {
        return bookRepository.findAll().stream()
                .map(BookDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public BookDTO getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
        return BookDTO.fromEntity(book);
    }

    public List<BookDTO> searchBooks(String query) {
        return bookRepository.searchBooks(query).stream()
                .map(BookDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookDTO createBook(BookRequest request) {
        if (bookRepository.existsByIsbn(request.getIsbn())) {
            throw new BadRequestException("A book with ISBN '" + request.getIsbn() + "' already exists");
        }
        if (request.getTotalCopies() < 0) {
            throw new BadRequestException("Total copies cannot be negative");
        }

        Book book = new Book();
        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setIsbn(request.getIsbn());
        book.setCategory(request.getCategory());
        book.setPublisher(request.getPublisher());
        book.setEdition(request.getEdition());
        book.setPublicationYear(request.getPublicationYear());
        book.setLanguage(request.getLanguage());
        book.setShelfLocation(request.getShelfLocation());
        book.setDescription(request.getDescription());
        book.setTotalCopies(request.getTotalCopies());
        book.setAvailableCopies(request.getTotalCopies());

        return BookDTO.fromEntity(bookRepository.save(book));
    }

    @Transactional
    public BookDTO updateBook(Long id, BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));

        // Check duplicate ISBN only if it changed
        if (!book.getIsbn().equals(request.getIsbn()) &&
                bookRepository.existsByIsbnAndIdNot(request.getIsbn(), id)) {
            throw new BadRequestException("A book with ISBN '" + request.getIsbn() + "' already exists");
        }

        if (request.getTotalCopies() < 0) {
            throw new BadRequestException("Total copies cannot be negative");
        }

        int lentOut = book.getTotalCopies() - book.getAvailableCopies();
        int newAvailable = request.getTotalCopies() - lentOut;
        if (newAvailable < 0) {
            throw new BadRequestException("Cannot reduce total copies below the number currently issued (" + lentOut + ")");
        }

        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setIsbn(request.getIsbn());
        book.setCategory(request.getCategory());
        book.setPublisher(request.getPublisher());
        book.setEdition(request.getEdition());
        book.setPublicationYear(request.getPublicationYear());
        book.setLanguage(request.getLanguage());
        book.setShelfLocation(request.getShelfLocation());
        book.setDescription(request.getDescription());
        book.setTotalCopies(request.getTotalCopies());
        book.setAvailableCopies(newAvailable);

        return BookDTO.fromEntity(bookRepository.save(book));
    }

    @Transactional
    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));

        int lentOut = book.getTotalCopies() - book.getAvailableCopies();
        if (lentOut > 0) {
            throw new BadRequestException("Cannot delete book with " + lentOut + " active loan(s)");
        }

        bookRepository.delete(book);
    }
}
