package com.bookmark.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalBooks;
    private long availableBooks;
    private long totalMembers;
    private long activeLoans;
    private long overdueLoans;
    private long totalCopies;
}
