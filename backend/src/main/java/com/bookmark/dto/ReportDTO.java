package com.bookmark.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class ReportDTO {
    // Inventory Report
    private long totalTitles;
    private long totalCopies;
    private long availableCopies;
    private long issuedCopies;
    private Map<String, Long> categoryBreakdown;

    // Circulation Report
    private long totalLoansIssued;
    private long activeLoans;
    private long returnedLoans;
    private long overdueLoans;
    private long totalReservations;
    private long activeReservations;

    // Fine Collection Report
    private BigDecimal totalFinesAssessed;
    private BigDecimal totalFinesCollected;
    private BigDecimal totalFinesPending;

    // Detailed lists for printable reports
    private List<Map<String, Object>> recentTransactions;
    private List<Map<String, Object>> memberSummary;
}
