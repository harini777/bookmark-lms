package com.bookmark.dto;

import com.bookmark.entity.Loan;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class LoanDTO {
    private Long id;
    private Long memberId;
    private String memberName;
    private String memberUsername;
    private Long bookId;
    private String bookTitle;
    private String bookIsbn;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private LocalDate returnDate;
    private boolean returned;
    private BigDecimal fine;
    private boolean finePaid;
    private LocalDateTime finePaidAt;
    private int renewalCount;
    private String remarks;
    private LocalDateTime createdAt;

    public static LoanDTO fromEntity(Loan loan) {
        LoanDTO dto = new LoanDTO();
        dto.setId(loan.getId());
        dto.setMemberId(loan.getMember().getId());
        dto.setMemberName(loan.getMember().getFullName());
        dto.setMemberUsername(loan.getMember().getUsername());
        dto.setBookId(loan.getBook().getId());
        dto.setBookTitle(loan.getBook().getTitle());
        dto.setBookIsbn(loan.getBook().getIsbn());
        dto.setIssueDate(loan.getIssueDate());
        dto.setDueDate(loan.getDueDate());
        dto.setReturnDate(loan.getReturnDate());
        dto.setReturned(loan.isReturned());
        dto.setFine(loan.getFine());
        dto.setFinePaid(loan.isFinePaid());
        dto.setFinePaidAt(loan.getFinePaidAt());
        dto.setRenewalCount(loan.getRenewalCount());
        dto.setRemarks(loan.getRemarks());
        dto.setCreatedAt(loan.getCreatedAt());
        return dto;
    }
}
