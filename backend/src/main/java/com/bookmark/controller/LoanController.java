package com.bookmark.controller;

import com.bookmark.dto.DashboardStatsDTO;
import com.bookmark.dto.IssueRequest;
import com.bookmark.dto.LoanDTO;
import com.bookmark.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping("/issue")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR')")
    public ResponseEntity<LoanDTO> issueBook(@Valid @RequestBody IssueRequest request,
                                              Authentication authentication) {
        return ResponseEntity.ok(loanService.issueBook(request, authentication.getName()));
    }

    @PatchMapping("/{loanId}/return")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR')")
    public ResponseEntity<LoanDTO> returnBook(@PathVariable Long loanId) {
        return ResponseEntity.ok(loanService.returnBook(loanId));
    }

    @PatchMapping("/{loanId}/renew")
    public ResponseEntity<LoanDTO> renewBook(@PathVariable Long loanId, Authentication authentication) {
        return ResponseEntity.ok(loanService.renewBook(loanId, authentication.getName()));
    }

    @PatchMapping("/{loanId}/pay-fine")
    public ResponseEntity<LoanDTO> payFine(@PathVariable Long loanId) {
        return ResponseEntity.ok(loanService.payFine(loanId));
    }

    @PostMapping("/{loanId}/report")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR')")
    public ResponseEntity<LoanDTO> reportBook(@PathVariable Long loanId,
                                              @RequestParam String status,
                                              @RequestParam(required = false) java.math.BigDecimal penalty) {
        return ResponseEntity.ok(loanService.reportLostOrDamaged(loanId, status, penalty));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR')")
    public ResponseEntity<List<LoanDTO>> getAllActiveLoans() {
        return ResponseEntity.ok(loanService.getAllActiveLoans());
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR')")
    public ResponseEntity<List<LoanDTO>> getOverdueLoans() {
        return ResponseEntity.ok(loanService.getOverdueLoans());
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<LoanDTO>> getMemberLoans(@PathVariable Long memberId,
                                                         Authentication authentication) {
        return ResponseEntity.ok(loanService.getMemberLoans(memberId));
    }

    @GetMapping("/member/{memberId}/active")
    public ResponseEntity<List<LoanDTO>> getMemberActiveLoans(@PathVariable Long memberId) {
        return ResponseEntity.ok(loanService.getMemberActiveLoans(memberId));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR')")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(loanService.getDashboardStats());
    }
}
