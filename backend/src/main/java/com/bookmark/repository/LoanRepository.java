package com.bookmark.repository;

import com.bookmark.entity.Loan;
import com.bookmark.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByMemberOrderByIssueDateDesc(User member);

    List<Loan> findByMemberAndReturnedFalseOrderByDueDateAsc(User member);

    List<Loan> findByReturnedFalse();

    @Query("SELECT l FROM Loan l WHERE l.returned = false AND l.dueDate < :today")
    List<Loan> findOverdueLoans(@Param("today") LocalDate today);

    long countByReturnedFalse();

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.returned = false AND l.dueDate < :today")
    long countOverdueLoans(@Param("today") LocalDate today);

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.member = :member AND l.returned = false")
    long countActiveLoansForMember(@Param("member") User member);

    boolean existsByMemberAndBookAndReturnedFalse(User member, com.bookmark.entity.Book book);
}
