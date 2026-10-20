package com.bookmark.service;

import com.bookmark.dto.ReportDTO;
import com.bookmark.entity.*;
import com.bookmark.repository.BookRepository;
import com.bookmark.repository.LoanRepository;
import com.bookmark.repository.ReservationRepository;
import com.bookmark.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BookRepository bookRepository;
    private final LoanRepository loanRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    public ReportDTO generateComprehensiveReport() {
        ReportDTO report = new ReportDTO();

        // Books / Inventory
        List<Book> allBooks = bookRepository.findAll();
        report.setTotalTitles(allBooks.size());
        long totalCopies = allBooks.stream().mapToLong(Book::getTotalCopies).sum();
        long availCopies = allBooks.stream().mapToLong(Book::getAvailableCopies).sum();
        report.setTotalCopies(totalCopies);
        report.setAvailableCopies(availCopies);
        report.setIssuedCopies(Math.max(0, totalCopies - availCopies));

        Map<String, Long> categoryCount = allBooks.stream()
                .collect(Collectors.groupingBy(
                        b -> (b.getCategory() == null || b.getCategory().isBlank()) ? "Uncategorized" : b.getCategory(),
                        Collectors.counting()
                ));
        report.setCategoryBreakdown(categoryCount);

        // Loans / Circulation
        List<Loan> allLoans = loanRepository.findAll();
        report.setTotalLoansIssued(allLoans.size());
        long activeCount = allLoans.stream().filter(l -> !l.isReturned()).count();
        long returnedCount = allLoans.stream().filter(Loan::isReturned).count();
        long overdueCount = allLoans.stream().filter(l -> !l.isReturned() && l.getDueDate().isBefore(LocalDate.now())).count();
        report.setActiveLoans(activeCount);
        report.setReturnedLoans(returnedCount);
        report.setOverdueLoans(overdueCount);

        // Reservations
        List<Reservation> allRes = reservationRepository.findAll();
        report.setTotalReservations(allRes.size());
        report.setActiveReservations(allRes.stream().filter(r -> r.getStatus() == ReservationStatus.ACTIVE).count());

        // Fines
        BigDecimal totalAssessed = allLoans.stream()
                .map(l -> l.getFine() == null ? BigDecimal.ZERO : l.getFine())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCollected = allLoans.stream()
                .filter(Loan::isFinePaid)
                .map(l -> l.getFine() == null ? BigDecimal.ZERO : l.getFine())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPending = totalAssessed.subtract(totalCollected);

        report.setTotalFinesAssessed(totalAssessed);
        report.setTotalFinesCollected(totalCollected);
        report.setTotalFinesPending(totalPending.max(BigDecimal.ZERO));

        // Member Summary
        List<User> members = userRepository.findByRole(Role.MEMBER);
        List<Map<String, Object>> memberList = members.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("username", m.getUsername());
            map.put("fullName", m.getFullName());
            map.put("email", m.getEmail());
            map.put("status", m.getStatus().name());
            return map;
        }).collect(Collectors.toList());
        report.setMemberSummary(memberList);

        // Recent transactions
        List<Map<String, Object>> recentTx = allLoans.stream()
                .sorted(Comparator.comparing(Loan::getId).reversed())
                .limit(10)
                .map(l -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", l.getId());
                    map.put("bookTitle", l.getBook().getTitle());
                    map.put("memberName", l.getMember().getFullName());
                    map.put("issueDate", l.getIssueDate().toString());
                    map.put("dueDate", l.getDueDate().toString());
                    map.put("returned", l.isReturned());
                    map.put("fine", l.getFine());
                    map.put("finePaid", l.isFinePaid());
                    return map;
                }).collect(Collectors.toList());
        report.setRecentTransactions(recentTx);

        return report;
    }
}
