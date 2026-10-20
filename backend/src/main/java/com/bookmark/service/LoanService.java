package com.bookmark.service;

import com.bookmark.dto.DashboardStatsDTO;
import com.bookmark.dto.IssueRequest;
import com.bookmark.dto.LoanDTO;
import com.bookmark.entity.Book;
import com.bookmark.entity.Loan;
import com.bookmark.entity.Role;
import com.bookmark.entity.User;
import com.bookmark.exception.BadRequestException;
import com.bookmark.exception.ResourceNotFoundException;
import com.bookmark.repository.BookRepository;
import com.bookmark.repository.LoanRepository;
import com.bookmark.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final com.bookmark.repository.ReservationRepository reservationRepository;

    @Value("${app.fine.rate-per-day}")
    private BigDecimal fineRatePerDay;

    @Value("${app.borrow.limit}")
    private int borrowLimit;

    @Value("${app.borrow.period-days}")
    private int borrowPeriodDays;

    @Transactional
    public LoanDTO issueBook(IssueRequest request, String librarianUsername) {
        User member = userRepository.findById(request.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + request.getMemberId()));

        if (member.getRole() != Role.MEMBER) {
            throw new BadRequestException("Can only issue books to members");
        }

        if (member.getStatus() == com.bookmark.entity.MemberStatus.PENDING ||
            member.getStatus() == com.bookmark.entity.MemberStatus.REJECTED ||
            member.getStatus() == com.bookmark.entity.MemberStatus.SUSPENDED ||
            member.getStatus() == com.bookmark.entity.MemberStatus.EXPIRED) {
            throw new BadRequestException("Member account is not approved (status: " + member.getStatus() + ")");
        }

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + request.getBookId()));

        if (book.getAvailableCopies() <= 0) {
            throw new BadRequestException("No available copies of '" + book.getTitle() + "'");
        }

        long activeLoans = loanRepository.countActiveLoansForMember(member);
        if (activeLoans >= borrowLimit) {
            throw new BadRequestException("Member has reached the borrow limit of " + borrowLimit + " books");
        }

        if (loanRepository.existsByMemberAndBookAndReturnedFalse(member, book)) {
            throw new BadRequestException("Member already has this book issued");
        }

        User librarian = userRepository.findByUsername(librarianUsername).orElse(null);

        Loan loan = new Loan();
        loan.setMember(member);
        loan.setBook(book);
        loan.setIssueDate(LocalDate.now());
        loan.setDueDate(LocalDate.now().plusDays(borrowPeriodDays));
        loan.setIssuedBy(librarian);

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        return LoanDTO.fromEntity(loanRepository.save(loan));
    }

    @Transactional
    public LoanDTO returnBook(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));

        if (loan.isReturned()) {
            throw new BadRequestException("Loan #" + loanId + " has already been returned");
        }

        LocalDate today = LocalDate.now();
        loan.setReturnDate(today);
        loan.setReturned(true);

        if (today.isAfter(loan.getDueDate())) {
            long daysOverdue = ChronoUnit.DAYS.between(loan.getDueDate(), today);
            loan.setFine(fineRatePerDay.multiply(BigDecimal.valueOf(daysOverdue)));
        }

        Book book = loan.getBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        // Check active reservations and fulfill first in queue
        List<com.bookmark.entity.Reservation> activeRes = reservationRepository.findByBookAndStatusOrderByReservationDateAsc(book, com.bookmark.entity.ReservationStatus.ACTIVE);
        if (!activeRes.isEmpty()) {
            com.bookmark.entity.Reservation topRes = activeRes.get(0);
            topRes.setStatus(com.bookmark.entity.ReservationStatus.FULFILLED);
            topRes.setFulfilledAt(java.time.LocalDateTime.now());
            reservationRepository.save(topRes);
        }

        return LoanDTO.fromEntity(loanRepository.save(loan));
    }

    @Transactional
    public LoanDTO renewBook(Long loanId, String username) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));

        if (loan.isReturned()) {
            throw new BadRequestException("Cannot renew an already returned book");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getRole() == Role.MEMBER && !loan.getMember().getId().equals(user.getId())) {
            throw new BadRequestException("Cannot renew a book for another member");
        }

        if (loan.getRenewalCount() >= 2) {
            throw new BadRequestException("Maximum renewal limit reached (2 renewals allowed)");
        }

        long reservations = reservationRepository.countActiveForBook(loan.getBook());
        if (reservations > 0) {
            throw new BadRequestException("Cannot renew: book has been reserved by another member");
        }

        loan.setDueDate(loan.getDueDate().plusDays(borrowPeriodDays));
        loan.setRenewalCount(loan.getRenewalCount() + 1);

        return LoanDTO.fromEntity(loanRepository.save(loan));
    }

    @Transactional
    public LoanDTO payFine(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));

        if (loan.getFine().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("No fine due for loan #" + loanId);
        }

        if (loan.isFinePaid()) {
            throw new BadRequestException("Fine for loan #" + loanId + " is already cleared");
        }

        loan.setFinePaid(true);
        loan.setFinePaidAt(java.time.LocalDateTime.now());
        return LoanDTO.fromEntity(loanRepository.save(loan));
    }

    @Transactional
    public LoanDTO reportLostOrDamaged(Long loanId, String status, BigDecimal penalty) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));

        loan.setRemarks(status);
        if (penalty != null && penalty.compareTo(BigDecimal.ZERO) > 0) {
            loan.setFine(loan.getFine().add(penalty));
        }

        Book book = loan.getBook();
        if (book.getTotalCopies() > 0) {
            book.setTotalCopies(book.getTotalCopies() - 1);
        }
        bookRepository.save(book);

        return LoanDTO.fromEntity(loanRepository.save(loan));
    }

    public List<LoanDTO> getMemberLoans(Long memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));
        return loanRepository.findByMemberOrderByIssueDateDesc(member).stream()
                .map(LoanDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<LoanDTO> getMemberActiveLoans(Long memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));
        return loanRepository.findByMemberAndReturnedFalseOrderByDueDateAsc(member).stream()
                .map(LoanDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<LoanDTO> getAllActiveLoans() {
        return loanRepository.findByReturnedFalse().stream()
                .map(LoanDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<LoanDTO> getOverdueLoans() {
        return loanRepository.findOverdueLoans(LocalDate.now()).stream()
                .map(LoanDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public DashboardStatsDTO getDashboardStats() {
        long totalBooks = bookRepository.count();
        long availableBooks = bookRepository.countByAvailableCopiesGreaterThan(0);
        long totalMembers = userRepository.countByRole(Role.MEMBER);
        long activeLoans = loanRepository.countByReturnedFalse();
        long overdueLoans = loanRepository.countOverdueLoans(LocalDate.now());
        long totalCopies = bookRepository.findAll().stream()
                .mapToLong(b -> b.getTotalCopies())
                .sum();

        return new DashboardStatsDTO(totalBooks, availableBooks, totalMembers,
                activeLoans, overdueLoans, totalCopies);
    }
}
